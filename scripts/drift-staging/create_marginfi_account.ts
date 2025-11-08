import { PublicKey, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import { driftSetup } from "./lib/setup";
import { deriveMarginfiAccount } from "./lib/utils";

/**
 * Create Marginfi Account Script
 *
 * Creates a marginfi account for testing drift deposits/withdrawals.
 * One-time setup per wallet.
 *
 * Usage: npx ts-node scripts/drift-staging/create_marginfi_account.ts <program-id> <group>
 * Example: npx ts-node scripts/drift-staging/create_marginfi_account.ts PROGRAM_ID GROUP_PUBKEY
 */

async function main() {
  const programId = process.argv[2];
  const groupStr = process.argv[3];

  if (!programId || !groupStr) {
    console.error("Usage: npx ts-node scripts/drift-staging/create_marginfi_account.ts <program-id> <group>");
    console.error("Example: npx ts-node scripts/drift-staging/create_marginfi_account.ts PROGRAM_ID GROUP_PUBKEY");
    process.exit(1);
  }

  console.log("=== Create Marginfi Account ===\n");

  // Setup connection and program
  const { connection, wallet, program } = driftSetup(programId);
  const group = new PublicKey(groupStr);

  console.log("Program ID:", programId);
  console.log("Group:", groupStr);
  console.log("Authority:", wallet.publicKey.toString());
  console.log();

  // Derive marginfi account (seed 0)
  const [marginfiAccount] = deriveMarginfiAccount(
    program.programId,
    group,
    wallet.publicKey,
    0
  );

  console.log("Marginfi Account:", marginfiAccount.toString());
  console.log();

  // Build instruction
  const ix = await program.methods
    .marginfiAccountInitialize()
    .accounts({
      marginfiGroup: group,
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

  console.log("Simulating marginfiAccountInitialize...");
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

  console.log("✓ Marginfi account created successfully!");
  console.log("Signature:", signature);
  console.log("Account:", marginfiAccount.toString());
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
