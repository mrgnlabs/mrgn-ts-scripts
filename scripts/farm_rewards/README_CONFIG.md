# Farm Rewards Config Files

## Overview

This directory contains configuration files for harvesting different farm rewards. Each config file specifies the parameters needed to harvest a specific reward from a specific farm.

## Config File Format

Config files should be JSON files with the following structure:

```json
{
  "PROGRAM_ID": "MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA",
  "BANK": "BankPublicKeyHere",
  "LENDING_MARKET": "KaminoLendingMarketPublicKeyHere",
  "FARM_STATE": "FarmStatePublicKeyHere",
  "GLOBAL_CONFIG": "GlobalConfigPublicKeyHere",
  "REWARD_MINT": "RewardMintPublicKeyHere",
  "REWARD_INDEX": 0,
  "MULTISIG": null
}
```

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `PROGRAM_ID` | string | Yes | Marginfi program ID (mainnet) |
| `BANK` | string | Yes | The marginfi bank address with Kamino farm |
| `LENDING_MARKET` | string | Yes | The Kamino lending market address |
| `FARM_STATE` | string | Yes | The Kamino farm state address |
| `GLOBAL_CONFIG` | string | Yes | The Kamino farms global config address |
| `REWARD_MINT` | string | Yes | The SPL token mint for the reward |
| `REWARD_INDEX` | number | Yes | The reward index (usually 0 for first reward) |
| `MULTISIG` | string\|null | No | Multisig wallet address if not sending directly |

## Usage

### Running with a Config File

```bash
# Basic usage
ts-node scripts/harvest_farm_rewards.ts scripts/farm_rewards/my-reward-config.json

# Or from the root directory
ts-node scripts/harvest_farm_rewards.ts ./scripts/farm_rewards/usdc-farm-reward-0.json
```

### Creating a New Config

1. Copy the example config:
   ```bash
   cp scripts/farm_rewards/config.example.json scripts/farm_rewards/my-reward.json
   ```

2. Edit the new config file with your specific values:
   ```bash
   nano scripts/farm_rewards/my-reward.json
   ```

3. Run the harvest script:
   ```bash
   ts-node scripts/harvest_farm_rewards.ts scripts/farm_rewards/my-reward.json
   ```

## Config File Naming Convention

Suggested naming format:
```
{bank-name}-{reward-token}-{reward-index}.json
```

Examples:
- `usdc-bank-kmno-0.json` - USDC bank, KMNO reward, index 0
- `sol-bank-jto-1.json` - SOL bank, JTO reward, index 1
- `usdt-bank-kmno-0.json` - USDT bank, KMNO reward, index 0

## Example Configs

### Example 1: USDC Bank KMNO Rewards
```json
{
  "PROGRAM_ID": "MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA",
  "BANK": "CCKtUs6Cgwo4aaQUmBPmyoApH2gUDErxNZCAntD6LYGh",
  "LENDING_MARKET": "7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF",
  "FARM_STATE": "FarmStatePublicKeyHere",
  "GLOBAL_CONFIG": "GlobalConfigPublicKeyHere",
  "REWARD_MINT": "KMNo3nJsBXfcpJTVhZcXLW7RmTwTt4GVFE7suUBo9sS",
  "REWARD_INDEX": 0,
  "MULTISIG": null
}
```

### Example 2: Using Multisig
```json
{
  "PROGRAM_ID": "MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA",
  "BANK": "BankPublicKeyHere",
  "LENDING_MARKET": "7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF",
  "FARM_STATE": "FarmStatePublicKeyHere",
  "GLOBAL_CONFIG": "GlobalConfigPublicKeyHere",
  "REWARD_MINT": "RewardMintPublicKeyHere",
  "REWARD_INDEX": 0,
  "MULTISIG": "CYXEgwbPHu2f9cY3mcUkinzDoDcsSan7myh1uBvYRbEw"
}
```

## Managing Multiple Rewards

If you have multiple farms/rewards to harvest, create separate config files:

```
scripts/farm_rewards/
  ├── config.example.json
  ├── usdc-kmno-0.json
  ├── usdc-jto-1.json
  ├── sol-kmno-0.json
  └── usdt-kmno-0.json
```

Then run them one at a time or create a batch script:

```bash
#!/bin/bash
# harvest-all.sh

ts-node scripts/harvest_farm_rewards.ts scripts/farm_rewards/usdc-kmno-0.json
ts-node scripts/harvest_farm_rewards.ts scripts/farm_rewards/usdc-jto-1.json
ts-node scripts/harvest_farm_rewards.ts scripts/farm_rewards/sol-kmno-0.json
ts-node scripts/harvest_farm_rewards.ts scripts/farm_rewards/usdt-kmno-0.json
```

## Validation

The script will validate that:
- All required fields are present
- All public keys are valid Solana addresses
- The config file can be read and parsed

## Security Notes

- ⚠️ **Do not commit config files with real mainnet addresses to public repositories**
- Consider adding `*-config.json` or `*-mainnet.json` to `.gitignore`
- Keep config files in a secure location
- Use environment variables or secrets management for sensitive deployments

## Troubleshooting

### Error: "Config file not found"
- Check the path to your config file
- Use relative or absolute paths
- Ensure the file has a `.json` extension

### Error: "Invalid public key"
- Verify all addresses are valid Solana public keys (base58)
- Check for typos or missing characters
- Ensure no extra spaces in the JSON file

### Error: "Failed to parse config"
- Validate JSON syntax (use a JSON validator)
- Check for missing commas or quotes
- Ensure proper escaping of special characters

