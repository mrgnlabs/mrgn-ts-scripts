import { PublicKey, Transaction, sendAndConfirmTransaction, Keypair, SystemProgram } from "@solana/web3.js";
import { readFileSync } from "fs";
import { join } from "path";
import { userSetup } from "./lib/user_setup";

/**
 * Create Marginfi Account Script
 *
 * Creates a marginfi account for the user so they can deposit/borrow.
 * Uses USER_WALLET from .env
 *
 * Usage: npx ts-node scripts/drift-staging/create_marginfi_account.ts <config-file>
 * Example: npx ts-node scripts/drift-staging/create_marginfi_account.ts configs/usdc-staging.json
 */

async function main() {
  // Get config file from args
  const configFile = process.argv[2];

  if (!configFile) {
    console.error("Usage: npx ts-node scripts/drift-staging/create_marginfi_account.ts <config-file>");
    console.error("Example: npx ts-node scripts/drift-staging/create_marginfi_account.ts configs/usdc-staging.json");
    process.exit(1);
  }

  // Load config
  const configPath = join(__dirname, configFile);
  const config = JSON.parse(readFileSync(configPath, "utf-8"));

  console.log("=== Create Marginfi Account ===\n");
  console.log("Config:", configFile);
  console.log();

  // Setup connection and program with USER_WALLET
  const { connection, wallet, program } = userSetup(config.programId);

  // Parse config values
  const groupPubkey = new PublicKey(config.group);

  // Generate new keypair for the marginfi account
  const marginfiAccountKeypair = Keypair.generate();
  const marginfiAccount = marginfiAccountKeypair.publicKey;

  console.log("Marginfi account to create:", marginfiAccount.toString());
  console.log();

  // Build instruction to initialize marginfi account (regular keypair version)
  const ix = await program.methods
    .marginfiAccountInitialize()
    .accounts({
      marginfiGroup: groupPubkey,
      marginfiAccount: marginfiAccount,
      authority: wallet.publicKey,
      feePayer: wallet.publicKey,
    })
    .instruction();

  const transaction = new Transaction().add(ix);

  // Simulate
  transaction.feePayer = wallet.publicKey;
  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;

  console.log("\nSimulating marginfiAccountInitialize...");
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

  // Execute - need to sign with both wallet and marginfiAccountKeypair
  console.log("Executing transaction...");
  const signature = await sendAndConfirmTransaction(
    connection,
    transaction,
    [wallet.payer, marginfiAccountKeypair]
  );

  console.log("✓ Marginfi account created successfully!");
  console.log("Signature:", signature);
  console.log("Account address:", marginfiAccount.toString());
  console.log("\nSave this address - you'll need it for deposits!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
