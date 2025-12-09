# SOL Kamino Bank - jito Market

Generated: 2025-12-08T20:08:50.013Z

## Existing Banks

| Seed | Bank Address | Reserve |
|------|--------------|---------|
| 300 | [9SerK63j...](https://solscan.io/account/9SerK63jzwLimSP8nnH5aGoZzK2pVXBWTWmUZSyivwaV) | d4A2prbA... |

## Seed Selection

- Selected Seed: **302**
- Bank Address: `J5mxC3hLXqmsJB4Nauf9YrtbNMSTHGz7FWfAmy1v6Fzr`
- [View on Solscan](https://solscan.io/account/J5mxC3hLXqmsJB4Nauf9YrtbNMSTHGz7FWfAmy1v6Fzr)

## On-Chain Data & Verification

**Reserve Verification:** PASSED

| Field | Value |
|-------|-------|
| Mint | `So11111111111111111111111111111111111111112` |
| Decimals | 9 |
| Token Program | Token Program |
| Kamino Reserve | `6gTJfuPHEg6uRAijRkMqNc9kan4sVZejKMxmvx2grT1p` |
| Kamino Market | `H6rHXmXoCQvq8Ue81MqNh7ow5ysPa1dSozwW3PU1dDH6` |
| Scope Oracle | `3NJYftD5sjVfxSnUdZ1wVML8f3aC6mp1CXCL6L7TnU8C` |
| Farm State | `BgMEUzcjkJxEH1PdPkZyv3NbUynwbkPiNJ7X2x7G1JmH` |

## Bank Configuration

| Parameter | Value |
|-----------|-------|
| Asset Weight Init | 0.75 |
| Asset Weight Maint | 0.85 |
| Deposit Limit | 150000000000000 (150,000 SOL (9 decimals)) |
| Total Asset Value Init Limit | 20000000 ($20M USD) |
| Oracle | `4Hmd6PdjVA9auCoScE12iaBogfwS4ZXQ6VZoBeqanwWW` |
| Oracle Type | kaminoSwitchboardPull |

## Oracle Validation

**Overall Status:** PASSED

### Switchboard Feed

| Field | Value | Status |
|-------|-------|--------|
| Feed Address | `4Hmd6PdjVA9auCoScE12iaBogfwS4ZXQ6VZoBeqanwWW` | - |
| Feed Name | SOL/USD | - |
| Authority | `69fYfCVsBvV5CJQeiALyZZ5Auuh1GtqY8f8NnhMt39na` | ✓ |
| Expected Authority | `69fYfCVsBvV5CJQeiALyZZ5Auuh1GtqY8f8NnhMt39na` | - |
| UI Link | [View on Switchboard](https://ondemand.switchboard.xyz/solana/mainnet/feed/4Hmd6PdjVA9auCoScE12iaBogfwS4ZXQ6VZoBeqanwWW) | - |

### Ticker Validation

| Field | Value | Status |
|-------|-------|--------|
| Expected | SOL/USD | - |
| Actual | SOL/USD | ✓ |

### Price Comparison

| Field | Value | Status |
|-------|-------|--------|
| Oracle Price | $133.870097 | - |
| Jupiter Price | $134.059846 | - |
| Deviation | 0.14% | ✓ |
| Tolerance | 1% | - |

## Simulation Results

**Status:** SUCCESS
- Compute Units: 82417
- Instruction Found: YES
- Program Succeeded: YES
- All Parameters Match: YES

**Parameter Validation:**

| Parameter | Expected | Actual | Status |
|-----------|----------|--------|--------|
| assetWeightInit | 0.75 | 0.7500 | ✓ |
| assetWeightMaint | 0.85 | 0.8500 | ✓ |
| depositLimit | 150000000000000 | 150000000000000 | ✓ |
| totalAssetValueInitLimit | 20000000 | 20000000 | ✓ |
| operationalState | 1 (operational) | 1 | ✓ |
| riskTier | 0 (collateral) | 0 | ✓ |
| assetTag | 3 (kamino) | 3 | ✓ |
| oracleMaxConfidence | 0 | 0 | ✓ |
| oracleMaxAge | 70 (logs as 70) | 70 | ✓ |

## Base58 Transaction

**Size:** 745 bytes (max 1232)

```
2DyhKrFxChG2NQgohPQ8GxB2NmsbSpQbtrLNNTU9f6LSRYcxv7XocsMzTSFk8Ewr28Y4ncuZohGRwp85skNCnkEhnxv5joRP7ebEKG3kWby2K9ng1pVmJ9CYo52eBt8M5eKxk9E8NtddEMzxxm4oFxKHSpNX6tzdKC6hisSbVAN2G8v1MuZLXTyEkz4LDNqnFNubNzwJR9yy3QjRgMQNtrzrYtju3Q9QTZ3emwfZycfpfb8ubp3MJkwecEJXLsHwPsKvWnmNCD81qq6b39nXbaekSfVzrLpzJAH86Lo6vDjnCPFA32q1R7yZs2APLwWntgai8XYegfqPfxWfE4mJMZFb56BFZFVDpUeKdNd4QMcttc4Jss8zcVPrH9pgWwr7x1UBcjBJfYvnY9WmjowBAkdtqmKcsCkKyWuDSj3HHbJ8J3ZwrYWahf1AATVhr4A4jGC7Xct5C1K8uZJFUWMAsXG8fezREJ3NvWFQKbFzt2mxQVQXSsnaTqMfzCwh5BtWPFWeFuG1bCK43yUz1jC4qJ4vkZM3T1r3JeFGA2jpBBWhXFsSBrMgdCsGovLwnxHQ8izGSFeykcPBaSdQqKK8mJKpb9yBfx5Gp9uUFDBor8NKPv6Q2PLyifjFPeEZ5d4oP3GMRx7W5eUVomFVn4LJWzX9WzZeMEAcHqFWiruT1bGjn6j1QRQ64tXtsxrxZhWXRDy7i4giahcozxAbstevGM4BZyGW42c1ueAj21rhELsmMVXwv6V2tFBzZsth3yN5m7esFQ57agexZpJgfq5hKa6GgEZQjdE1Qe3ZbouZbLhoxZ5Qib9Ct4u1YygWJEd6zAXS6yGSnSLMb2oLW4g4ihAT85EK5viVN9qn1ZAnUb3PWvWYKDTmp4w9oKvpv1Su2jDuNcYwg3pXYEsDT4LnDLQuwa193gVNQmB859cTDpDyFQmtNyCJKBodg2zsLTubLPNe3mU35KHVQqo6h2itZzbBhXRT8FUQqJ6vgwLMtjGLadgZXWDRtecWf
```

## Derived Values

```json
{
  "bankAddress": "J5mxC3hLXqmsJB4Nauf9YrtbNMSTHGz7FWfAmy1v6Fzr",
  "reserveOracle": "3NJYftD5sjVfxSnUdZ1wVML8f3aC6mp1CXCL6L7TnU8C",
  "farmState": "BgMEUzcjkJxEH1PdPkZyv3NbUynwbkPiNJ7X2x7G1JmH",
  "tokenProgram": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
  "decimals": 9,
  "seed": 302
}
```

## Next Steps

1. Submit base58 transaction to Squads multisig
2. Get approvals and execute
3. After confirmation, run init_obligation_from_config.ts
