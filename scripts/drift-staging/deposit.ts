import { PublicKey, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID, getMint, createAssociatedTokenAccountIdempotentInstruction } from "@solana/spl-token";
import { readFileSync } from "fs";
import { join } from "path";
import { userSetup } from "./lib/user_setup";
import {
  deriveDriftStatePDA,
  deriveSpotMarketVaultPDA,
} from "./lib/utils";

/**
 * Drift Deposit Script
 *
 * Deposits tokens into a drift-enabled marginfi bank.
 *
 * Usage: npx ts-node scripts/drift-staging/deposit.ts <config-file> <amount>
 * Example: npx ts-node scripts/drift-staging/deposit.ts configs/usdc.json 1000
 */

async function main() {
  // Get config file and amount from args
  const configFile = process.argv[2];
  const amountStr = process.argv[3];

  if (!configFile || !amountStr) {
    console.error("Usage: npx ts-node scripts/drift-staging/deposit.ts <config-file> <amount>");
    console.error("Example: npx ts-node scripts/drift-staging/deposit.ts configs/usdc.json 1000");
    process.exit(1);
  }

  // Load config
  const configPath = join(__dirname, configFile);
  const config = JSON.parse(readFileSync(configPath, "utf-8"));

  const amount = new BN(amountStr);

  console.log("=== Drift Deposit ===\n");
  console.log("Config:", configFile);
  console.log("Bank mint:", config.bankMint);
  console.log("Amount:", amountStr, "base units");
  console.log();

  // Setup connection and program with USER_WALLET
  const { connection, wallet, program } = userSetup(config.programId);

  // Parse config values
  const bankMint = new PublicKey(config.bankMint);
  const driftOracle = new PublicKey(config.driftOracle);
  const bankPubkey = new PublicKey(config.bankAddress);
  const marginfiAccount = new PublicKey(config.userMarginfiAccount);

  const [driftState] = deriveDriftStatePDA();
  const [driftSpotMarketVault] = deriveSpotMarketVaultPDA(config.driftMarketIndex);

  // Detect token program
  let tokenProgram = TOKEN_PROGRAM_ID;
  try {
    await getMint(connection, bankMint, "confirmed", TOKEN_2022_PROGRAM_ID);
    tokenProgram = TOKEN_2022_PROGRAM_ID;
    console.log("Detected Token-2022 mint");
  } catch {
    console.log("Detected SPL Token mint");
  }

  const signerTokenAccount = getAssociatedTokenAddressSync(
    bankMint,
    wallet.publicKey,
    false,
    tokenProgram
  );

  console.log("Derived Accounts:");
  console.log("  Bank:", bankPubkey.toString());
  console.log("  Marginfi Account:", marginfiAccount.toString());
  console.log("  Drift State:", driftState.toString());
  console.log("  Signer Token Account:", signerTokenAccount.toString());
  console.log();

  // Create transaction with ATA creation
  const transaction = new Transaction();

  // Add create ATA instruction (idempotent - only creates if doesn't exist)
  transaction.add(
    createAssociatedTokenAccountIdempotentInstruction(
      wallet.publicKey,
      signerTokenAccount,
      wallet.publicKey,
      bankMint,
      tokenProgram
    )
  );

  // Build deposit instruction (authority is auto-resolved from marginfiAccount)
  const depositIx = await program.methods
    .driftDeposit(amount)
    .accounts({
      marginfiAccount: marginfiAccount,
      bank: bankPubkey,
      signerTokenAccount: signerTokenAccount,
      driftState: driftState,
      driftSpotMarketVault: driftSpotMarketVault,
      driftOracle: driftOracle,
      tokenProgram: tokenProgram,
    })
    .instruction();

  transaction.add(depositIx);

  // Simulate
  transaction.feePayer = wallet.publicKey;
  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;

  console.log("Simulating driftDeposit...");
  const simulation = await connection.simulateTransaction(transaction);

  console.log("\nProgram Logs:");
  simulation.value.logs?.forEach(log => console.log("  " + log));

  if (simulation.value.err) {
    console.log("\nSimulation failed:");
    console.log(JSON.stringify(simulation.value.err, null, 2));
    process.exit(1);
  }

  console.log("\nSimulation successful!");
  console.log("Compute units:", simulation.value.unitsConsumed);
  console.log();

  // Execute
  console.log("Executing transaction...");
  const signature = await sendAndConfirmTransaction(
    connection,
    transaction,
    [wallet.payer]
  );

  console.log("✓ Deposit successful!");
  console.log("Signature:", signature);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
