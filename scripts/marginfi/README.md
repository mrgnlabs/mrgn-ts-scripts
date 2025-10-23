# Marginfi Bank Addition Workflow

This directory contains scripts and configuration files for adding new Marginfi banks to the lending protocol.

## Overview

The workflow consists of:
1. **Config Files** - TypeScript files that define all bank parameters
2. **Add Bank Script** - Loads config, generates transaction, and simulates it
3. **PR Description Generator** - Creates markdown documentation for the PR
4. **Squads Multisig** - Submit the transaction for approval

## Directory Structure

```
scripts/marginfi/
├── configs/
│   ├── marginfi-bank-config.types.ts  # Type definitions
│   ├── dzsol.config.ts                # dzSOL configuration
│   └── 2z.config.ts                   # 2Z configuration
├── pr_descriptions/
│   ├── PR_DESCRIPTION_DZSOL.md
│   └── PR_DESCRIPTION_2Z.md
├── add_bank_from_config.ts            # Main script to generate transaction
├── generate_pr_description.ts         # Generate PR markdown
└── README.md                          # This file
```

## Workflow Steps

### Step 1: Research Bank Parameters

Before creating a config file, research appropriate parameters by:
- Finding similar assets already on Marginfi
- Checking risk parameters (asset/liability weights)
- Determining appropriate limits (deposit, borrow, total asset value)
- Reviewing interest rate curves

**Key Parameters to Research:**
- Asset/Liability weights (collateral ratios)
- Deposit and borrow limits
- Interest rate configuration
- Oracle setup and max age

### Step 2: Create or Update Config File

Config files are located in `configs/` and follow this pattern:

```typescript
// Example: configs/dzsol.config.ts
import { PublicKey } from "@solana/web3.js";
import { MarginfiBankConfig } from "./marginfi-bank-config.types";

export const dzsolConfig: MarginfiBankConfig = {
  // Basic Info
  assetName: "dzSOL",
  assetDescription: "DoubleZero Staked SOL - Liquid staking token",

  // Network Config
  programId: "MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA", // Mainnet
  groupKey: new PublicKey("4qp6Fx6tnZkY5Wropq9wUYgtFxXKwE6viZxFHg3rdAG8"),
  admin: new PublicKey("CYXEgwbPHu2f9cY3mcUkinzDoDcsSan7myh1uBvYRbEw"),
  feePayer: new PublicKey("CYXEgwbPHu2f9cY3mcUkinzDoDcsSan7myh1uBvYRbEw"),
  multisigPayer: new PublicKey("CYXEgwbPHu2f9cY3mcUkinzDoDcsSan7myh1uBvYRbEw"),

  // Token Config
  bankMint: new PublicKey("Gekfj7SL2fVpTDxJZmeC46cTYxinjB6gkAnb6EGT6mnn"),
  decimals: 9,
  tokenProgram: "spl-token",
  seed: 0,

  // Oracle Config
  oracle: new PublicKey("8wRUjxh4uCdvQdqcWUMvBBTJa95vLuKrze7WLus5h6Gk"),
  oracleType: "switchboard",
  oracleMaxAge: 300,
  oracleMaxConfidence: 0,

  // Risk Parameters (research these!)
  assetWeightInit: 0.75,
  assetWeightMaint: 0.85,
  liabilityWeightInit: 1.25,
  liabilityWeightMaint: 1.15,

  // Limits (research these!)
  depositLimit: 1_000_000,
  borrowLimit: 500_000,
  totalAssetValueInitLimit: 10_000_000,

  // Interest Rate Config (research these!)
  optimalUtilizationRate: 0.85,
  plateauInterestRate: 0.10,
  maxInterestRate: 0.55,
  insuranceFeeFixedApr: 0,
  insuranceIrFee: 0,
  protocolFixedFeeApr: 0.0001,
  protocolIrFee: 0.06,
  protocolOriginationFee: 0,

  // Other Config
  operationalState: "operational",
  riskTier: "collateral",
  assetTag: 1, // 0 = default, 1 = SOL, 3 = KAMINO
};
```

### Step 3: Generate Transaction

Run the add bank script with your config:

```bash
npx tsx scripts/marginfi/add_bank_from_config.ts <config_name>
```

**Examples:**
```bash
# Add dzSOL bank
npx tsx scripts/marginfi/add_bank_from_config.ts dzsol

# Add 2Z bank
npx tsx scripts/marginfi/add_bank_from_config.ts 2z
```

**The script will:**
1. Load your config file
2. Display all parameters for review
3. Generate the transaction
4. **Automatically simulate with sigverify disabled**
5. Output:
   - Derived bank address
   - Base58-encoded transaction for Squads
   - Simulation results and logs

**Example Output:**
```
═══════════════════════════════════════════════════════
  Adding Marginfi Bank: dzSOL
═══════════════════════════════════════════════════════

📄 Config: dzsol.config.ts
🏦 Asset: dzSOL (DoubleZero Staked SOL - Liquid staking token)
🪙  Mint: Gekfj7SL2fVpTDxJZmeC46cTYxinjB6gkAnb6EGT6mnn
🔮 Oracle: 8wRUjxh4uCdvQdqcWUMvBBTJa95vLuKrze7WLus5h6Gk (switchboard)
🌱 Seed: 0

🔄 Simulating transaction...
✅ Simulation successful!

📊 Simulation Results:
  Compute Units: 91,375 / 200,000

📝 Full Simulation Logs:
  [0] Program MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA invoke [1]
  [1] Program log: Instruction: LendingPoolAddBankWithSeed
  ...

═══════════════════════════════════════════════════════
  Transaction Ready for Squads Multisig
═══════════════════════════════════════════════════════

🏦 Bank Address:
<derived_bank_address>

📦 Base58-encoded Transaction:
<base58_transaction>
```

### Step 4: Generate PR Description

Generate the markdown documentation:

```bash
npx tsx scripts/marginfi/generate_pr_description.ts <config_name> <bank_address> <base58_tx>
```

**Example:**
```bash
npx tsx scripts/marginfi/generate_pr_description.ts dzsol \
  <bank_address_from_step3> \
  <base58_tx_from_step3>
```

**Optional**: Include simulation logs in a file:
```bash
# Copy simulation logs to a file
npx tsx scripts/marginfi/add_bank_from_config.ts dzsol > output.txt

# Generate PR description with logs
npx tsx scripts/marginfi/generate_pr_description.ts dzsol \
  <bank_address> \
  <base58_tx> \
  output.txt
```

This creates a file in `pr_descriptions/PR_DESCRIPTION_<ASSET>.md` with:
- Summary and configuration tables
- Verification links
- Transaction details
- Simulation results
- Notes

### Step 5: Submit to Squads

1. Copy the base58-encoded transaction from Step 3
2. Go to [Squads Protocol](https://v3.squads.so/)
3. Create a new transaction proposal
4. Paste the base58 transaction
5. Add the PR description as context
6. Submit for multisig approval

### Step 6: Create Pull Request

1. Commit your config file (but **not** any temporary scripts with credentials)
2. Include the PR description markdown
3. Create a pull request with the changes

## Configuration Reference

### Oracle Types
- `pyth` - Pyth oracle (type 3)
- `switchboard` - Switchboard Pull oracle (type 4)

### Token Program Types
- `spl-token` - Standard SPL Token program
- `token-2022` - Token Extensions (Token-2022) program

### Risk Tiers
- `collateral` - Can be used as collateral
- `isolated` - Cannot be used as collateral (isolated pools)

### Operational States
- `operational` - Normal operations (deposits, borrows, withdrawals allowed)
- `paused` - All operations paused
- `reduceOnly` - Only withdrawals and repays allowed

### Asset Tags
- `0` - Default (no special category)
- `1` - SOL assets (native SOL, LSTs)
- `3` - Kamino-integrated assets

## Common Asset Types and Typical Parameters

### Liquid Staking Tokens (LSTs)
**Examples**: mSOL, jitoSOL, bSOL, dzSOL

**Typical Parameters:**
- Asset Weight Init: 0.70 - 0.80 (70-80%)
- Asset Weight Maint: 0.80 - 0.90 (80-90%)
- Liability Weight Init: 1.20 - 1.30 (120-130%)
- Liability Weight Maint: 1.10 - 1.20 (110-120%)
- Asset Tag: 1 (SOL category)

### Volatile Ecosystem Tokens
**Examples**: JTO, similar governance tokens, 2Z

**Typical Parameters:**
- Asset Weight Init: 0.50 - 0.60 (50-60%)
- Asset Weight Maint: 0.60 - 0.70 (60-70%)
- Liability Weight Init: 1.50 - 2.00 (150-200%)
- Liability Weight Maint: 1.25 - 1.50 (125-150%)
- Asset Tag: 0 (default)

### Stablecoins
**Examples**: USDC, USDT, PYUSD

**Typical Parameters:**
- Asset Weight Init: 0.90 - 0.95 (90-95%)
- Asset Weight Maint: 0.95 - 1.00 (95-100%)
- Liability Weight Init: 1.00 - 1.05 (100-105%)
- Liability Weight Maint: 1.00 - 1.02 (100-102%)
- Asset Tag: 0 (default)

## Important Notes

### Security
- ⚠️ **Never commit files with private keys or credentials**
- ⚠️ Always use environment variables for sensitive data
- ⚠️ Double-check all addresses before submitting
- ⚠️ Verify simulation succeeds before submitting to Squads

### Configuration Best Practices
1. **Research thoroughly** - Check similar assets for appropriate parameters
2. **Start conservative** - It's easier to loosen limits than tighten them
3. **Verify on-chain data** - Confirm mint addresses, decimals, and oracle addresses
4. **Test simulation** - Always simulate before submitting
5. **Document decisions** - Add comments explaining parameter choices

### Oracle Configuration
- Pyth oracles: Use for major assets with Pyth price feeds
- Switchboard oracles: Use for assets with Switchboard feeds
- Oracle max age: Typically 300 seconds (5 minutes)
- Oracle max confidence: 0 = default 10% max confidence threshold

### Interest Rate Curves
- Optimal utilization: Point where rates shift to exponential curve
- Plateau rate: APR at optimal utilization
- Max rate: APR at 100% utilization (typically much higher)
- Fees: Protocol and insurance fees as percentage of interest

## Troubleshooting

### Config file not found
```
❌ Failed to load config file: ./configs/dzsol.config.ts
```
**Solution**: Ensure the config file exists and exports a variable ending in "Config"

### Simulation failed
```
❌ Simulation failed:
{ ... }
```
**Solution**: Review the error message and check:
- All addresses are correct
- Oracle is valid and accessible
- Parameters are within acceptable ranges
- Token program matches the mint

### Type errors
```
Type 'X' is not assignable to type 'Y'
```
**Solution**: Check that your config matches the `MarginfiBankConfig` interface in `marginfi-bank-config.types.ts`

## Support

For questions or issues:
1. Check existing config files for examples
2. Review the Kamino bank workflow in `scripts/kamino/`
3. Consult the Marginfi documentation
4. Ask the team in Discord or GitHub Issues
