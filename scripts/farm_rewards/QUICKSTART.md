# Quick Start Guide - Farm Rewards Harvesting

## TL;DR

```bash
# 1. Create your config file
cp scripts/farm_rewards/config.example.json scripts/farm_rewards/my-reward.json

# 2. Edit with your values
nano scripts/farm_rewards/my-reward.json

# 3. Run the harvest
ts-node scripts/harvest_farm_rewards.ts scripts/farm_rewards/my-reward.json
```

## Step-by-Step

### 1. Create a Config File

Start with the example config:

```bash
cp scripts/farm_rewards/config.example.json scripts/farm_rewards/usdc-kmno-0.json
```

### 2. Fill in Your Values

Edit `usdc-kmno-0.json`:

```json
{
  "PROGRAM_ID": "MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA",
  "BANK": "YOUR_BANK_ADDRESS_HERE",
  "LENDING_MARKET": "YOUR_KAMINO_LENDING_MARKET_HERE",
  "FARM_STATE": "YOUR_FARM_STATE_HERE",
  "GLOBAL_CONFIG": "YOUR_GLOBAL_CONFIG_HERE",
  "REWARD_MINT": "YOUR_REWARD_MINT_HERE",
  "REWARD_INDEX": 0,
  "MULTISIG": null
}
```

### 3. Run the Script

```bash
ts-node scripts/harvest_farm_rewards.ts scripts/farm_rewards/usdc-kmno-0.json
```

## Finding Config Values

### Get BANK Address
Your marginfi bank address (the one with Kamino integration).

### Get LENDING_MARKET Address
The Kamino lending market that the bank uses. You can find this from:
- Bank configuration
- Kamino's documentation
- Common mainnet market: `7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF`

### Get FARM_STATE Address
The Kamino farm state for your bank's reserve. Find it by:
1. Getting the bank's `kaminoReserve` address
2. Fetching the reserve account
3. Reading `reserve.farmCollateral` or `reserve.farmDebt`

### Get GLOBAL_CONFIG Address
The Kamino farms global config (same for all farms on mainnet).

### Get REWARD_MINT Address
The SPL token mint for the reward (e.g., KMNO token mint).

### REWARD_INDEX
Usually `0` for the first reward, `1` for the second, etc.

## Multiple Rewards

If you need to harvest multiple rewards:

### Option A: Run Multiple Times

```bash
ts-node scripts/harvest_farm_rewards.ts scripts/farm_rewards/usdc-kmno-0.json
ts-node scripts/harvest_farm_rewards.ts scripts/farm_rewards/sol-kmno-0.json
ts-node scripts/harvest_farm_rewards.ts scripts/farm_rewards/usdt-kmno-0.json
```

### Option B: Use a Batch Script

```bash
# Copy the example batch script
cp scripts/farm_rewards/harvest-all.example.sh scripts/farm_rewards/harvest-all.sh

# Edit to add your config files
nano scripts/farm_rewards/harvest-all.sh

# Make it executable
chmod +x scripts/farm_rewards/harvest-all.sh

# Run it
./scripts/farm_rewards/harvest-all.sh
```

## Using with Multisig (Squads)

For multisig transactions:

1. Update your config:
```json
{
  ...
  "MULTISIG": "YOUR_SQUADS_WALLET_ADDRESS"
}
```

2. Set `sendTx = false` in `harvest_farm_rewards.ts` (line 31)

3. Run the script to generate the transaction:
```bash
ts-node scripts/harvest_farm_rewards.ts scripts/farm_rewards/my-reward.json
```

4. Copy the base58-encoded transaction and import into Squads

## Troubleshooting

### "Config file not found"
- Check your file path is correct
- Use relative path from repo root or absolute path

### "Invalid public key"
- Verify all addresses are valid Solana base58 addresses
- Check for typos or extra spaces

### "Missing required field"
- Ensure all required fields are in your JSON
- Check field names match exactly (case-sensitive)

### "Failed to parse config"
- Validate your JSON syntax
- Remove trailing commas
- Ensure proper quotes around strings

## Best Practices

1. **Name your configs clearly**: `{bank}-{reward}-{index}.json`
2. **Don't commit mainnet configs**: Files ending in `-mainnet.json` or `-prod.json` are gitignored
3. **Test first**: Set `sendTx = false` to preview transactions
4. **Keep backups**: Save your config files securely
5. **Use batch scripts**: For multiple harvests, use the batch script

## Need Help?

- See `README_CONFIG.md` for detailed config documentation
- See `HARVEST_REWARDS_README.md` for technical details
- See `DEPENDENCIES.md` for dependency information

## Security Notes

⚠️ **Important:**
- Keep mainnet config files secure
- Don't commit production configs to public repos
- Verify addresses before running on mainnet
- Test with small amounts first

