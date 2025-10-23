/**
 * Add Marginfi Bank from Config File
 *
 * This script loads a bank configuration file, generates the add bank transaction,
 * simulates it with signature verification disabled, and outputs the results.
 *
 * Usage:
 *   npx tsx scripts/marginfi/add_bank_from_config.ts <config_name>
 *
 * Examples:
 *   npx tsx scripts/marginfi/add_bank_from_config.ts dzsol
 *   npx tsx scripts/marginfi/add_bank_from_config.ts 2z
 */

import {
  AccountMeta,
  Connection,
  PublicKey,
  Transaction,
} from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import {
  bigNumberToWrappedI80F48,
  TOKEN_PROGRAM_ID,
} from "@mrgnlabs/mrgn-common";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { commonSetup } from "../../lib/common-setup";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { deriveBankWithSeed } from "../common/pdas";
import { loadEnvFile } from "../utils";
import {
  MarginfiBankConfig,
  BankConfigRaw,
  InterestRateConfigRaw,
} from "./configs/marginfi-bank-config.types";

/**
 * If true, send the tx. If false, output the unsigned b58 tx to console.
 */
const sendTx = false;

/**
 * Convert user-friendly config to raw on-chain format
 */
function configToRaw(config: MarginfiBankConfig): BankConfigRaw {
  const interestRateConfig: InterestRateConfigRaw = {
    optimalUtilizationRate: bigNumberToWrappedI80F48(
      config.optimalUtilizationRate
    ),
    plateauInterestRate: bigNumberToWrappedI80F48(config.plateauInterestRate),
    maxInterestRate: bigNumberToWrappedI80F48(config.maxInterestRate),
    insuranceFeeFixedApr: bigNumberToWrappedI80F48(config.insuranceFeeFixedApr),
    insuranceIrFee: bigNumberToWrappedI80F48(config.insuranceIrFee),
    protocolFixedFeeApr: bigNumberToWrappedI80F48(config.protocolFixedFeeApr),
    protocolIrFee: bigNumberToWrappedI80F48(config.protocolIrFee),
    protocolOriginationFee: bigNumberToWrappedI80F48(
      config.protocolOriginationFee
    ),
  };

  const operationalState =
    config.operationalState === "operational"
      ? { operational: {} }
      : config.operationalState === "paused"
      ? { paused: {} }
      : { reduceOnly: {} };

  const riskTier =
    config.riskTier === "collateral" ? { collateral: {} } : { isolated: {} };

  return {
    assetWeightInit: bigNumberToWrappedI80F48(config.assetWeightInit),
    assetWeightMaint: bigNumberToWrappedI80F48(config.assetWeightMaint),
    liabilityWeightInit: bigNumberToWrappedI80F48(config.liabilityWeightInit),
    liabilityWeightMaint: bigNumberToWrappedI80F48(config.liabilityWeightMaint),
    depositLimit: new BN(config.depositLimit * 10 ** config.decimals),
    borrowLimit: new BN(config.borrowLimit * 10 ** config.decimals),
    interestRateConfig,
    operationalState,
    riskTier,
    totalAssetValueInitLimit: new BN(config.totalAssetValueInitLimit),
    oracleMaxAge: config.oracleMaxAge,
    assetTag: config.assetTag,
    oracleMaxConfidence: config.oracleMaxConfidence,
  };
}

/**
 * Get oracle type number from string
 */
function getOracleTypeNumber(oracleType: "pyth" | "switchboard"): number {
  return oracleType === "pyth" ? 3 : 4;
}

/**
 * Get token program PublicKey from string
 */
function getTokenProgram(tokenProgram: "spl-token" | "token-2022"): PublicKey {
  return tokenProgram === "spl-token"
    ? TOKEN_PROGRAM_ID
    : TOKEN_2022_PROGRAM_ID;
}

/**
 * Simulate transaction with signature verification disabled
 */
async function simulateTransaction(
  connection: Connection,
  tx: Transaction
): Promise<void> {
  console.log("\n🔄 Simulating transaction...");

  try {
    const simulation = await connection.simulateTransaction(
      tx,
      undefined,
      false
    );

    // Print results
    if (simulation.value.err) {
      console.error("❌ Simulation failed:");
      console.error(JSON.stringify(simulation.value.err, null, 2));
      console.log();
    } else {
      console.log("✅ Simulation successful!");
      console.log();
    }

    console.log("📊 Simulation Results:");
    console.log(
      `  Compute Units: ${simulation.value.unitsConsumed || "N/A"} / 200,000`
    );
    console.log();

    if (simulation.value.logs && simulation.value.logs.length > 0) {
      console.log("📝 Full Simulation Logs:");
      simulation.value.logs.forEach((log, i) => {
        console.log(`  [${i}] ${log}`);
      });
    } else {
      console.log("📝 Logs: (none)");
    }
    console.log();

    if (simulation.value.err) {
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Error simulating transaction:");
    console.error(error);
    process.exit(1);
  }
}

async function main() {
  const configName = process.argv[2];

  if (!configName) {
    console.error(
      "Usage: npx tsx scripts/marginfi/add_bank_from_config.ts <config_name>"
    );
    console.error(
      "Example: npx tsx scripts/marginfi/add_bank_from_config.ts dzsol"
    );
    process.exit(1);
  }

  // Load environment variables
  loadEnvFile(".env.api");

  // Dynamically import the config file
  let config: MarginfiBankConfig;
  try {
    const configModule = await import(`./configs/${configName}.config`);
    const configKey = Object.keys(configModule).find((key) =>
      key.toLowerCase().includes("config")
    );
    if (!configKey) {
      throw new Error("Config file must export a variable ending in 'Config'");
    }
    config = configModule[configKey];
  } catch (error) {
    console.error(
      `❌ Failed to load config file: ./configs/${configName}.config.ts`
    );
    console.error(error);
    process.exit(1);
  }

  console.log("═══════════════════════════════════════════════════════");
  console.log(`  Adding Marginfi Bank: ${config.assetName}`);
  console.log("═══════════════════════════════════════════════════════");
  console.log();
  console.log(`📄 Config: ${configName}.config.ts`);
  console.log(`🏦 Asset: ${config.assetName} (${config.assetDescription})`);
  console.log(`🪙  Mint: ${config.bankMint.toString()}`);
  console.log(`🔮 Oracle: ${config.oracle.toString()} (${config.oracleType})`);
  console.log(`🌱 Seed: ${config.seed}`);
  console.log(`📊 Decimals: ${config.decimals}`);
  console.log();

  // Setup connection and program
  const keypairPath = process.env.KEYPAIR_PATH || "/keys/zerotrade_admin.json";
  console.log(`🔑 Using keypair: ${keypairPath}`);

  const user = commonSetup(
    sendTx,
    config.programId,
    keypairPath,
    config.multisigPayer,
    "current"
  );
  const program = user.program;
  const connection = user.connection;

  // Derive bank address
  const [bankKey] = deriveBankWithSeed(
    program.programId,
    config.groupKey,
    config.bankMint,
    new BN(config.seed)
  );

  console.log(`🏦 Derived Bank Address: ${bankKey.toString()}`);
  console.log();

  // Convert config to raw format
  const bankConfigRaw = configToRaw(config);
  const oracleTypeNumber = getOracleTypeNumber(config.oracleType);
  const tokenProgram = getTokenProgram(config.tokenProgram);

  console.log(
    `🔧 Token Program: ${tokenProgram.toString()} (${config.tokenProgram})`
  );
  console.log();

  console.log("📋 Bank Configuration:");
  console.log(
    `  Asset Weight Init: ${config.assetWeightInit} (${
      config.assetWeightInit * 100
    }%)`
  );
  console.log(
    `  Asset Weight Maint: ${config.assetWeightMaint} (${
      config.assetWeightMaint * 100
    }%)`
  );
  console.log(
    `  Liability Weight Init: ${config.liabilityWeightInit} (${
      config.liabilityWeightInit * 100
    }%)`
  );
  console.log(
    `  Liability Weight Maint: ${config.liabilityWeightMaint} (${
      config.liabilityWeightMaint * 100
    }%)`
  );
  console.log(
    `  Deposit Limit: ${config.depositLimit.toLocaleString()} ${
      config.assetName
    }`
  );
  console.log(
    `  Borrow Limit: ${config.borrowLimit.toLocaleString()} ${config.assetName}`
  );
  console.log(
    `  Total Asset Value Init Limit: $${config.totalAssetValueInitLimit.toLocaleString()}`
  );
  console.log(`  Risk Tier: ${config.riskTier}`);
  console.log(`  Operational State: ${config.operationalState}`);
  console.log(`  Asset Tag: ${config.assetTag}`);
  console.log();

  console.log("💰 Interest Rate Configuration:");
  console.log(
    `  Optimal Utilization Rate: ${config.optimalUtilizationRate * 100}%`
  );
  console.log(
    `  Plateau Interest Rate: ${config.plateauInterestRate * 100}% APR`
  );
  console.log(`  Max Interest Rate: ${config.maxInterestRate * 100}% APR`);
  console.log(`  Protocol Fixed Fee APR: ${config.protocolFixedFeeApr * 100}%`);
  console.log(`  Protocol IR Fee: ${config.protocolIrFee * 100}%`);
  console.log();

  // Create oracle meta
  const oracleMeta: AccountMeta = {
    pubkey: config.oracle,
    isSigner: false,
    isWritable: false,
  };

  // Build transaction
  console.log("🔨 Building transaction...");
  const tx = new Transaction().add(
    await program.methods
      .lendingPoolAddBankWithSeed(
        {
          assetWeightInit: bankConfigRaw.assetWeightInit,
          assetWeightMaint: bankConfigRaw.assetWeightMaint,
          liabilityWeightInit: bankConfigRaw.liabilityWeightInit,
          liabilityWeightMaint: bankConfigRaw.liabilityWeightMaint,
          depositLimit: bankConfigRaw.depositLimit,
          interestRateConfig: bankConfigRaw.interestRateConfig,
          operationalState: bankConfigRaw.operationalState,
          borrowLimit: bankConfigRaw.borrowLimit,
          riskTier: bankConfigRaw.riskTier,
          assetTag: bankConfigRaw.assetTag,
          pad0: [0, 0, 0, 0, 0, 0],
          totalAssetValueInitLimit: bankConfigRaw.totalAssetValueInitLimit,
          oracleMaxAge: bankConfigRaw.oracleMaxAge,
          configFlags: 1, // Just always set to one for migrated. This is a real footgun issue
          oracleMaxConfidence: bankConfigRaw.oracleMaxConfidence,
        },
        new BN(config.seed)
      )
      .accounts({
        marginfiGroup: config.groupKey,
        bankMint: config.bankMint,
        feePayer: config.feePayer,
        tokenProgram: tokenProgram,
      })
      .accountsPartial({
        admin: config.admin,
      })
      .instruction(),

    await program.methods
      .lendingPoolConfigureBankOracle(oracleTypeNumber, config.oracle)
      .accounts({
        bank: bankKey,
      })
      .accountsPartial({
        group: config.groupKey,
        admin: config.admin,
      })
      .remainingAccounts([oracleMeta])
      .instruction()
  );

  // Set fee payer to Squads wallet
  tx.feePayer = config.multisigPayer || config.admin;
  const { blockhash } = await connection.getLatestBlockhash();
  tx.recentBlockhash = blockhash;

  // Simulate the transaction
  await simulateTransaction(connection, tx);

  // Serialize and output
  const serializedTransaction = tx.serialize({
    requireAllSignatures: false,
    verifySignatures: false,
  });
  const base58Transaction = bs58.encode(serializedTransaction);

  console.log("═══════════════════════════════════════════════════════");
  console.log("  Transaction Ready for Squads Multisig");
  console.log("═══════════════════════════════════════════════════════");
  console.log();
  console.log("🏦 Bank Address:");
  console.log(bankKey.toString());
  console.log();
  console.log("📦 Base58-encoded Transaction:");
  console.log(base58Transaction);
  console.log();
  console.log(
    "✅ Done! Copy the base58 transaction above to submit via Squads."
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
