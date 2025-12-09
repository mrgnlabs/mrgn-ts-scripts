# USDS Kamino Bank - maple Market

Generated: 2025-12-08T20:02:23.070Z

## Existing Banks

No existing Kamino banks found for USDS

## Seed Selection

- Selected Seed: **300**
- Bank Address: `FLwQ2tV4gPHKWY1jwdB3Hp8Z18nU4WngvNgJn3qZVGd7`
- [View on Solscan](https://solscan.io/account/FLwQ2tV4gPHKWY1jwdB3Hp8Z18nU4WngvNgJn3qZVGd7)

## On-Chain Data & Verification

**Reserve Verification:** PASSED

| Field | Value |
|-------|-------|
| Mint | `USDSwr9ApdHk5bvJKMjzff41FfuX8bSxdKcR81vTwcA` |
| Decimals | 6 |
| Token Program | Token Program |
| Kamino Reserve | `BiSRKTadXSiyTSpiqw9nJge33N32AXewUPY7skFJwMvA` |
| Kamino Market | `6WEGfej9B9wjxRs6t4BYpb9iCXd8CpTpJ8fVSNzHCC5y` |
| Scope Oracle | `3t4JZcueEzTbVP6kLxXrL3VpWx45jDer4eqysweBchNH` |
| Farm State | `35aAYJ31KUuX86ggq1VEbW9fGcWW6phAYbYrFKL4eenB` |

## Bank Configuration

| Parameter | Value |
|-----------|-------|
| Asset Weight Init | 0.85 |
| Asset Weight Maint | 0.9 |
| Deposit Limit | 500000000000 (500,000 USDS (6 decimals)) |
| Total Asset Value Init Limit | 500000 ($500K USD) |
| Oracle | `EtEbRr1fiigYs51PVaX6Ldupda4aMxz9qQE2iTBwLpZD` |
| Oracle Type | kaminoSwitchboardPull |

## Simulation Results

**Status:** SUCCESS
- Compute Units: 93666
- Instruction Found: YES
- Program Succeeded: YES
- All Parameters Match: YES

**Parameter Validation:**

| Parameter | Expected | Actual | Status |
|-----------|----------|--------|--------|
| assetWeightInit | 0.85 | 0.8500 | ✓ |
| assetWeightMaint | 0.9 | 0.9000 | ✓ |
| depositLimit | 500000000000 | 500000000000 | ✓ |
| totalAssetValueInitLimit | 500000 | 500000 | ✓ |
| operationalState | 1 (operational) | 1 | ✓ |
| riskTier | 0 (collateral) | 0 | ✓ |
| assetTag | 3 (kamino) | 3 | ✓ |
| oracleMaxConfidence | 0 | 0 | ✓ |
| oracleMaxAge | 300 (logs as 44) | 44 | ✓ |

## Base58 Transaction

**Size:** 745 bytes (max 1232)

```
2DyhKrFxChG2NQgohPQ8GxB2NmsbSpQbtrLNNTU9f6LSRYcxv7XocsMzTSFk8Ewr28Y4ncuZohGRwp85skNCnkEhnxv5joRP7ebEKG3kWby2K9ng1pVmJ9CYo52eBt8M5eKxk9E8NtddEMzxxm4oFxKHSpNX6tzdKC6hisSbVAN2G8v1MuZLXTxNbm6kbu63pSQXgoZ3aCMKoqjQJivS2YJbPCRFFpP9ytZkM3xanND4Fv6RgNrptDyx9eY89jnMLbNJ67QhU98iMcAQXsUAzHuPR6X7fcpa69vLe8CKdLSURnuuBvrQiKvLKteNcYmsrbcAugPWWDUXht1XPKxXy36jPA55qJjxAGwXDy5bXTcDQ8Xaq1svbhsuY76G3sBKuR799ZLwXWBauE5e1G4cjhKJ18aR4ZnJadZDYpwBpCkMmi9zW5bdsenmaZvxhMWWm4cr5YX97CEEQUKv1G8DrceKHYrrJ2YxryvDTCXA92Qf5tG9YibrX58eahCJo7nrj5hUTHUcWfu2X2EL42h1HtmAvg8BAVjaNS4LqtQZkUzGtdABzDxaPbmW6pWbEnX3BCApStnmx51XuWukvffgKauaougxv8KJPaKWZ1mXYam7sVcXZBHPgRJjgUXodgSSA8tNWv7k93qQfNZMcvwmDXVSK3vai4Fm79xDMdYowL9DGBcTGMumGmgpXvzj7M1ntJ8kuMyCryGxNecckncGe1dEVE4M7ECzgdbRAcR8KJhVJkUgavdPBPSpKGxAyYrKgX14CFdAo7n3ZyczFwDTbR3QUdQRKDvxzq2cnQdSMqfDP2r14gkwmq4Ec6TsXzvZPWgjTJXgHS3Rtcmifu19qNM9a8aPPNSXiyXrB3QnmfbSTcZJBdAVMDp5qrNgWPRDbiZEk167e7mwWVVs2aTXVTBoNh3kJKTLUZw31reg1KSKCqFXH5YeoWPdShBFxhdoR9cCGnmGJhxxavndak6KRUdrcjhcTToftWGuTZTadSTyKtsi9ADX7y9xf
```

## Derived Values

```json
{
  "bankAddress": "FLwQ2tV4gPHKWY1jwdB3Hp8Z18nU4WngvNgJn3qZVGd7",
  "reserveOracle": "3t4JZcueEzTbVP6kLxXrL3VpWx45jDer4eqysweBchNH",
  "farmState": "35aAYJ31KUuX86ggq1VEbW9fGcWW6phAYbYrFKL4eenB",
  "tokenProgram": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
  "decimals": 6,
  "seed": 300
}
```

## Next Steps

1. Submit base58 transaction to Squads multisig
2. Get approvals and execute
3. After confirmation, run init_obligation_from_config.ts
