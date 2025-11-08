import { PublicKey, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { readFileSync } from "fs";
import { join } from "path";
import { driftSetup } from "./lib/setup";
import {
  deriveBankWithSeed,
  deriveMarginfiAccount,
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
  console.log("Amount:", amountStr);
  console.log();

  // Setup connection and program
  const { connection, wallet, program } = driftSetup(config.programId);

  // Parse config values
  const groupPubkey = new PublicKey(config.group);
  const bankMint = new PublicKey(config.bankMint);
  const driftOracle = new PublicKey(config.driftOracle);
  const seed = new BN(config.seed);

  // Derive accounts
  const [bankPubkey] = deriveBankWithSeed(
    program.programId,
    groupPubkey,
    bankMint,
    seed
  );

  const [marginfiAccount] = deriveMarginfiAccount(
    program.programId,
    groupPubkey,
    wallet.publicKey,
    0
  );

  const [driftState] = deriveDriftStatePDA();
  const [driftSpotMarketVault] = deriveSpotMarketVaultPDA(config.driftMarketIndex);

  const signerTokenAccount = getAssociatedTokenAddressSync(
    bankMint,
    wallet.publicKey
  );

  console.log("Derived Accounts:");
  console.log("  Bank:", bankPubkey.toString());
  console.log("  Marginfi Account:", marginfiAccount.toString());
  console.log("  Drift State:", driftState.toString());
  console.log("  Signer Token Account:", signerTokenAccount.toString());
  console.log();

  // Build instruction (authority is auto-resolved from marginfiAccount)
  const ix = await program.methods
    .driftDeposit(amount)
    .accounts({
      marginfiAccount: marginfiAccount,
      bank: bankPubkey,
      signerTokenAccount: signerTokenAccount,
      driftState: driftState,
      driftSpotMarketVault: driftSpotMarketVault,
      driftOracle: driftOracle,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .instruction();

  const transaction = new Transaction().add(ix);

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
