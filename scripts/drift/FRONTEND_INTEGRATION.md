# Drift Integration - Frontend Guide

**Reference**: Conversion formulas from [drift-mocks/src/state.rs](https://github.com/mrgnlabs/marginfi-v2-internal/blob/e25afce3e3d6bfb7afbc3104de59e25aeebb0552/programs/drift-mocks/src/state.rs#L133-L207)

**Example Account**: Marginfi account `4PfteTYTBPQyNaEygBiqRjAcuDKevbDz4qCdkXjy9988` has active drift deposits (USDC, PYUSD) and normal bank borrow (USDC)

## Remaining Accounts

### For Drift Bank Operations (deposit/withdraw)

Drift instructions require remaining accounts in this specific order:

1. **Oracle** (read-only) - From `bank.config.oracleKeys[0]`, skip if USDC (market index 0)
2. **Drift Spot Market** (read-only) - From `bank.driftSpotMarket`

## Deposit Tokens ↔ Asset Shares

Formulas from Drift:

https://github.com/mrgnlabs/marginfi-v2-internal/blob/e25afce3e3d6bfb7afbc3104de59e25aeebb0552/programs/drift-mocks/src/state.rs#L133-L207

The typescript functions here are auto generated, I haven't sanity checked or tested them. It's possible it got them from my own tests but I don't know. Maybe just ignore these or I can delete them if they're too misleading.

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

For banks with drift rewards (BSOL):
The way drift works is that they admin deposit tokens to your account and this means we need to include all of this extra information for deposits and withdraws if there's a reward. This roughly means you'll have to detect if there's a reward deposit in a bank's drift account and if there is then add these extra fields as needed. If there's an easier way to track whether a drift market has rewards or needs these extra fields, we can figure that out maybe.

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

## Staging Environment Banks

**Program**: `5UDghkpgW1HfYSrmEj2iAApHShqU44H6PKTAar9LL9bY`
**Group**: `ERBiJdWtnVBBd4gFm7YVHT3a776x5NbGbJBR5BDvsxtj`

### USDC

- **Bank**: `73PAdXZSH7s89QBLUHntp12QaHWqdc6GChCYLSVF1RBJ`
- **Mint**: `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`
- **Market Index**: 0
- **Drift Spot Market**: `6gMq3mRCKf8aP3ttTyYhuijVZ2LGi14oDsBbkgubfLB3`
- **Drift Oracle**: `9VCioxmni2gDLv11qufWzT3RDERhQE4iY5Gf7NTfYyAV`
- **Marginfi Oracle**: `Dpw1EAVrSB1ibxiDQyTAW6Zip3J4Btk2x4SgApQCeFbX`
- **Token Program**: SPL Token

### SOL

- **Bank**: `H2FT24RksVSq6kxhfPZacyqbEaXUtRZNi1QvMGV9RrFX`
- **Mint**: `So11111111111111111111111111111111111111112`
- **Market Index**: 1
- **Drift Spot Market**: `3x85u7SWkmmr7YQGYhtjARgxwegTLJgkSLRprfXod6rh`
- **Drift Oracle**: `3m6i4RFWEDw2Ft4tFHPJtYgmpPe21k56M3FHeWYrgGBz`
- **Marginfi Oracle**: `4Hmd6PdjVA9auCoScE12iaBogfwS4ZXQ6VZoBeqanwWW`
- **Token Program**: SPL Token

### jitoSOL

- **Bank**: `7TduwJSpq2zhPguaciA3GADsnspwSx6FQjZUhy37Jtgz`
- **Mint**: `J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn`
- **Market Index**: 6
- **Drift Spot Market**: `6Aq7WBtsZVyumcRxpAoKNyWb97gAzp3be2LeQ9yE6SVX`
- **Drift Oracle**: `2cHCtAkMnttMh3bNKSCgSKSP5D4yN3p8bfnMdS3VZsDf`
- **Marginfi Oracle**: `5htZ4vPKPjAEg8EJv6JHcaCetMM4XehZo8znQvrp6Ur3`
- **Token Program**: SPL Token

### PYUSD (Token-2022)

- **Bank**: `8txe1gXz2yGGsy22NAtimJnCM4ivDQSQAf5kz2VZJsRR`
- **Mint**: `2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo`
- **Market Index**: 22
- **Drift Spot Market**: `GyyHYVCrZGc2AQPuvNbcP1babmU3L42ptmxZthUfD9q`
- **Drift Oracle**: `5QZMnsyndmphvZF4BNgoMHwVZaREXeE2rpBoCPMxgCCd`
- **Marginfi Oracle**: `9zXQxpYH3kYhtoybmZfUNNCRVuud7fY9jswTg1hLyT8k`
- **Token Program**: Token-2022

### USDS

- **Bank**: `5kW3rsj6XoB2VsE7RdGkmWMo4wQy5ZgLNcH3CFRHEq7J`
- **Mint**: `USDSwr9ApdHk5bvJKMjzff41FfuX8bSxdKcR81vTwcA`
- **Market Index**: 28
- **Drift Spot Market**: `hX9tXtcFomQ38TvtbpzdsNGwoGRBqkNg4J4hNDcET2t`
- **Drift Oracle**: `5Km85n3s9Zs5wEoXYWuHbpoDzst4EBkS5f1XuQJGG1DL`
- **Marginfi Oracle**: `DyYBBWEi9xZvgNAeMDCiFnmC1U9gqgVsJDXkL5WETpoX`
- **Token Program**: SPL Token

### bSOL

- **Bank**: `7iPsp3XiMFe3yJppCzSj7dLhkhnejm8id2ejBBoW4RgW`
- **Mint**: `bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1`
- **Market Index**: 8
- **Drift Spot Market**: `3fy2oMRJGceC3GAt9zGUBWt8MzjV5XxQDWKYLtiHPevX`
- **Drift Oracle**: `BmDWPMsytWmYkh9n6o7m79eVshVYf2B5GVaqQ2EWKnGH`
- **Marginfi Oracle**: `2wJdP1WM5dApaXf5DXVnPzcEqfqnwwEofjvJVvn6FNws`
- **Token Program**: SPL Token

### SOL (LST Market - Isolated Pool)

- **Bank**: `BWAm7qFe3uQ3mEzuJNU8umCjKBMvsMr3AiFKGowiD5B8`
- **Mint**: `So11111111111111111111111111111111111111112`
- **Market Index**: 49
- **Drift Spot Market**: `APWEwmh4PAvPH6p8KexWtaqBeUmByEvzWMEqzakSLFvF`
- **Drift Oracle**: `3PiwrLLyiuWaxS7zJL5znGR9iYD3KWubZThdQzsCdg2e`
- **Marginfi Oracle**: `4Hmd6PdjVA9auCoScE12iaBogfwS4ZXQ6VZoBeqanwWW`
- **Token Program**: SPL Token
- **Note**: SOL on Drift's LST Market isolated pool (SOL-2)
