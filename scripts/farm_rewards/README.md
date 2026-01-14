# Farm Rewards Harvesting System

A flexible system for harvesting Kamino farm rewards attached to marginfi banks on Solana mainnet.

## 📁 Files Overview

| File | Purpose |
|------|---------|
| `harvest_farm_rewards.ts` | Main harvest script (in parent scripts/ directory) |
| `config.example.json` | Template config file |
| `QUICKSTART.md` | Quick start guide - **START HERE** |
| `README_CONFIG.md` | Detailed config documentation |
| `HARVEST_REWARDS_README.md` | Technical implementation details |
| `DEPENDENCIES.md` | Dependency information |
| `harvest-all.example.sh` | Batch harvesting script example |
| `kamino-instructions.ts` | Reference Kamino instruction builders |
| `k13_KfarmsHarvestReward.spec.ts` | Reference test file |
| `.gitignore` | Prevents committing production configs |

## 🚀 Quick Start

```bash
# 1. Copy example config
cp scripts/farm_rewards/config.example.json scripts/farm_rewards/my-reward.json

# 2. Edit with your values
nano scripts/farm_rewards/my-reward.json

# 3. Run harvest
ts-node scripts/harvest_farm_rewards.ts scripts/farm_rewards/my-reward.json
```

👉 **For detailed instructions, see [QUICKSTART.md](./QUICKSTART.md)**

## 📋 Config File Format

```json
{
  "PROGRAM_ID": "MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA",
  "BANK": "BankPublicKeyHere",
  "LENDING_MARKET": "KaminoLendingMarketHere",
  "FARM_STATE": "FarmStatePublicKeyHere",
  "GLOBAL_CONFIG": "GlobalConfigPublicKeyHere",
  "REWARD_MINT": "RewardMintPublicKeyHere",
  "REWARD_INDEX": 0,
  "MULTISIG": null
}
```

## 🎯 Use Cases

### Single Reward Harvest
```bash
ts-node scripts/harvest_farm_rewards.ts scripts/farm_rewards/usdc-kmno-0.json
```

### Multiple Rewards (Sequential)
```bash
ts-node scripts/harvest_farm_rewards.ts scripts/farm_rewards/usdc-kmno-0.json
ts-node scripts/harvest_farm_rewards.ts scripts/farm_rewards/sol-kmno-0.json
ts-node scripts/harvest_farm_rewards.ts scripts/farm_rewards/usdt-kmno-0.json
```

### Batch Harvest
```bash
# Use the batch script
./scripts/farm_rewards/harvest-all.sh
```

### Multisig Transaction
1. Set `sendTx = false` in `harvest_farm_rewards.ts`
2. Add `"MULTISIG": "your-squads-address"` to config
3. Run script to generate base58 transaction
4. Import into Squads

## 📚 Documentation

- **[QUICKSTART.md](./QUICKSTART.md)** - Get started in 5 minutes
- **[README_CONFIG.md](./README_CONFIG.md)** - Detailed config documentation
- **[HARVEST_REWARDS_README.md](./HARVEST_REWARDS_README.md)** - Technical details
- **[DEPENDENCIES.md](./DEPENDENCIES.md)** - Dependency information

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│  Config File (JSON)                     │
│  - Bank addresses                       │
│  - Farm parameters                      │
│  - Reward details                       │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  harvest_farm_rewards.ts                │
│  - Load & validate config               │
│  - Derive PDAs                          │
│  - Build transaction                    │
│  - Send or export for multisig         │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  Marginfi Program (kamino IDL)          │
│  - kaminoHarvestReward instruction      │
│  - Auto-derive PDAs                     │
│  - Transfer to fee wallet               │
└─────────────────────────────────────────┘
```

## 🔒 Security

- **Gitignore**: Production configs (`*-mainnet.json`, `*-prod.json`) are automatically ignored
- **Validation**: All config values are validated before use
- **Preview**: Set `sendTx = false` to preview transactions
- **Access Control**: Only fee admin can harvest rewards

## 🛠️ Requirements

- Node.js with TypeScript support
- Access to marginfi fee admin wallet
- Properly configured Kamino farms on the banks
- Config files with correct addresses

## 📝 Config File Naming

We recommend this naming convention:

```
{bank-token}-{reward-token}-{reward-index}.json
```

Examples:
- `usdc-kmno-0.json` - USDC bank, KMNO reward, index 0
- `sol-jto-1.json` - SOL bank, JTO reward, index 1
- `usdt-kmno-0.json` - USDT bank, KMNO reward, index 0

## ⚠️ Important Notes

1. **Fee Admin Only**: This script requires fee admin privileges
2. **Kamino Banks Only**: Only works with banks that have Kamino markets
3. **Accrued Rewards**: Only harvests rewards that have already accrued
4. **Destination**: Rewards go directly to the global fee wallet
5. **Gas Fees**: Ensure wallet has SOL for transaction fees

## 🧪 Testing

Before running on mainnet:

1. ✅ Verify all addresses in config are correct
2. ✅ Check the bank has a Kamino market configured
3. ✅ Verify farm has rewards available
4. ✅ Test with `sendTx = false` first
5. ✅ Review the generated transaction

## 🐛 Troubleshooting

See [QUICKSTART.md](./QUICKSTART.md#troubleshooting) for common issues and solutions.

## 📞 Support

For issues or questions:
1. Check the documentation files in this directory
2. Review the test file: `k13_KfarmsHarvestReward.spec.ts`
3. Verify Kamino SDK documentation
4. Ensure all addresses are correct for mainnet

## 🔄 Workflow Example

```bash
# Daily harvest routine
cd /path/to/mrgn-ts-scripts

# Harvest USDC farm rewards
ts-node scripts/harvest_farm_rewards.ts \
  scripts/farm_rewards/usdc-kmno-0.json

# Harvest SOL farm rewards  
ts-node scripts/harvest_farm_rewards.ts \
  scripts/farm_rewards/sol-kmno-0.json

# Or use batch script for all
./scripts/farm_rewards/harvest-all.sh
```

## 📊 Output Example

```
Loading config from: scripts/farm_rewards/usdc-kmno-0.json
✅ Config loaded successfully

Harvesting farm rewards...
Program ID: MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA
Bank: CCKtUs6Cgwo4aaQUmBPmyoApH2gUDErxNZCAntD6LYGh
Lending Market: 7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF
Farm State: FarmState...
Reward Mint: KMNo3nJsBXfcpJTVhZcXLW7RmTwTt4GVFE7suUBo9sS
...
✅ Transaction signature: 5j7s...
View on Solana Explorer: https://explorer.solana.com/tx/5j7s...
✨ Harvest farm rewards complete!
```

## 🤝 Contributing

When adding new features:
1. Update relevant documentation
2. Add example configs if needed
3. Test with both direct and multisig flows
4. Update QUICKSTART.md for user-facing changes

---

**Quick Links:**
- 🚀 [QUICKSTART.md](./QUICKSTART.md) - Get started
- 📖 [README_CONFIG.md](./README_CONFIG.md) - Config details
- 🔧 [HARVEST_REWARDS_README.md](./HARVEST_REWARDS_README.md) - Technical docs

