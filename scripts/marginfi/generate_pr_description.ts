/**
 * Generate PR Description from Config File
 *
 * This script loads a bank configuration file and generates a markdown PR description
 * similar to the Kamino bank workflow.
 *
 * Usage:
 *   npx tsx scripts/marginfi/generate_pr_description.ts <config_name> <bank_address> <base58_tx> [simulation_logs]
 *
 * Examples:
 *   npx tsx scripts/marginfi/generate_pr_description.ts dzsol <bank_addr> <base58_tx> <logs_file>
 */

import * as fs from "fs";
import * as path from "path";
import { MarginfiBankConfig } from "./configs/marginfi-bank-config.types";

interface GeneratePRDescriptionParams {
  config: MarginfiBankConfig;
  configName: string;
  bankAddress: string;
  base58Transaction: string;
  simulationLogs?: string;
  computeUnits?: number;
}

function generatePRDescription(params: GeneratePRDescriptionParams): string {
  const { config, configName, bankAddress, base58Transaction, simulationLogs, computeUnits } = params;

  const oracleTypeName = config.oracleType === "pyth" ? "Pyth" : "Switchboard Pull";
  const tokenProgramName = config.tokenProgram === "spl-token" ? "SPL Token" : "Token-2022";

  return `# Add Marginfi ${config.assetName} Bank

## Summary
Adds a new **${config.assetName}** bank to the marginfi lending group.

**Asset**: ${config.assetName}
**Mint**: \`${config.bankMint.toString()}\`
**Bank Seed**: ${config.seed}
**Asset Tag**: ${config.assetTag}
**Description**: ${config.assetDescription}

---

## 🔍 Configuration Parameters

### Mint Information
| Parameter | Value | Verification |
|-----------|-------|--------------|
| **Token Program** | \`${config.tokenProgram === "spl-token" ? "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" : "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"}\` | ${tokenProgramName} |
| **Mint Decimals** | ${config.decimals} | Standard for ${config.assetName} |

### Marginfi Bank Configuration
| Parameter | Value | Verification |
|-----------|-------|--------------|
| **Program ID** | \`${config.programId}\` | Marginfi mainnet program |
| **Group** | \`${config.groupKey.toString()}\` | Marginfi mainnet lending group |
| **Bank Mint** | \`${config.bankMint.toString()}\` | [Solscan](https://solscan.io/account/${config.bankMint.toString()}) |
| **Seed** | ${config.seed} | Primary bank |

### Oracle Configuration
| Parameter | Value | Verification |
|-----------|-------|--------------|
| **Oracle Address** | \`${config.oracle.toString()}\` | [Solscan](https://solscan.io/account/${config.oracle.toString()}) |
| **Oracle Type** | ${oracleTypeName} | Type ${config.oracleType === "pyth" ? "3" : "4"} |
| **Oracle Max Age** | ${config.oracleMaxAge} seconds | Standard |
| **Oracle Max Confidence** | ${config.oracleMaxConfidence} | ${config.oracleMaxConfidence === 0 ? "Default (10%)" : config.oracleMaxConfidence} |

### Risk Parameters
| Parameter | Value | Notes |
|-----------|-------|-------|
| **Asset Weight Init** | ${config.assetWeightInit} (${config.assetWeightInit * 100}%) | Collateral value when opening positions |
| **Asset Weight Maint** | ${config.assetWeightMaint} (${config.assetWeightMaint * 100}%) | Collateral value for existing positions |
| **Liability Weight Init** | ${config.liabilityWeightInit} (${config.liabilityWeightInit * 100}%) | Borrow value when opening positions |
| **Liability Weight Maint** | ${config.liabilityWeightMaint} (${config.liabilityWeightMaint * 100}%) | Borrow value for existing positions |
| **Deposit Limit** | ${config.depositLimit.toLocaleString()} ${config.assetName} | Raw: \`new BN(${config.depositLimit} * 10 ** ${config.decimals})\` |
| **Borrow Limit** | ${config.borrowLimit.toLocaleString()} ${config.assetName} | Raw: \`new BN(${config.borrowLimit} * 10 ** ${config.decimals})\` |
| **Total Asset Value Init Limit** | $${config.totalAssetValueInitLimit.toLocaleString()} | Raw: \`new BN(${config.totalAssetValueInitLimit})\` |
| **Operational State** | ${config.operationalState} | |
| **Risk Tier** | ${config.riskTier} | |

### Interest Rate Configuration
| Parameter | Value | Notes |
|-----------|-------|-------|
| **Optimal Utilization Rate** | ${config.optimalUtilizationRate * 100}% | Target utilization |
| **Plateau Interest Rate** | ${config.plateauInterestRate * 100}% APR | Rate at optimal utilization |
| **Max Interest Rate** | ${config.maxInterestRate * 100}% APR | Rate at 100% utilization |
| **Insurance Fee Fixed APR** | ${config.insuranceFeeFixedApr * 100}% | |
| **Insurance IR Fee** | ${config.insuranceIrFee * 100}% | |
| **Protocol Fixed Fee APR** | ${config.protocolFixedFeeApr * 100}% | |
| **Protocol IR Fee** | ${config.protocolIrFee * 100}% | |
| **Protocol Origination Fee** | ${config.protocolOriginationFee * 100}% | |

---

## 🔗 Verification Links

### On-Chain Verification
- **${config.assetName} Mint**: [Solscan](https://solscan.io/account/${config.bankMint.toString()})
- **Oracle**: [Solscan](https://solscan.io/account/${config.oracle.toString()})
- **Marginfi Bank (after execution)**: [Solscan](https://solscan.io/account/${bankAddress})

---

## 🚀 Transaction

**Derived Bank Address**: \`${bankAddress}\`

**Base58 Transaction**:
\`\`\`
${base58Transaction}
\`\`\`

### Simulation Results

${simulationLogs ? `**Status**: ✅ Simulation successful

**Compute Units**: ${computeUnits ? `${computeUnits.toLocaleString()} / 200,000` : "N/A"}

**Full Simulation Logs**:
\`\`\`
${simulationLogs}
\`\`\`

**Key Parameters Verified**:
- ✅ Program ID: \`${config.programId}\` (Mainnet)
- ✅ Token Program: ${tokenProgramName}
- ✅ Asset Weight Init: ${config.assetWeightInit} (${config.assetWeightInit * 100}%)
- ✅ Asset Weight Maint: ${config.assetWeightMaint} (${config.assetWeightMaint * 100}%)
- ✅ Liability Weight Init: ${config.liabilityWeightInit} (${config.liabilityWeightInit * 100}%)
- ✅ Liability Weight Maint: ${config.liabilityWeightMaint} (${config.liabilityWeightMaint * 100}%)
- ✅ Deposit Limit: ${config.depositLimit.toLocaleString()} ${config.assetName}
- ✅ Borrow Limit: ${config.borrowLimit.toLocaleString()} ${config.assetName}
- ✅ Total Asset Value Init Limit: $${config.totalAssetValueInitLimit.toLocaleString()}
- ✅ Risk Tier: ${config.riskTier}
- ✅ Operational State: ${config.operationalState}
` : `**Status**: ⏳ Run simulation to verify

To simulate the transaction, run:
\`\`\`bash
npx tsx scripts/kamino/simulate_transaction.ts <base58_tx>
\`\`\`
`}

---

## 📝 Notes

- This adds a new **${config.assetName}** bank with seed ${config.seed}
- Oracle type: ${oracleTypeName} (type ${config.oracleType === "pyth" ? "3" : "4"})
- Risk parameters ${config.assetDescription.toLowerCase().includes("liquid staking") ? "are conservative for a liquid staking token" : config.assetDescription.toLowerCase().includes("volatile") ? "are conservative for a volatile asset" : "are configured appropriately"}
- Remember to submit the transaction via Squads multisig
`;
}

async function main() {
  const configName = process.argv[2];
  const bankAddress = process.argv[3];
  const base58Transaction = process.argv[4];
  const logsFile = process.argv[5];

  if (!configName || !bankAddress || !base58Transaction) {
    console.error("Usage: npx tsx scripts/marginfi/generate_pr_description.ts <config_name> <bank_address> <base58_tx> [logs_file]");
    console.error("Example: npx tsx scripts/marginfi/generate_pr_description.ts dzsol <bank_addr> <base58_tx> logs.txt");
    process.exit(1);
  }

  // Load config
  let config: MarginfiBankConfig;
  try {
    const configModule = await import(`./configs/${configName}.config`);
    const configKey = Object.keys(configModule).find(key => key.toLowerCase().includes("config"));
    if (!configKey) {
      throw new Error("Config file must export a variable ending in 'Config'");
    }
    config = configModule[configKey];
  } catch (error) {
    console.error(`❌ Failed to load config file: ./configs/${configName}.config.ts`);
    console.error(error);
    process.exit(1);
  }

  // Load simulation logs if provided
  let simulationLogs: string | undefined;
  let computeUnits: number | undefined;
  if (logsFile) {
    try {
      simulationLogs = fs.readFileSync(logsFile, "utf-8");
      // Try to extract compute units from logs
      const match = simulationLogs.match(/Units consumed: (\d+)/i) || simulationLogs.match(/consumed (\d+) of/);
      if (match) {
        computeUnits = parseInt(match[1]);
      }
    } catch (error) {
      console.warn(`⚠️  Could not load logs file: ${logsFile}`);
    }
  }

  // Generate PR description
  const prDescription = generatePRDescription({
    config,
    configName,
    bankAddress,
    base58Transaction,
    simulationLogs,
    computeUnits,
  });

  // Write to file
  const outputDir = path.join(__dirname, "pr_descriptions");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputFile = path.join(outputDir, `PR_DESCRIPTION_${config.assetName.toUpperCase()}.md`);
  fs.writeFileSync(outputFile, prDescription);

  console.log("✅ PR description generated successfully!");
  console.log(`📄 Output: ${outputFile}`);
  console.log();
  console.log("Preview:");
  console.log("═══════════════════════════════════════════════════════");
  console.log(prDescription);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
