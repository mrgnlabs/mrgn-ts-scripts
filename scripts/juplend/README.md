# JupLend Integration Scripts

Scripts for managing JupLend banks on Marginfi. 

## Prerequisites

- `.env.api` at repo root with `API_URL` (Solana RPC endpoint)
- Wallet keypair file (path passed to each script)

## Program IDs

| Environment | Program ID |
|---|---|
| Production | `MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA` |
| Staging | `stag8sTKds2h4KzjUw3zKTsxbqvT4XKHdaR9X9E6Rct` |

JupLend program addresses (same on all environments):
- Lending: `jup3YeL8QhtSx1e253b2FDvsMNC87fDrgQZivbrndc9`
- Liquidity: `jupeiUmn818Jg1ekPURTpr4mFo29p46vygyykFJ3wZC`
- Earn Rewards: `jup7TthsMgcR9Y3L277b8Eo9uboVSmu1utkuXHNUKar`

## Workflow

Typical order when adding a new JupLend asset:

```
1. add_bank.ts       Create the bank (admin)
2. init_position.ts  Seed deposit + activate (permissionless)
3. bank_metadata.ts  Init + write on-chain metadata (metadata admin)
4. deposit.ts        Deposit funds (user)
5. withdraw.ts       Withdraw funds (user)
6. close_bank.ts     Close empty bank (admin)
```

## Scripts

### add_bank.ts

Create a JupLend bank from a JSON config file.

```bash
tsx scripts/juplend/add_bank.ts configs/banks/usdc.json
```

The script reads config from a JSON file under `configs/banks/`. Set `sendTx = true` in the script to execute, or leave `false` to output a base58-encoded transaction for multisig signing.

**Config JSON fields:**

```json
{
  "programId": "MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA",
  "group": "<GROUP_PUBKEY>",
  "bankMint": "<TOKEN_MINT>",
  "juplendLending": "<JUPLEND_LENDING_PDA>",
  "fTokenMint": "<JUPLEND_FTOKEN_MINT>",
  "seed": 600,
  "oracle": "<ORACLE_PUBKEY>",
  "oracleSetup": "juplendPythPull",
  "assetWeightInit": "0.9",
  "assetWeightMaint": "0.95",
  "depositLimit": "1000000000000",
  "totalAssetValueInitLimit": "1000000000",
  "riskTier": "collateral",
  "oracleMaxAge": 60,
  "admin": "<OPTIONAL_ADMIN_PUBKEY>",
  "feePayer": "<OPTIONAL_FEE_PAYER>",
  "multisigPayer": "<OPTIONAL_SQUADS_PUBKEY>"
}
```

- `oracleSetup`: `"juplendPythPull"` or `"juplendSwitchboardPull"`
- `riskTier`: `"collateral"` or `"isolated"`
- Lending PDAs and fToken mints for each asset are listed in `configs/juplend-assets.json`

### init_position.ts

Activate a bank with a seed deposit. Edit the inline `config` object:

```typescript
const config: Config = {
  PROGRAM_ID: "stag8sTKds2h4KzjUw3zKTsxbqvT4XKHdaR9X9E6Rct",
  BANK: new PublicKey("<BANK_ADDRESS>"),
  AMOUNT: new BN(10000), // seed deposit in native units
};
```

```bash
tsx scripts/juplend/init_position.ts
```

The script fetches the bank on-chain to get mint, lending, and fToken vault addresses. Handles WSOL wrapping automatically.

### deposit.ts

Deposit into a JupLend bank. Edit the inline `config` object:

```typescript
const config: Config = {
  PROGRAM_ID: "stag8sTKds2h4KzjUw3zKTsxbqvT4XKHdaR9X9E6Rct",
  BANK: new PublicKey("<BANK_ADDRESS>"),
  ACCOUNT: new PublicKey("<MARGINFI_ACCOUNT>"),
  AMOUNT: new BN(100000), // in native token units
};
```

```bash
tsx scripts/juplend/deposit.ts
```

### withdraw.ts

Withdraw from a JupLend bank. Edit the inline `config` object:

```typescript
const config: Config = {
  PROGRAM_ID: "stag8sTKds2h4KzjUw3zKTsxbqvT4XKHdaR9X9E6Rct",
  BANK: new PublicKey("<BANK_ADDRESS>"),
  ACCOUNT: new PublicKey("<MARGINFI_ACCOUNT>"),
  AMOUNT: new BN(100000),
  WITHDRAW_ALL: false, // set true to withdraw entire position
};
```

```bash
tsx scripts/juplend/withdraw.ts
```

### bank_metadata.ts

Initialize and write on-chain metadata (ticker + description) for JupLend banks. This runs two instructions per bank:

1. `initBankMetadata` — pays rent to create the metadata PDA (permissionless, skipped if already exists)
2. `writeBankMetadata` — writes ticker and description bytes (requires metadata admin)

Edit the inline `config` object with the bank addresses and metadata:

```typescript
const config: Config = {
  PROGRAM_ID: "stag8sTKds2h4KzjUw3zKTsxbqvT4XKHdaR9X9E6Rct",
  GROUP: new PublicKey("<GROUP_ADDRESS>"),
  BANKS: [
    {
      bank: new PublicKey("<BANK_ADDRESS>"),
      ticker: "USDC | USD Coin",
      description: "USD Coin | Stablecoin | USDC | JupLend",
    },
  ],
};
```

```bash
tsx scripts/juplend/bank_metadata.ts
```

The metadata PDA is derived as `["metadata", bank_pubkey]`. Bank addresses for deployed banks can be found in `configs/created-banks.json`.

### close_bank.ts

Close an empty JupLend bank. Edit the inline `config` object:

```typescript
const config: Config = {
  PROGRAM_ID: "stag8sTKds2h4KzjUw3zKTsxbqvT4XKHdaR9X9E6Rct",
  BANK: new PublicKey("<BANK_ADDRESS>"),
};
```

```bash
tsx scripts/juplend/close_bank.ts
```

## Multisig Mode

All scripts support multisig (Squads) by setting `sendTx = false`. When disabled, the script simulates the transaction and outputs a base58-encoded transaction that can be imported into Squads for signing. Set `MULTISIG_PAYER` in the config to the Squads vault address.

## Directory Layout

```
scripts/juplend/
├── add_bank.ts          # Create bank (config file driven)
├── init_position.ts     # Seed deposit + activate
├── bank_metadata.ts     # Init + write on-chain metadata
├── deposit.ts           # User deposit
├── withdraw.ts          # User withdraw
├── close_bank.ts        # Close empty bank
├── lib/
│   └── utils.ts         # PDA derivers, constants, config parser
└── configs/
    ├── juplend-assets.json   # Asset/mint/lending PDA mapping
    ├── oracles.json          # Cached oracle addresses
    ├── created-banks.json    # Deployed bank records
    └── banks/
        └── example.json      # Bank config template
```

## Supported Assets

See `configs/juplend-assets.json` for the full list. Current assets:

WSOL, USDC, USDT, EURC, USDG, USDS, USDV, EURCV, JUPUSD
