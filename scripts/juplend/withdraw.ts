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
import {
  deriveJuplendCpiAccounts,
  findJuplendLendingAdminPda,
  findJuplendClaimAccountPda,
  JUPLEND_LENDING_PROGRAM_ID,
} from "./lib/utils";
import { deriveLiquidityVaultAuthority } from "../common/pdas";
import { commonSetup } from "../../lib/common-setup";
import { bs58 } from "@switchboard-xyz/common";

const sendTx = true;

type Config = {
  PROGRAM_ID: string;
  BANK: PublicKey;
  ACCOUNT: PublicKey;
  AMOUNT: BN;
  WITHDRAW_ALL: boolean;
  MULTISIG_PAYER?: PublicKey;
};

const config: Config = {
  PROGRAM_ID: "stag8sTKds2h4KzjUw3zKTsxbqvT4XKHdaR9X9E6Rct",
  BANK: new PublicKey("8qPLKaKb4F5BC6mVncKAryMp78yp5ZRGYnPkQbt9ikKt"),
  ACCOUNT: new PublicKey("89ViS63BocuvZx5NE5oS9tBJ4ZbKZe3GkvurxHuSqFhz"),
  AMOUNT: new BN(1 * 10 ** 5),
  WITHDRAW_ALL: false,
};

async function main() {
  await withdrawJuplend(sendTx, config, "/keys/staging-deploy.json");
}

export async function withdrawJuplend(
  sendTx: boolean,
  config: Config,
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

  // Fetch bank to get mint and integration accounts
  const bankData = await program.account.bank.fetch(config.BANK);
  const mint = bankData.mint;
  const juplendLending = bankData.integrationAcc1;
  const juplendFTokenVault = bankData.integrationAcc2;
  const withdrawIntermediaryAta = bankData.integrationAcc3;
  const group = bankData.group;

  console.log("=== JupLend Withdraw ===\n");
  console.log("Bank mint:", mint.toString());
  console.log("Amount:", config.AMOUNT.toString(), "base units");
  console.log("Withdraw all:", config.WITHDRAW_ALL);
  console.log();

  // Detect token program
  let tokenProgram = TOKEN_PROGRAM_ID;
  try {
    await getMint(connection, mint, "confirmed", TOKEN_2022_PROGRAM_ID);
    tokenProgram = TOKEN_2022_PROGRAM_ID;
    console.log("Detected Token-2022 mint");
  } catch {
    console.log("Detected SPL Token mint");
  }

  // Derive JupLend CPI accounts
  const [lendingAdmin] = findJuplendLendingAdminPda();
  const juplendAccounts = deriveJuplendCpiAccounts(mint, tokenProgram);

  // Derive liquidity vault authority for claim account PDA
  const [liquidityVaultAuthority] = deriveLiquidityVaultAuthority(
    program.programId,
    config.BANK,
  );
  const [claimAccount] = findJuplendClaimAccountPda(
    liquidityVaultAuthority,
    mint,
  );

  // Fetch Lending account for supplyTokenReservesLiquidity and
  // lendingSupplyPositionOnLiquidity
  const lendingInfo = await connection.getAccountInfo(juplendLending);
  if (!lendingInfo) {
    throw new Error(`JupLend Lending not found: ${juplendLending.toString()}`);
  }
  const fTokenMint = new PublicKey(lendingInfo.data.slice(40, 72));
  const supplyTokenReservesLiquidity = new PublicKey(
    lendingInfo.data.slice(131, 163),
  );
  const lendingSupplyPositionOnLiquidity = new PublicKey(
    lendingInfo.data.slice(163, 195),
  );

  const destinationTokenAccount = getAssociatedTokenAddressSync(
    mint,
    wallet.publicKey,
    false,
    tokenProgram,
  );

  const transaction = new Transaction();

  // Create destination ATA idempotently
  transaction.add(
    createAssociatedTokenAccountIdempotentInstruction(
      wallet.publicKey,
      destinationTokenAccount,
      wallet.publicKey,
      mint,
      tokenProgram,
    ),
  );

  const withdrawIx = await program.methods
    .juplendWithdraw(config.AMOUNT, config.WITHDRAW_ALL ? true : null)
    .accounts({
      group,
      marginfiAccount: config.ACCOUNT,
      bank: config.BANK,
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
  transaction.feePayer = wallet.publicKey;
  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;

  console.log("Simulating juplendWithdraw...");
  const simulation = await connection.simulateTransaction(transaction);

  console.log("\nProgram Logs:");
  simulation.value.logs?.forEach((log) => console.log("  " + log));

  if (simulation.value.err) {
    console.log("\nSimulation failed:");
    console.log(JSON.stringify(simulation.value.err, null, 2));
    process.exit(1);
  }

  console.log("\nSimulation successful!");
  console.log("Compute units:", simulation.value.unitsConsumed);
  console.log();

  if (sendTx) {
    try {
      console.log("Executing transaction...");
      const signature = await sendAndConfirmTransaction(
        connection,
        transaction,
        [wallet.payer],
      );
      console.log("Signature:", signature);
      console.log("Withdrawal successful!");
    } catch (error) {
      console.error("Transaction failed:", error);
    }
  } else {
    transaction.feePayer = config.MULTISIG_PAYER;
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    const serializedTransaction = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    });
    const base58Transaction = bs58.encode(serializedTransaction);
    console.log("withdraw from: " + config.BANK);
    console.log("by account: " + config.ACCOUNT);
    console.log("Base58-encoded transaction:", base58Transaction);
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
  });
}
