import { PublicKey, Transaction, sendAndConfirmTransaction, TransactionMessage, VersionedTransaction, AccountMeta } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { readFileSync } from "fs";
import { join } from "path";
import { driftSetup } from "./lib/setup";
import {
  deriveBankWithSeed,
  deriveSpotMarketPDA,
  deriveDriftStatePDA,
  deriveSpotMarketVaultPDA,
  I80F48_ONE,
  DriftConfigCompact,
} from "./lib/utils";

/**
 * Add Drift Bank Script
 *
 * Adds a drift-enabled bank to the marginfi group and initializes the drift user.
 *
 * Usage: npx ts-node scripts/drift-staging/add_drift_bank.ts <config-file>
 * Example: npx ts-node scripts/drift-staging/add_drift_bank.ts configs/usdc.json
 */

async function main() {
  // Get config file from args
  const configFile = process.argv[2];
  if (!configFile) {
    console.error("Usage: npx ts-node scripts/drift-staging/add_drift_bank.ts <config-file>");
    console.error("Example: npx ts-node scripts/drift-staging/add_drift_bank.ts configs/usdc.json");
    process.exit(1);
  }

  // Load config
  const configPath = join(__dirname, configFile);
  const config = JSON.parse(readFileSync(configPath, "utf-8"));

  console.log("=== Add Drift Bank ===\n");
  console.log("Config:", configFile);
  console.log("Bank mint:", config.bankMint);
  console.log("Drift market index:", config.driftMarketIndex);
  console.log();

  // Setup connection and program
  const { connection, wallet, program } = driftSetup(config.programId);

  // Parse config values
  const groupPubkey = new PublicKey(config.group);
  const bankMint = new PublicKey(config.bankMint);
  const oracle = new PublicKey(config.oracle);
  const driftOracle = new PublicKey(config.driftOracle);
  const seed = new BN(config.seed);
  const initDepositAmount = new BN(config.initDepositAmount);

  // Derive accounts
  const [bankPubkey] = deriveBankWithSeed(
    program.programId,
    groupPubkey,
    bankMint,
    seed
  );

  const [driftSpotMarket] = deriveSpotMarketPDA(config.driftMarketIndex);
  const [driftState] = deriveDriftStatePDA();
  const [driftSpotMarketVault] = deriveSpotMarketVaultPDA(config.driftMarketIndex);

  console.log("Derived Accounts:");
  console.log("  Bank:", bankPubkey.toString());
  console.log("  Drift Spot Market:", driftSpotMarket.toString());
  console.log("  Drift State:", driftState.toString());
  console.log();

  // Build drift bank config
  const driftConfig: DriftConfigCompact = {
    oracle: oracle,
    assetWeightInit: I80F48_ONE, // 100%
    assetWeightMaint: I80F48_ONE, // 100%
    depositLimit: new BN(config.depositLimit),
    totalAssetValueInitLimit: new BN(config.totalAssetValueInitLimit),
    oracleSetup: { driftPythPull: {} },
    oracleMaxAge: 100,
  };

  console.log("Bank Configuration:");
  console.log("  Deposit Limit:", config.depositLimit);
  console.log("  Total Asset Value Limit:", config.totalAssetValueInitLimit);
  console.log();

  // Build lendingPoolAddBankDrift instruction
  const oracleMeta: AccountMeta = {
    pubkey: oracle,
    isSigner: false,
    isWritable: false,
  };
  const spotMarketMeta: AccountMeta = {
    pubkey: driftSpotMarket,
    isSigner: false,
    isWritable: false,
  };

  const addBankIx = await program.methods
    .lendingPoolAddBankDrift(driftConfig, seed)
    .accounts({
      marginfiGroup: groupPubkey,
      admin: wallet.publicKey,
      feePayer: wallet.publicKey,
      bankMint: bankMint,
      driftSpotMarket: driftSpotMarket,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .remainingAccounts([oracleMeta, spotMarketMeta])
    .instruction();

  const transaction = new Transaction().add(addBankIx);

  // Simulate
  transaction.feePayer = wallet.publicKey;
  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;

  console.log("Simulating lendingPoolAddBankDrift...");
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

  console.log("✓ Bank added successfully!");
  console.log("Signature:", signature);
  console.log();

  // Now initialize drift user
  console.log("Initializing drift user...");

  // Get user's token account (ATA)
  const { getAssociatedTokenAddressSync } = await import("@solana/spl-token");
  const signerTokenAccount = getAssociatedTokenAddressSync(
    bankMint,
    wallet.publicKey
  );

  const [driftSigner] = PublicKey.findProgramAddressSync(
    [Buffer.from("drift_signer")],
    new PublicKey("dRiftyHA39MWEi3m9aunc5MzRF1JYuBsbn6VPcn33UH")
  );

  const initUserIx = await program.methods
    .driftInitUser(initDepositAmount)
    .accounts({
      feePayer: wallet.publicKey,
      bank: bankPubkey,
      signerTokenAccount: signerTokenAccount,
      driftState: driftState,
      driftSpotMarketVault: driftSpotMarketVault,
      driftSigner: driftSigner,
      driftOracle: driftOracle,
      referrer: null,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .instruction();

  const initUserTx = new Transaction().add(initUserIx);
  initUserTx.feePayer = wallet.publicKey;
  const { blockhash: blockhash2 } = await connection.getLatestBlockhash();
  initUserTx.recentBlockhash = blockhash2;

  console.log("Simulating driftInitUser...");
  const initUserSimulation = await connection.simulateTransaction(initUserTx);

  console.log("\nProgram Logs:");
  initUserSimulation.value.logs?.forEach(log => console.log("  " + log));

  if (initUserSimulation.value.err) {
    console.log("\nSimulation failed:");
    console.log(JSON.stringify(initUserSimulation.value.err, null, 2));
    process.exit(1);
  }

  console.log("\nSimulation successful!");
  console.log("Compute units:", initUserSimulation.value.unitsConsumed);
  console.log();

  console.log("Executing transaction...");
  const initUserSig = await sendAndConfirmTransaction(
    connection,
    initUserTx,
    [wallet.payer]
  );

  console.log("✓ Drift user initialized successfully!");
  console.log("Signature:", initUserSig);
  console.log();
  console.log("✓ Drift bank setup complete!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
