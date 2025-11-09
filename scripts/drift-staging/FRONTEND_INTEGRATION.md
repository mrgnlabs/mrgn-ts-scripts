# Drift Integration - Frontend Guide

**Reference**: Conversion formulas from [drift-mocks/src/state.rs](https://github.com/mrgnlabs/marginfi-v2-internal/blob/e25afce3e3d6bfb7afbc3104de59e25aeebb0552/programs/drift-mocks/src/state.rs#L133-L207)

**Example Account**: Marginfi account `4PfteTYTBPQyNaEygBiqRjAcuDKevbDz4qCdkXjy9988` has active drift deposits (USDC, PYUSD) and normal bank borrow (USDC)

## Remaining Accounts

### For Drift Bank Operations (deposit/withdraw)

Drift instructions require remaining accounts in this specific order:

1. **Oracle** (read-only) - From `bank.config.oracleKeys[0]`, skip if USDC (market index 0)
2. **Drift Spot Market** (read-only) - From `bank.driftSpotMarket`
3. **Token Mint** (read-only, optional) - Only if using Token-2022

## Deposit Tokens ↔ Asset Shares

Formulas from Drift:

### Shares → Amount

```typescript
// Convert asset shares to token amount
function getTokenAmount(assetShares: BN, bank: Bank): BN {
  const depositBalance = bank.driftState.depositBalance;
  const cumulativeDepositInterest = bank.driftState.cumulativeDepositInterest;

  if (depositBalance.eq(new BN(0))) {
    return assetShares;
  }

  return assetShares
    .mul(cumulativeDepositInterest)
    .div(SPOT_BALANCE_PRECISION)
    .mul(depositBalance)
    .div(SPOT_BALANCE_PRECISION);
}
```

### Amount → Shares

```typescript
// Convert token amount to asset shares
function getAssetShares(tokenAmount: BN, bank: Bank): BN {
  const depositBalance = bank.driftState.depositBalance;
  const cumulativeDepositInterest = bank.driftState.cumulativeDepositInterest;

  if (cumulativeDepositInterest.eq(new BN(0))) {
    return tokenAmount;
  }

  return tokenAmount
    .mul(SPOT_BALANCE_PRECISION)
    .div(depositBalance)
    .mul(SPOT_BALANCE_PRECISION)
    .div(cumulativeDepositInterest);
}

const SPOT_BALANCE_PRECISION = new BN(10).pow(new BN(9));
```

## Special Argument Fields

### driftWithdraw

- **amount**: Base units to withdraw
- **withdrawAll**: Pass `true` to withdraw full balance, `null` for partial

### driftDeposit

- **amount**: Base units to deposit

### Reward Fields

For banks with drift rewards (USDS, BSOL):

- **driftRewardOracle**: First reward oracle address
- **driftRewardSpotMarket**: First reward spot market
- **driftRewardMint**: First reward mint
- **driftRewardOracle2**: Second reward oracle (if applicable)
- **driftRewardSpotMarket2**: Second reward spot market (if applicable)
- **driftRewardMint2**: Second reward mint (if applicable)

Pass `null` for unused reward slots.

## Key Differences vs Kamino

- No manual reserve refresh needed (automatic)
- Asset shares use Drift's accounting model
- Remaining accounts must include all active positions for health check
