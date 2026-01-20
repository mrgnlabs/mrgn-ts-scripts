import { PublicKey, Transaction, sendAndConfirmTransaction, AccountMeta } from "@solana/web3.js";
import { BN, Program } from "@coral-xyz/anchor";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from "@solana/spl-token";
import { readFileSync } from "fs";
import { join } from "path";
import { driftSetup } from "./lib/setup";
import {
  deriveBankWithSeed,
  deriveDriftStatePDA,
  deriveSpotMarketVaultPDA,
  deriveDriftSignerPDA,
  deriveLiquidityVaultAuthority,
  deriveDriftUserPDA,
  DRIFT_PROGRAM_ID,
} from "./lib/utils";
import { Drift } from "../../../idl/drift";
import driftIdl from "../../../idl/drift.json";

/**
 * Drift Harvest Rewards Script
 *
 * Harvests accumulated rewards from admin deposits (positions 2-7).
 * Only relevant when 2+ admin deposits are active in drift user.
 *
 * Usage: npx ts-node scripts/drift-staging/harvest_rewards.ts <config-file>
 * Example: npx ts-node scripts/drift-staging/harvest_rewards.ts configs/usdc.json
 */

async function main() {
  // Get config file from args
  const configFile = process.argv[2];

  if (!configFile) {
    console.error("Usage: npx ts-node scripts/drift-staging/harvest_rewards.ts <config-file>");
    console.error("Example: npx ts-node scripts/drift-staging/harvest_rewards.ts configs/usdc.json");
    process.exit(1);
  }

  // Load config
  const configPath = join(__dirname, configFile);
  const config = JSON.parse(readFileSync(configPath, "utf-8"));

  console.log("=== Drift Harvest Rewards ===\n");
  console.log("Config:", configFile);
  console.log("Bank mint:", config.bankMint);
  console.log();

  // Setup connection and program
  const { connection, wallet, program } = driftSetup(config.programId);

  // Also create drift program to fetch spot market and user
  const driftProgram = new Program<Drift>(
    driftIdl as any,
    DRIFT_PROGRAM_ID,
    program.provider
  );

  // Parse config values
  const groupPubkey = new PublicKey(config.group);
  const bankMint = new PublicKey(config.bankMint);
  const seed = new BN(config.seed);

  // Derive accounts
  const [bankPubkey] = deriveBankWithSeed(
    program.programId,
    groupPubkey,
    bankMint,
    seed
  );

  const [driftState] = deriveDriftStatePDA();
  const [driftSigner] = deriveDriftSignerPDA();

  console.log("Derived Accounts:");
  console.log("  Bank:", bankPubkey.toString());
  console.log("  Drift State:", driftState.toString());
  console.log();

  // Fetch bank to get drift user
  console.log("Fetching bank and drift user to check for rewards...");
  const bank = await program.account.bank.fetch(bankPubkey);
  const driftUser = await driftProgram.account.user.fetch(bank.driftUser);

  // Check active positions for rewards (positions 2-7)
  console.log("Drift user positions:");
  const rewardPositions: number[] = [];
  for (let i = 0; i < driftUser.spotPositions.length; i++) {
    const pos = driftUser.spotPositions[i];
    const scaledBalance = new BN(pos.scaledBalance.toString());
    if (i >= 2 && i <= 7 && !scaledBalance.isZero()) {
      console.log(`  Position ${i}: Market ${pos.marketIndex}, Balance: ${scaledBalance.toString()}`);
      rewardPositions.push(i);
    }
  }

  if (rewardPositions.length === 0) {
    console.log("\nNo reward positions found (positions 2-7 are empty).");
    console.log("Rewards only accumulate when 2+ admin deposits are active.");
    process.exit(0);
  }

  console.log(`\nFound ${rewardPositions.length} reward position(s) to harvest`);
  console.log();

  // For now, harvest the first reward position
  // In practice, you might want to harvest all or let user choose
  const rewardPosIndex = rewardPositions[0];
  const rewardPos = driftUser.spotPositions[rewardPosIndex];

  console.log(`Harvesting reward from position ${rewardPosIndex} (market ${rewardPos.marketIndex})...`);

  // Derive the harvest spot market PDA
  const [harvestDriftSpotMarket] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("spot_market"),
      new BN(rewardPos.marketIndex).toArrayLike(Buffer, "le", 2),
    ],
    DRIFT_PROGRAM_ID
  );

  const [harvestDriftSpotMarketVault] = deriveSpotMarketVaultPDA(rewardPos.marketIndex);

  // Fetch the harvest spot market to get the mint
  const harvestSpotMarket = await driftProgram.account.spotMarket.fetch(harvestDriftSpotMarket);
  const rewardMint = harvestSpotMarket.mint;

  console.log("  Harvest Spot Market:", harvestDriftSpotMarket.toString());
  console.log("  Reward Mint:", rewardMint.toString());
  console.log();

  // Fetch fee state to get global fee wallet
  const [feeState] = PublicKey.findProgramAddressSync(
    [Buffer.from("feeState")],
    program.programId
  );

  const feeStateData = await program.account.feeState.fetch(feeState);
  const globalFeeWallet = feeStateData.globalFeeWallet;

  // Derive the destination token account (ATA of fee wallet for reward mint)
  const destinationTokenAccount = getAssociatedTokenAddressSync(
    rewardMint,
    globalFeeWallet,
    true // allowOwnerOffCurve
  );

  console.log("  Global Fee Wallet:", globalFeeWallet.toString());
  console.log("  Destination Token Account:", destinationTokenAccount.toString());
  console.log();

  // Build remaining accounts for drift (similar pattern to withdraw)
  // This should include oracle and spot market for the harvest asset
  const remainingAccounts: AccountMeta[] = [];

  // Build instruction
  const ix = await program.methods
    .driftHarvestReward()
    .accounts({
      bank: bankPubkey,
      driftState: driftState,
      harvestDriftSpotMarket: harvestDriftSpotMarket,
      harvestDriftSpotMarketVault: harvestDriftSpotMarketVault,
      driftSigner: driftSigner,
      rewardMint: rewardMint,
      destinationTokenAccount: destinationTokenAccount,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .remainingAccounts(remainingAccounts)
    .instruction();

  const transaction = new Transaction().add(ix);

  // Simulate
  transaction.feePayer = wallet.publicKey;
  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;

  console.log("Simulating driftHarvestReward...");
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

  console.log("✓ Rewards harvested successfully!");
  console.log("Signature:", signature);
  console.log("Rewards sent to:", destinationTokenAccount.toString());
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
