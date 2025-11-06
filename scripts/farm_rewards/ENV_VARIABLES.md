# Environment Variables

The harvest rewards script reads configuration from `.env` file in the project root.

## Supported Variables

### RPC Endpoint

You can use either variable name:

```bash
# Option 1: Using PRIVATE_RPC_ENDPOINT (with or without quotes)
PRIVATE_RPC_ENDPOINT="https://rpc.ironforge.network/mainnet?apiKey=YOUR_KEY"
# or
PRIVATE_RPC_ENDPOINT=https://rpc.ironforge.network/mainnet?apiKey=YOUR_KEY

# Option 2: Using API_URL (legacy)
API_URL="https://rpc.ironforge.network/mainnet?apiKey=YOUR_KEY"
# or
API_URL=https://rpc.ironforge.network/mainnet?apiKey=YOUR_KEY
```

> **Note:** 
> - Quotes are optional and will be automatically stripped if present
> - If `PRIVATE_RPC_ENDPOINT` is set, it will be used as `API_URL` automatically

### Wallet Path

```bash
# Use full absolute path (with or without quotes)
MARGINFI_WALLET=/Users/yourusername/.config/solana/keys/distribution.json
# or
MARGINFI_WALLET="/Users/yourusername/.config/solana/keys/distribution.json"

# Or relative path (will be relative to $HOME)
MARGINFI_WALLET=/.config/solana/keys/distribution.json
```

> **Note:** 
> - Quotes are optional and will be automatically stripped if present
> - The script automatically converts absolute paths to relative paths for internal processing

## Example `.env` File

```bash
# RPC Configuration
PRIVATE_RPC_ENDPOINT="https://rpc.ironforge.network/mainnet?apiKey=01JSM3Y55JEA2H80FJVZBVZDBG"

# Wallet Configuration
MARGINFI_WALLET=/Users/fenrir/.config/solana/keys/distribution_20251105.json
```

## Default Values

If environment variables are not set, the script uses these defaults:

- **RPC Endpoint:** `https://api.mainnet-beta.solana.com` (public Solana mainnet RPC)
- **Wallet Path:** `~/.config/solana/id.json` (default Solana CLI wallet)

## Priority Order

1. `.env` in project root (loaded first)
2. `.env.api` (loaded by commonSetup, optional)
3. Default values

## Usage

The script automatically loads these variables:

```bash
pnpm exec ts-node scripts/harvest_farm_rewards.ts scripts/farm_rewards/pyusd.json
```

Output will show:
```
Using wallet: /.config/solana/keys/distribution_20251105.json
api: https://rpc.ironforge.network/mainnet?apiKey=...
```

## Security Notes

⚠️ **Important:**
- Never commit `.env` files to git
- Keep your API keys and private wallet paths secure
- Add `.env` to `.gitignore`
- Use different RPC endpoints for testing and production

## Troubleshooting

### Wallet not found
```
Error: ENOENT: no such file or directory
```
**Solution:** Check that `MARGINFI_WALLET` path exists and is accessible.

### RPC connection issues
```
Error: 429 Too Many Requests
```
**Solution:** Verify your `PRIVATE_RPC_ENDPOINT` has sufficient rate limits and API key is valid.

### Using wrong wallet
Check the output:
```
Using wallet: <path-shown-here>
```
If it's not the expected wallet, verify your `.env` file has the correct `MARGINFI_WALLET` value.

