import {
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
  SystemProgram,
} from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import {
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getMint,
  createAssociatedTokenAccountIdempotentInstruction,
} from "@solana/spl-token";
import { readFileSync } from "fs";
import { join } from "path";
import {
  parseConfig,
  Config,
  deriveJuplendCpiAccounts,
  findJuplendLendingAdminPda,
  findJuplendClaimAccountPda,
  JUPLEND_LENDING_PROGRAM_ID,
} from "./lib/utils";
import {
  deriveBankWithSeed,
  deriveLiquidityVaultAuthority,
} from "../common/pdas";
import { commonSetup } from "../../lib/common-setup";
import { bs58 } from "@switchboard-xyz/common";

const sendTx = false;

async function main() {
  const configFile = process.argv[2];
  const accountStr = process.argv[3];
  const amountStr = process.argv[4];
  const withdrawAll = process.argv.includes("--all");

  if (!configFile || !accountStr || !amountStr) {
    console.error(
      "Usage: tsx scripts/juplend/withdraw.ts"
      + " <config-file> <marginfi-account>"
      + " <amount> [--all]",
    );
    console.error(
      "Example: tsx scripts/juplend/withdraw.ts"
      + " configs/stage/usdc.json"
      + " 89ViS63Bo... 100000",
    );
    console.error(
      "  --all  Withdraw entire balance"
      + " (amount still required but ignored)",
    );
    process.exit(1);
  }

  const configPath = join(__dirname, configFile);
  const rawConfig = readFileSync(configPath, "utf8");
  const config = parseConfig(rawConfig);
  const account = new PublicKey(accountStr);
  const amount = new BN(amountStr);

  const programId = new PublicKey(config.PROGRAM_ID);
  const [bank] = deriveBankWithSeed(
    programId,
    config.GROUP_KEY,
    config.BANK_MINT,
    config.SEED,
  );

  console.log("=== JupLend Withdraw ===\n");
  console.log("Config:", configFile);
  console.log("Bank:", bank.toString());
  console.log("Account:", account.toString());
  console.log("Mint:", config.BANK_MINT.toString());
  console.log("Amount:", amount.toString(), "base units");
  console.log("Withdraw all:", withdrawAll);
  console.log();

  await withdrawJuplend(
    sendTx,
    config,
    bank,
    account,
    amount,
    withdrawAll,
    "/keys/staging-deploy.json",
  );
}

export async function withdrawJuplend(
  sendTx: boolean,
  config: Config,
  bank: PublicKey,
  account: PublicKey,
  amount: BN,
  withdrawAll: boolean,
  walletPath: string,
  version?: "current",
) {
  const user = commonSetup(
    sendTx,
    config.PROGRAM_ID,
    walletPath,
    config.MULTISIG_PAYER,
    version,
  );
  const connection = user.connection;
  const wallet = user.wallet;
  const program = user.program;

  const payerKey = sendTx
    ? wallet.publicKey
    : config.MULTISIG_PAYER;

  if (!payerKey) {
    throw new Error(
      "MULTISIG_PAYER must be set when sendTx = false",
    );
  }

  // Fetch bank to get mint and integration accounts
  const bankData = await program.account.bank.fetch(bank);
  const mint = bankData.mint;
  const juplendLending = bankData.integrationAcc1;
  const juplendFTokenVault = bankData.integrationAcc2;
  const withdrawIntermediaryAta = bankData.integrationAcc3;
  const group = bankData.group;

  // Detect token program
  let tokenProgram = TOKEN_PROGRAM_ID;
  try {
    await getMint(
      connection,
      mint,
      "confirmed",
      TOKEN_2022_PROGRAM_ID,
    );
    tokenProgram = TOKEN_2022_PROGRAM_ID;
    console.log("Detected Token-2022 mint");
  } catch {
    console.log("Detected SPL Token mint");
  }

  // Derive JupLend CPI accounts
  const [lendingAdmin] = findJuplendLendingAdminPda();
  const juplendAccounts = deriveJuplendCpiAccounts(
    mint,
    tokenProgram,
  );

  // Derive claim account PDA
  const [liquidityVaultAuthority] =
    deriveLiquidityVaultAuthority(program.programId, bank);
  const [claimAccount] = findJuplendClaimAccountPda(
    liquidityVaultAuthority,
    mint,
  );

  // Fetch Lending account
  const lendingInfo =
    await connection.getAccountInfo(juplendLending);
  if (!lendingInfo) {
    throw new Error(
      "JupLend Lending not found: "
      + juplendLending.toString(),
    );
  }
  const fTokenMint = new PublicKey(
    lendingInfo.data.slice(40, 72),
  );
  const supplyTokenReservesLiquidity = new PublicKey(
    lendingInfo.data.slice(131, 163),
  );
  const lendingSupplyPositionOnLiquidity = new PublicKey(
    lendingInfo.data.slice(163, 195),
  );

  const destinationTokenAccount =
    getAssociatedTokenAddressSync(
      mint,
      payerKey,
      false,
      tokenProgram,
    );

  const transaction = new Transaction();

  // Create destination ATA idempotently
  transaction.add(
    createAssociatedTokenAccountIdempotentInstruction(
      payerKey,
      destinationTokenAccount,
      payerKey,
      mint,
      tokenProgram,
    ),
  );

  const withdrawIx = await program.methods
    .juplendWithdraw(
      amount,
      withdrawAll ? true : null,
    )
    .accounts({
      group,
      marginfiAccount: account,
      bank,
      destinationTokenAccount,
      mint,
      integrationAcc1: juplendLending,
      fTokenMint,
      integrationAcc2: juplendFTokenVault,
      integrationAcc3: withdrawIntermediaryAta,
      lendingAdmin,
      supplyTokenReservesLiquidity,
      lendingSupplyPositionOnLiquidity,
      rateModel: juplendAccounts.rateModel,
      vault: juplendAccounts.vault,
      claimAccount,
      liquidity: juplendAccounts.liquidity,
      liquidityProgram: juplendAccounts.liquidityProgram,
      rewardsRateModel: juplendAccounts.rewardsRateModel,
      juplendProgram: JUPLEND_LENDING_PROGRAM_ID,
      tokenProgram,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .instruction();

  transaction.add(withdrawIx);

  // Simulate
  transaction.feePayer = payerKey;
  const { blockhash } =
    await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;

  console.log("Simulating juplendWithdraw...");
  const simulation =
    await connection.simulateTransaction(transaction);

  console.log("\nProgram Logs:");
  simulation.value.logs?.forEach((log) =>
    console.log("  " + log),
  );

  if (simulation.value.err) {
    console.log("\nSimulation failed:");
    console.log(
      JSON.stringify(simulation.value.err, null, 2),
    );
    process.exit(1);
  }

  console.log("\nSimulation successful!");
  console.log(
    "Compute units:",
    simulation.value.unitsConsumed,
  );
  console.log();

  if (sendTx) {
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [wallet.payer],
    );
    console.log("Signature:", signature);
    console.log("Withdrawal successful!");
  } else {
    const serialized = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    });
    console.log("withdraw from:", bank.toString());
    console.log("by account:", account.toString());
    console.log(
      "Base58-encoded transaction:",
      bs58.encode(serialized),
    );
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
