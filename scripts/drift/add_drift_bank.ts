import { PublicKey, Transaction, sendAndConfirmTransaction, AccountMeta } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID, getMint } from "@solana/spl-token";
import { readFileSync } from "fs";
import { join } from "path";
import {
  deriveSpotMarketPDA,
  deriveDriftStatePDA,
  deriveSpotMarketVaultPDA,
  I80F48_ONE,
  DriftConfigCompact,
} from "./lib/utils";
import { deriveBankWithSeed } from "../common/pdas";
import { commonSetup } from "../../lib/common-setup";

/**
 * If true, send the tx. If false, output the unsigned b58 tx to console.
 */
const sendTx = false;

type Config = {
  PROGRAM_ID: string;
  GROUP_KEY: PublicKey;
  BANK_MINT: PublicKey;
  DRIFT_MARKET_INDEX: number;
  ORACLE: PublicKey;
  /** 9 (DriftPythPush) or 10 (DriftSwitchboardPull) */
  ORACLE_SETUP: { driftPythPull: {} } | { driftSwitchboardPull: {} };
  DRIFT_ORACLE: PublicKey;
  /** Group admin (generally the MS on mainnet) */
  ADMIN?: PublicKey; // If omitted, defaults to wallet.pubkey
  /** Pays flat sol fee to init and rent (generally the MS on mainnet) */
  FEE_PAYER?: PublicKey; // If omitted, defaults to ADMIN
  SEED: BN;
  MULTISIG_PAYER?: PublicKey; // May be omitted if not using squads

  // Optional Bank Config fields
  DEPOSIT_LIMIT?: string; // Default: 10^13 (10_000_000_000)
  TOTAL_ASSET_VALUE_INIT_LIMIT?: string; // Default: 10^13 (10_000_000_000)
  INIT_DEPOSIT_AMOUNT?: BN; // Default: 100
};

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
    console.error("Usage: npx ts-node scripts/drift/add_drift_bank.ts <config-file>");
    console.error("Example: npx ts-node scripts/drift/add_drift_bank.ts configs/usdc.json");
    process.exit(1);
  }

  // Load config
  const configPath = join(__dirname, configFile);
  const raw_config = readFileSync(configPath, "utf8");
  const config = parseConfig(raw_config);

  console.log("=== Add Drift Bank ===\n");
  console.log("Config:", configFile);
  console.log("Bank mint:", config.BANK_MINT);
  console.log("Drift market index:", config.DRIFT_MARKET_INDEX);
  console.log();

  await addDriftBank(sendTx, config, "/keys/staging-deploy.json");
}

export async function addDriftBank(
  sendTx: boolean,
  config: Config,
  walletPath: string,
  version?: "current"
): Promise<PublicKey> {
  // Setup connection and program
  const user = commonSetup(
    sendTx,
    config.PROGRAM_ID,
    walletPath,
    config.MULTISIG_PAYER,
    version,
  );
  const connection = user.connection;
  const wallet = user.wallet;
  const program = user.program;

  // Derive accounts
  const [bank] = deriveBankWithSeed(
    program.programId,
    config.GROUP_KEY,
    config.BANK_MINT,
    config.SEED
  );

  // Use spot market address from config if provided, otherwise derive it
  const driftSpotMarket = deriveSpotMarketPDA(config.DRIFT_MARKET_INDEX)[0];

  const [driftState] = deriveDriftStatePDA();
  const [driftSpotMarketVault] = deriveSpotMarketVaultPDA(config.DRIFT_MARKET_INDEX);

  console.log("Derived Accounts:");
  console.log("  Bank:", bank.toString());
  console.log("  Drift Spot Market:", driftSpotMarket.toString());
  console.log("  Drift Spot Market Vault:", driftSpotMarketVault.toString());
  console.log("  Drift State:", driftState.toString());
  console.log();

  // Build drift bank config
  const driftConfig: DriftConfigCompact = {
    oracle: config.ORACLE,
    assetWeightInit: I80F48_ONE, // 100%
    assetWeightMaint: I80F48_ONE, // 100%
    depositLimit: new BN(config.DEPOSIT_LIMIT ?? 10_000_000_000),
    oracleSetup: config.ORACLE_SETUP,
    operationalState: {
      operational: {}
    },
    riskTier: {
      collateral: {}
    },
    configFlags: 1, // (PYTH_PUSH_MIGRATED_DEPRECATED)
    totalAssetValueInitLimit: new BN(config.TOTAL_ASSET_VALUE_INIT_LIMIT ?? 10_000_000_000),
    oracleMaxAge: 100,
    oracleMaxConfidence: 0 // Default: 10% confidence
  };

  console.log("Bank Configuration:");
  console.log("  Deposit Limit:", driftConfig.depositLimit);
  console.log("  Total Asset Value Limit:", driftConfig.totalAssetValueInitLimit);
  console.log();

  // Detect the correct token program by checking the mint's owner
  console.log("Detecting token program for mint...");
  let tokenProgram = TOKEN_PROGRAM_ID;
  try {
    await getMint(connection, config.BANK_MINT, "confirmed", TOKEN_2022_PROGRAM_ID);
    tokenProgram = TOKEN_2022_PROGRAM_ID;
    console.log("  Using Token-2022 program");
  } catch {
    // If it fails with Token-2022, it's a regular SPL token
    console.log("  Using SPL Token program");
  }
  console.log();

  // Build lendingPoolAddBankDrift instruction
  const oracleMeta: AccountMeta = {
    pubkey: driftConfig.oracle,
    isSigner: false,
    isWritable: false,
  };
  const spotMarketMeta: AccountMeta = {
    pubkey: driftSpotMarket,
    isSigner: false,
    isWritable: false,
  };

  const addBankIx = await program.methods
    .lendingPoolAddBankDrift(driftConfig, config.SEED)
    .accounts({
      group: config.GROUP_KEY,
      feePayer: config.FEE_PAYER ?? wallet.publicKey,
      bankMint: config.BANK_MINT,
      integrationAcc1: driftSpotMarket,
      tokenProgram,
    })
    .accountsPartial({
        admin: config.ADMIN ?? wallet.publicKey,
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
    config.BANK_MINT,
    config.ADMIN ?? wallet.publicKey,
    true,
    tokenProgram
  );

  // Derive all required accounts
  const {
    deriveLiquidityVaultAuthority,
    deriveDriftUserPDA,
    deriveDriftUserStatsPDA
  } = await import("./lib/utils");

  const [liquidityVaultAuthority] = deriveLiquidityVaultAuthority(
    program.programId,
    bank
  );

  const [driftUser] = deriveDriftUserPDA(liquidityVaultAuthority, 0);
  const [driftUserStats] = deriveDriftUserStatsPDA(liquidityVaultAuthority);

  console.log("Derived accounts:");
  console.log("  liquidityVaultAuthority:", liquidityVaultAuthority.toString());
  console.log("  driftUser:", driftUser.toString());
  console.log("  driftUserStats:", driftUserStats.toString());
  console.log("  signerTokenAccount", signerTokenAccount.toString());
  console.log();

  const initUserIx = await program.methods
    .driftInitUser(config.INIT_DEPOSIT_AMOUNT ?? new BN(100))
    .accounts({
      feePayer: wallet.publicKey,
      signerTokenAccount,
      bank,
      driftState,
      driftSpotMarketVault,
      driftOracle,
      tokenProgram,
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

  return bank;
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
  });
}

const pkFromString = (s: any) => new PublicKey(s);

function parseConfig(rawConfig: string): Config {
  const json = JSON.parse(rawConfig);

let ORACLE_SETUP;
if (json.marginfiOracleType === "switchboardPull") {
    ORACLE_SETUP = { driftSwitchboardPull: {} };
  } else {
    // Default to pythPushOracle
    ORACLE_SETUP = { driftPythPull: {} };
  }

  return {
    PROGRAM_ID: json.programId,
    GROUP_KEY: pkFromString(json.group),
    BANK_MINT: pkFromString(json.COLLATERAL_MINT),
    DRIFT_MARKET_INDEX: json.driftMarketIndex,
    ORACLE: pkFromString(json.oracle),
    ORACLE_SETUP,
    DRIFT_ORACLE: pkFromString(json.driftOracle),
    DEPOSIT_LIMIT: json.depositLimit,
    TOTAL_ASSET_VALUE_INIT_LIMIT: json.totalAssetValueInitLimit,
    SEED: new BN(json.seed),
    INIT_DEPOSIT_AMOUNT: new BN(json.initDepositAmount),
  };
}
