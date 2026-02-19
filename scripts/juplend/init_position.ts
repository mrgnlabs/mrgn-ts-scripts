import {
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
  SystemProgram,
} from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import {
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getMint,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  createSyncNativeInstruction,
  NATIVE_MINT,
} from "@solana/spl-token";
import {
  deriveJuplendCpiAccounts,
  findJuplendLendingAdminPda,
  JUPLEND_LENDING_PROGRAM_ID,
} from "./lib/utils";
import { deriveLiquidityVaultAuthority } from "../common/pdas";
import { commonSetup } from "../../lib/common-setup";
import { bs58 } from "@switchboard-xyz/common";

/**
 * If true, send the tx. If false, output the unsigned b58 tx to console.
 */
const sendTx = false;

type Config = {
  PROGRAM_ID: string;
  BANK: PublicKey;
  AMOUNT: BN;
  MULTISIG_PAYER?: PublicKey;
};

const config: Config = {
  PROGRAM_ID: "stag8sTKds2h4KzjUw3zKTsxbqvT4XKHdaR9X9E6Rct",
  BANK: new PublicKey("8qPLKaKb4F5BC6mVncKAryMp78yp5ZRGYnPkQbt9ikKt"),
  AMOUNT: new BN(10000),
};

async function main() {
  await initJuplendPosition(sendTx, config, "/keys/staging-deploy.json");
}

export async function initJuplendPosition(
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

  console.log("=== JupLend Init Position ===\n");
  console.log("Bank:", config.BANK.toString());
  console.log("Mint:", mint.toString());
  console.log("Amount:", config.AMOUNT.toString(), "base units");
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

  // Derive accounts
  const [liquidityVaultAuthority] = deriveLiquidityVaultAuthority(
    program.programId,
    config.BANK,
  );
  const [lendingAdmin] = findJuplendLendingAdminPda();
  const juplendAccounts = deriveJuplendCpiAccounts(mint, tokenProgram);

  // Fetch JupLend Lending account to get supplyTokenReservesLiquidity
  // and lendingSupplyPositionOnLiquidity
  const lendingInfo = await connection.getAccountInfo(juplendLending);
  if (!lendingInfo) {
    throw new Error(`JupLend Lending not found: ${juplendLending.toString()}`);
  }
  // fTokenMint at offset 8+32 = 40
  const fTokenMint = new PublicKey(lendingInfo.data.slice(40, 72));
  // token_reserves_liquidity at offset 131
  const supplyTokenReservesLiquidity = new PublicKey(
    lendingInfo.data.slice(131, 163),
  );
  // supply_position_on_liquidity at offset 163
  const lendingSupplyPositionOnLiquidity = new PublicKey(
    lendingInfo.data.slice(163, 195),
  );

  const signerTokenAccount = getAssociatedTokenAddressSync(
    mint,
    wallet.publicKey,
    false,
    tokenProgram,
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );

  console.log("Derived accounts:");
  console.log("  liquidityVaultAuthority:", liquidityVaultAuthority.toString());
  console.log("  lendingAdmin:", lendingAdmin.toString());
  console.log("  fTokenMint:", fTokenMint.toString());
  console.log(
    "  supplyTokenReserves:",
    supplyTokenReservesLiquidity.toString(),
  );
  console.log("  supplyPosition:", lendingSupplyPositionOnLiquidity.toString());
  console.log();

  const transaction = new Transaction();

  // Handle WSOL wrapping if needed
  const isWsol = mint.equals(NATIVE_MINT);
  if (isWsol) {
    const ataInfo = await connection.getAccountInfo(signerTokenAccount);
    if (!ataInfo) {
      transaction.add(
        createAssociatedTokenAccountInstruction(
          wallet.publicKey,
          signerTokenAccount,
          wallet.publicKey,
          mint,
          tokenProgram,
          ASSOCIATED_TOKEN_PROGRAM_ID,
        ),
      );
    }
    console.log(`Wrapping ${config.AMOUNT.toString()} lamports as WSOL...`);
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: signerTokenAccount,
        lamports: config.AMOUNT.toNumber(),
      }),
    );
    transaction.add(
      createSyncNativeInstruction(signerTokenAccount, tokenProgram),
    );
  }

  const initPositionIx = await program.methods
    .juplendInitPosition(config.AMOUNT)
    .accounts({
      feePayer: wallet.publicKey,
      signerTokenAccount,
      bank: config.BANK,
      mint,
      integrationAcc1: juplendLending,
      fTokenMint,
      integrationAcc2: juplendFTokenVault,
      lendingAdmin,
      supplyTokenReservesLiquidity,
      lendingSupplyPositionOnLiquidity,
      rateModel: juplendAccounts.rateModel,
      vault: juplendAccounts.vault,
      liquidity: juplendAccounts.liquidity,
      liquidityProgram: juplendAccounts.liquidityProgram,
      rewardsRateModel: juplendAccounts.rewardsRateModel,
      juplendProgram: JUPLEND_LENDING_PROGRAM_ID,
      tokenProgram,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .instruction();

  transaction.add(initPositionIx);

  // Simulate + send
  transaction.feePayer = wallet.publicKey;
  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;

  console.log("Simulating juplendInitPosition...");
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
      console.log("Position initialized!");
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
    console.log("bank key: " + config.BANK);
    console.log("Base58-encoded transaction:", base58Transaction);
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
  });
}
