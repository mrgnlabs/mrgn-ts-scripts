import { PublicKey, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID, createAssociatedTokenAccountIdempotentInstruction } from "@solana/spl-token";
import { readFileSync } from "fs";
import { join } from "path";
import { userSetup } from "./lib/user_setup";

/**
 * Borrow Script
 *
 * Borrows from a regular marginfi bank (not drift-enabled).
 * Uses USER_WALLET and userMarginfiAccount from config.
 *
 * Usage: npx ts-node scripts/drift-staging/borrow.ts <config-file> <amount>
 * Example: npx ts-node scripts/drift-staging/borrow.ts configs/usdc-staging.json 1000000
 */

async function main() {
  // Get config file and amount from args
  const configFile = process.argv[2];
  const amountStr = process.argv[3];

  if (!configFile || !amountStr) {
    console.error("Usage: npx ts-node scripts/drift-staging/borrow.ts <config-file> <amount>");
    console.error("Example: npx ts-node scripts/drift-staging/borrow.ts configs/usdc-staging.json 1000000");
    process.exit(1);
  }

  // Load config
  const configPath = join(__dirname, configFile);
  const config = JSON.parse(readFileSync(configPath, "utf-8"));

  // Get the regular marginfi bank from config, or use normal USDC bank as default
  // Normal USDC bank in staging: 2niLzLpnYRh7Xf7YLzhX7rxfUn41T3FzPTEgPtAkyRiJ
  const marginfiBankAddress = config.normalBankAddress || "2niLzLpnYRh7Xf7YLzhX7rxfUn41T3FzPTEgPtAkyRiJ";

  const amount = new BN(amountStr);

  console.log("=== Borrow ===\n");
  console.log("Config:", configFile);
  console.log("Bank mint:", config.bankMint);
  console.log("Amount:", amountStr, "base units");
  console.log();

  // Setup connection and program with USER_WALLET
  const { connection, wallet, program } = userSetup(config.programId);

  // Parse config values
  const bankMint = new PublicKey(config.bankMint);
  const regularBankPubkey = new PublicKey(marginfiBankAddress);
  const marginfiAccount = new PublicKey(config.userMarginfiAccount);

  console.log("Borrowing from regular bank:", regularBankPubkey.toString());
  console.log("Marginfi account:", marginfiAccount.toString());
  console.log();

  // Get user's token account (ATA)
  const destinationTokenAccount = getAssociatedTokenAddressSync(
    bankMint,
    wallet.publicKey
  );

  // Fetch bank data to get liquidityVault
  const bankData = await program.account.bank.fetch(regularBankPubkey);
  console.log("Bank liquidity vault:", bankData.liquidityVault.toString());
  console.log();

  // Fetch marginfi account to get all active banks for health check
  const marginfiAccountData = await program.account.marginfiAccount.fetch(marginfiAccount);

  const remainingAccounts: PublicKey[] = [];

  // Track if we've added the borrow bank
  let hasBorrowBank = false;

  // Add all active banks (for health check)
  for (const balance of marginfiAccountData.lendingAccount.balances) {
    if (balance.active) {
      if (balance.bankPk.equals(regularBankPubkey)) {
        hasBorrowBank = true;
      }

      // Add bank + oracles
      remainingAccounts.push(balance.bankPk);

      // Fetch bank to get oracle info
      const balanceBankData = await program.account.bank.fetch(balance.bankPk);

      // Add all oracle keys (skip default/system program)
      for (const oracleKey of balanceBankData.config.oracleKeys) {
        if (!oracleKey.equals(PublicKey.default)) {
          remainingAccounts.push(oracleKey);
        }
      }
    }
  }

  // If we're borrowing from a bank that isn't in active positions, add it
  if (!hasBorrowBank) {
    remainingAccounts.push(regularBankPubkey);
    for (const oracleKey of bankData.config.oracleKeys) {
      if (!oracleKey.equals(PublicKey.default)) {
        remainingAccounts.push(oracleKey);
      }
    }
  }

  console.log("Remaining accounts (banks + oracles):", remainingAccounts.length);
  remainingAccounts.forEach((pk, i) => {
    console.log(`  ${i + 1}. ${pk.toString()}`);
  });
  console.log();

  // Build transaction
  const transaction = new Transaction();

  // Create ATA if it doesn't exist
  transaction.add(
    createAssociatedTokenAccountIdempotentInstruction(
      wallet.publicKey,
      destinationTokenAccount,
      wallet.publicKey,
      bankMint
    )
  );

  // Build borrow instruction
  const ix = await program.methods
    .lendingAccountBorrow(amount)
    .accountsPartial({
      marginfiAccount: marginfiAccount,
      bank: regularBankPubkey,
      destinationTokenAccount: destinationTokenAccount,
      liquidityVault: bankData.liquidityVault,
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

  transaction.add(ix);

  // Simulate
  transaction.feePayer = wallet.publicKey;
  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;

  console.log("Simulating borrow...");
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

  console.log("✓ Borrow successful!");
  console.log("Signature:", signature);
  console.log();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
