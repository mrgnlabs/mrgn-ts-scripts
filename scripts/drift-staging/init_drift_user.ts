import { PublicKey, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { readFileSync } from "fs";
import { join } from "path";
import { driftSetup } from "./lib/setup";
import {
  deriveDriftStatePDA,
  deriveSpotMarketVaultPDA,
  deriveLiquidityVaultAuthority,
  deriveDriftUserPDA,
  deriveDriftUserStatsPDA,
  deriveDriftSignerPDA,
  DRIFT_PROGRAM_ID
} from "./lib/utils";

/**
 * Initialize Drift User Script
 *
 * Initializes the drift user for an existing drift-enabled bank.
 *
 * Usage: npx ts-node scripts/drift-staging/init_drift_user.ts <config-file>
 * Example: npx ts-node scripts/drift-staging/init_drift_user.ts configs/usdc-staging.json
 */

async function main() {
  // Get config file from args
  const configFile = process.argv[2];
  if (!configFile) {
    console.error("Usage: npx ts-node scripts/drift-staging/init_drift_user.ts <config-file>");
    console.error("Example: npx ts-node scripts/drift-staging/init_drift_user.ts configs/usdc-staging.json");
    process.exit(1);
  }

  // Load config
  const configPath = join(__dirname, configFile);
  const config = JSON.parse(readFileSync(configPath, "utf-8"));

  console.log("=== Initialize Drift User ===\n");
  console.log("Config:", configFile);
  console.log("Bank mint:", config.bankMint);
  console.log("Drift market index:", config.driftMarketIndex);
  console.log();

  // Setup connection and program
  const { connection, wallet, program } = driftSetup(config.programId);

  // Parse config values
  const groupPubkey = new PublicKey(config.group);
  const bankMint = new PublicKey(config.bankMint);
  const driftOracle = new PublicKey(config.driftOracle);
  const initDepositAmount = new BN(config.initDepositAmount);

  // User must provide the bank address (since it already exists)
  const bankAddress = config.bankAddress;
  if (!bankAddress) {
    console.error("Error: config.bankAddress is required. Please add the existing bank address to the config.");
    process.exit(1);
  }
  const bankPubkey = new PublicKey(bankAddress);

  console.log("Bank address:", bankPubkey.toString());
  console.log();

  // Derive accounts
  const [driftState] = deriveDriftStatePDA();
  const [driftSpotMarketVault] = deriveSpotMarketVaultPDA(config.driftMarketIndex);
  const [liquidityVaultAuthority] = deriveLiquidityVaultAuthority(
    program.programId,
    bankPubkey
  );
  const [driftUser] = deriveDriftUserPDA(liquidityVaultAuthority, 0);
  const [driftUserStats] = deriveDriftUserStatsPDA(liquidityVaultAuthority);
  const [driftSigner] = deriveDriftSignerPDA();

  // Detect token program and get user's token account (ATA)
  const { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID: SPL_TOKEN_ID, TOKEN_2022_PROGRAM_ID, getMint } = await import("@solana/spl-token");

  let tokenProgram = SPL_TOKEN_ID;
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

  // Fetch bank data to provide accounts that have "relations" in the IDL
  console.log("Fetching bank data...");
  const bankData = await program.account.bank.fetch(bankPubkey);

  console.log("\nFetched from bank:");
  console.log("  liquidityVault:", bankData.liquidityVault.toString());
  console.log("  mint:", bankData.mint.toString());
  console.log("  driftSpotMarket:", bankData.driftSpotMarket.toString());
  console.log();
  console.log("Derived accounts:");
  console.log("  liquidityVaultAuthority:", liquidityVaultAuthority.toString());
  console.log("  driftUser:", driftUser.toString());
  console.log("  driftUserStats:", driftUserStats.toString());
  console.log("  signerTokenAccount:", signerTokenAccount.toString());
  console.log();

  // Provide the accounts that Anchor can't auto-resolve due to depth limitations
  // Use accountsPartial since we're providing accounts that would normally be auto-resolved
  const initUserIx = await program.methods
    .driftInitUser(initDepositAmount)
    .accountsPartial({
      feePayer: wallet.publicKey,
      bank: bankPubkey,
      signerTokenAccount: signerTokenAccount,
      liquidityVault: bankData.liquidityVault,
      mint: bankData.mint,
      driftSpotMarket: bankData.driftSpotMarket,
      driftState: driftState,
      driftSpotMarketVault: driftSpotMarketVault,
      driftSigner: driftSigner,
      driftOracle: driftOracle,
      tokenProgram: tokenProgram,
    })
    .instruction();

  const initUserTx = new Transaction().add(initUserIx);
  initUserTx.feePayer = wallet.publicKey;
  const { blockhash } = await connection.getLatestBlockhash();
  initUserTx.recentBlockhash = blockhash;

  console.log("Simulating driftInitUser...");
  const simulation = await connection.simulateTransaction(initUserTx);

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

  console.log("Executing transaction...");
  const signature = await sendAndConfirmTransaction(
    connection,
    initUserTx,
    [wallet.payer]
  );

  console.log("✓ Drift user initialized successfully!");
  console.log("Signature:", signature);
  console.log();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
