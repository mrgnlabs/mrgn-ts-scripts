import {
  PublicKey,
  Transaction,
  TransactionMessage,
  VersionedTransaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { commonSetup } from "../../lib/common-setup";
import { loadEnvFile } from "../utils";

/**
 * Transfer Group Admin Authority Script
 *
 * This script transfers ALL admin authorities of a marginfi group to a new address.
 * It transfers 5 different admin roles:
 * - General Admin (primary authority)
 * - E-mode Admin (emergency mode configuration)
 * - Curve Admin (interest rate curve management)
 * - Limit Admin (borrow/deposit limit configuration)
 * - Emissions Admin (liquidity mining emissions)
 *
 * MODES:
 * 1. Simulation (sendTx = false, simulate = true): Tests transaction with sigVerify off
 * 2. Multisig prep (sendTx = false, simulate = false): Outputs base58 tx for Squads
 * 3. Direct execution (sendTx = true): Signs and broadcasts immediately
 *
 * See README.md in this directory for detailed usage instructions.
 */

/**
 * If true, send the tx. If false, simulate only.
 */
const sendTx = true;

type Config = {
  /** Marginfi program ID */
  PROGRAM_ID: string;

  /** The marginfi group to transfer admin authority for */
  GROUP: PublicKey;

  /** The new admin address that will receive ALL admin authorities */
  NEW_ADMIN: PublicKey;
};

/**
 * CONFIGURATION
 *
 * Update these values before running:
 * - GROUP: The marginfi group to modify
 * - NEW_ADMIN: The address that will become the new admin for ALL roles
 *
 * Wallet is loaded from MARGINFI_WALLET env var (set in .env file)
 */
const config: Config = {
  PROGRAM_ID: "5UDghkpgW1HfYSrmEj2iAApHShqU44H6PKTAar9LL9bY",

  // EXAMPLE - UPDATE THESE VALUES:
  GROUP: new PublicKey("ERBiJdWtnVBBd4gFm7YVHT3a776x5NbGbJBR5BDvsxtj"),
  NEW_ADMIN: new PublicKey("6QXw5bWtMcHBVPoqedh7hdwnetfQyKSZ19Vh1xrCvmym"),
};

async function main() {
  // Load environment variables
  loadEnvFile(".env");
  let walletPath = process.env.MARGINFI_WALLET;

  if (!walletPath) {
    throw new Error("MARGINFI_WALLET not set in .env file");
  }

  // commonSetup prepends process.env.HOME to the path, so if walletPath is absolute,
  // we need to strip the HOME prefix
  if (walletPath.startsWith(process.env.HOME || "")) {
    walletPath = walletPath.substring((process.env.HOME || "").length);
  }

  const user = commonSetup(
    sendTx,
    config.PROGRAM_ID,
    walletPath,
    undefined,
    "current"
  );
  const program = user.program;
  const connection = user.connection;

  console.log("=== Transfer Group Admin Authority ===\n");
  console.log("Group:", config.GROUP.toString());
  console.log("New Admin (all roles):", config.NEW_ADMIN.toString());
  console.log("Mode:", sendTx ? "EXECUTE" : "SIMULATE");
  console.log();

  // Fetch current group state
  console.log("Fetching current group state...");
  const groupBefore = await program.account.marginfiGroup.fetch(config.GROUP);

  console.log("\nCurrent Admins:");
  console.log("  General Admin:", groupBefore.admin.toString());
  console.log("  E-mode Admin:", groupBefore.emodeAdmin.toString());
  console.log("  Curve Admin:", groupBefore.delegateCurveAdmin.toString());
  console.log("  Limit Admin:", groupBefore.delegateLimitAdmin.toString());
  console.log("  Emissions Admin:", groupBefore.delegateEmissionsAdmin.toString());
  console.log();

  // Build transaction
  console.log("Building transaction...");
  const transaction = new Transaction();
  transaction.add(
    await program.methods
      .marginfiGroupConfigure(
        config.NEW_ADMIN,  // new general admin
        config.NEW_ADMIN,  // new emode admin
        config.NEW_ADMIN,  // new curve admin
        config.NEW_ADMIN,  // new limit admin
        config.NEW_ADMIN,  // new emissions admin
        false              // isArenaGroup
      )
      .accounts({
        marginfiGroup: config.GROUP,
      })
      .instruction()
  );

  // First, simulate the transaction to get program logs
  console.log("Simulating transaction to verify...\n");
  transaction.feePayer = user.wallet.publicKey;
  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;

  const simulation = await connection.simulateTransaction(transaction);

  console.log("Simulation Results:");
  console.log("==================\n");

  if (simulation.value.logs) {
    console.log("Program Logs:");
    simulation.value.logs.forEach(log => console.log("  " + log));
    console.log();
  }

  if (simulation.value.err) {
    console.log("✗ Simulation FAILED");
    console.log("Error:", JSON.stringify(simulation.value.err, null, 2));
    console.log("\nCompute units consumed:", simulation.value.unitsConsumed);
    throw new Error("Simulation failed - transaction would not succeed");
  }

  console.log("✓ Simulation successful!");
  console.log("Compute units consumed:", simulation.value.unitsConsumed);
  console.log();

  // Now execute the transaction
  console.log("Executing transaction...");
  try {
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [user.wallet.payer]
    );
    console.log("\n✓ Transaction successful!");
    console.log("Signature:", signature);
    console.log("Explorer:", `https://solscan.io/tx/${signature}`);
  } catch (error: any) {
    console.error("\n✗ Transaction failed:", error.message || error);
    throw error;
  }

  // Verify changes
  console.log("\nVerifying changes...");
  const groupAfter = await program.account.marginfiGroup.fetch(config.GROUP);

  console.log("\nNew Admins:");
  console.log("  General Admin:", groupAfter.admin.toString(), groupAfter.admin.equals(config.NEW_ADMIN) ? "✓" : "✗");
  console.log("  E-mode Admin:", groupAfter.emodeAdmin.toString(), groupAfter.emodeAdmin.equals(config.NEW_ADMIN) ? "✓" : "✗");
  console.log("  Curve Admin:", groupAfter.delegateCurveAdmin.toString(), groupAfter.delegateCurveAdmin.equals(config.NEW_ADMIN) ? "✓" : "✗");
  console.log("  Limit Admin:", groupAfter.delegateLimitAdmin.toString(), groupAfter.delegateLimitAdmin.equals(config.NEW_ADMIN) ? "✓" : "✗");
  console.log("  Emissions Admin:", groupAfter.delegateEmissionsAdmin.toString(), groupAfter.delegateEmissionsAdmin.equals(config.NEW_ADMIN) ? "✓" : "✗");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
