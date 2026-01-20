# Drift Integration Scripts

Scripts for managing drift-enabled marginfi banks on the staging program.

## Setup

All scripts use environment variables from `.env` and `.env.api`:

- `MARGINFI_WALLET` - Path to wallet keypair
- `API_URL` - RPC endpoint URL

## Scripts

### 1. Add Drift Bank

Adds a drift-enabled bank to the marginfi group and initializes the drift user.

```bash
npx ts-node scripts/drift-staging/add_drift_bank.ts configs/usdc.json
```

**Config file format** (`configs/*.json`):
```json
{
  "programId": "PROGRAM_ID_HERE",
  "group": "GROUP_PUBKEY_HERE",
  "bankMint": "MINT_PUBKEY_HERE",
  "driftMarketIndex": 0,
  "oracle": "ORACLE_PUBKEY_HERE",
  "driftOracle": "DRIFT_ORACLE_PUBKEY_HERE",
  "depositLimit": "100000000000000",
  "totalAssetValueInitLimit": "10000000000000",
  "seed": "555",
  "initDepositAmount": "100"
}
```

**Operations:**
1. Calls `lendingPoolAddBankDrift` to create the bank
2. Calls `driftInitUser` to initialize drift user (min 100 units deposit)

---

### 2. Create Marginfi Account

Creates a marginfi account for the wallet (one-time setup).

```bash
npx ts-node scripts/drift-staging/create_marginfi_account.ts PROGRAM_ID GROUP_PUBKEY
```

**Operations:**
- Calls `marginfiAccountInitialize` (seed 0)

---

### 3. Deposit

Deposits tokens into a drift-enabled bank.

```bash
npx ts-node scripts/drift-staging/deposit.ts configs/usdc.json 1000
```

**Operations:**
- Calls `driftDeposit` with the specified amount

---

### 4. Withdraw

Withdraws tokens from a drift-enabled bank.

```bash
# Withdraw specific amount
npx ts-node scripts/drift-staging/withdraw.ts configs/usdc.json 500

# Withdraw all
npx ts-node scripts/drift-staging/withdraw.ts configs/usdc.json 0 true
```

**Operations:**
- Fetches all active banks for health check remaining accounts
- Calls `driftWithdraw` with amount or withdraw_all flag

**Note:** Requires remaining accounts for ALL other active banks in the marginfi account for drift health checks.

---

### 5. Harvest Rewards

Harvests admin rewards from drift positions 2-7.

```bash
npx ts-node scripts/drift-staging/harvest_rewards.ts configs/usdc.json
```

**Operations:**
- Fetches drift user to check active reward positions (2-7)
- Calls `driftHarvestReward` to withdraw rewards to global fee wallet

**Note:** Only relevant when 2+ admin deposits are active. Positions 0-1 are user deposits (no rewards).

---

## Implementation Details

### PDAs

All necessary PDAs are derived in `lib/utils.ts`:
- Bank (with seed)
- Marginfi account
- Drift state, signer, spot market, spot market vault
- Drift user, user stats
- Liquidity vault authority

### Simulation

All scripts simulate transactions before execution and display:
- Program logs
- Compute units consumed
- Error details if simulation fails

### Config-Driven

Bank configuration uses external JSON files for easy reuse and documentation.

### Drift-Specific Rules

1. **All assets need oracle** - No special cases for USDC/quote assets
2. **Scaled balances** - Drift uses 9 decimals internally for all assets
3. **Min init deposit** - 100 smallest units required for driftInitUser
4. **Bank mint** - Equals drift spot market mint (NOT actual token mint)
5. **Withdrawal health check** - Must pass remaining accounts for ALL other active banks
6. **Reward accounts** - Required if 2+ admin deposits active (positions 2-7)
7. **Oracle type** - Must use Pyth Pull (`oracleSetup: { driftPythPull: {} }`)

### Priority Banks for Testing

The following banks should be set up for comprehensive drift integration testing:

1. **USDS** - Has rewards on drift, tests reward harvesting functionality
2. **BSOL** - Has rewards on drift, tests reward harvesting functionality
3. **PYUSD** - Token-2022 program, tests SPL token 2022 compatibility

These banks will exercise:
- Reward account handling (USDS, BSOL)
- Token-2022 program compatibility (PYUSD)
- Different oracle configurations
- Health check with multiple active drift positions
