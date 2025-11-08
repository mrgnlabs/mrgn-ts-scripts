import { PublicKey, Transaction, sendAndConfirmTransaction, AccountMeta } from "@solana/web3.js";
import { BN, Program } from "@coral-xyz/anchor";
import { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { readFileSync } from "fs";
import { join } from "path";
import { driftSetup } from "./lib/setup";
import {
  deriveBankWithSeed,
  deriveMarginfiAccount,
  deriveDriftStatePDA,
  deriveSpotMarketVaultPDA,
  deriveDriftSignerPDA,
  DRIFT_PROGRAM_ID,
} from "./lib/utils";
import { Drift } from "../../../idl/drift";
import driftIdl from "../../../idl/drift.json";

/**
 * Drift Withdraw Script
 *
 * Withdraws tokens from a drift-enabled marginfi bank.
 * Requires remaining accounts for ALL other active banks for health check.
 *
 * Usage: npx ts-node scripts/drift-staging/withdraw.ts <config-file> <amount> [withdraw-all]
 * Example: npx ts-node scripts/drift-staging/withdraw.ts configs/usdc.json 500
 * Example: npx ts-node scripts/drift-staging/withdraw.ts configs/usdc.json 0 true
 */

async function main() {
  // Get config file and amount from args
  const configFile = process.argv[2];
  const amountStr = process.argv[3];
  const withdrawAll = process.argv[4] === "true";

  if (!configFile || !amountStr) {
    console.error("Usage: npx ts-node scripts/drift-staging/withdraw.ts <config-file> <amount> [withdraw-all]");
    console.error("Example: npx ts-node scripts/drift-staging/withdraw.ts configs/usdc.json 500");
    console.error("Example: npx ts-node scripts/drift-staging/withdraw.ts configs/usdc.json 0 true");
    process.exit(1);
  }

  // Load config
  const configPath = join(__dirname, configFile);
  const config = JSON.parse(readFileSync(configPath, "utf-8"));

  const amount = new BN(amountStr);

  console.log("=== Drift Withdraw ===\n");
  console.log("Config:", configFile);
  console.log("Bank mint:", config.bankMint);
  console.log("Amount:", amountStr);
  console.log("Withdraw all:", withdrawAll);
  console.log();

  // Setup connection and program
  const { connection, wallet, program } = driftSetup(config.programId);

  // Also create drift program to fetch spot market
  const driftProgram = new Program<Drift>(
    driftIdl as any,
    DRIFT_PROGRAM_ID,
    program.provider
  );

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
  const [driftSigner] = deriveDriftSignerPDA();
  const [driftSpotMarketVault] = deriveSpotMarketVaultPDA(config.driftMarketIndex);

  const destinationTokenAccount = getAssociatedTokenAddressSync(
    bankMint,
    wallet.publicKey
  );

  console.log("Derived Accounts:");
  console.log("  Bank:", bankPubkey.toString());
  console.log("  Marginfi Account:", marginfiAccount.toString());
  console.log("  Drift State:", driftState.toString());
  console.log("  Destination Token Account:", destinationTokenAccount.toString());
  console.log();

  // Fetch marginfi account to get all active banks for remaining accounts
  console.log("Fetching marginfi account to build remaining accounts...");
  const marginfiAccountData = await program.account.marginfiAccount.fetch(marginfiAccount);

  const remainingAccounts: PublicKey[] = [];
  for (const balance of marginfiAccountData.lendingAccount.balances) {
    if (balance.active && !balance.bankPk.equals(bankPubkey)) {
      // Add other active banks for health check
      remainingAccounts.push(balance.bankPk);
    }
  }

  console.log("Remaining accounts (other active banks):", remainingAccounts.length);
  remainingAccounts.forEach((pk, i) => {
    console.log(`  ${i + 1}. ${pk.toString()}`);
  });
  console.log();

  // Build instruction (authority is auto-resolved from marginfiAccount)
  const ix = await program.methods
    .driftWithdraw(amount, withdrawAll ? {} : null)
    .accounts({
      marginfiAccount: marginfiAccount,
      bank: bankPubkey,
      destinationTokenAccount: destinationTokenAccount,
      driftState: driftState,
      driftSpotMarketVault: driftSpotMarketVault,
      driftSigner: driftSigner,
      driftOracle: driftOracle,
      driftRewardOracle: null,
      driftRewardSpotMarket: null,
      driftRewardOracle2: null,
      driftRewardSpotMarket2: null,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .remainingAccounts(
      remainingAccounts.map((pubkey) => ({
        pubkey,
        isSigner: false,
        isWritable: false,
      }))
    )
    .instruction();

  const transaction = new Transaction().add(ix);

  // Simulate
  transaction.feePayer = wallet.publicKey;
  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;

  console.log("Simulating driftWithdraw...");
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

  console.log("✓ Withdrawal successful!");
  console.log("Signature:", signature);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
