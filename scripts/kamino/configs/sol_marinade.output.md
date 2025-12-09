# SOL Kamino Bank - marinade Market

Generated: 2025-12-08T20:08:31.098Z

## Existing Banks

| Seed | Bank Address | Reserve |
|------|--------------|---------|
| 300 | [9SerK63j...](https://solscan.io/account/9SerK63jzwLimSP8nnH5aGoZzK2pVXBWTWmUZSyivwaV) | d4A2prbA... |

## Seed Selection

- Selected Seed: **301**
- Bank Address: `4uawSqEM2jDPKkQRtnoSTmBjFJ51Ehu79EvGfu3R45o7`
- [View on Solscan](https://solscan.io/account/4uawSqEM2jDPKkQRtnoSTmBjFJ51Ehu79EvGfu3R45o7)

## On-Chain Data & Verification

**Reserve Verification:** PASSED

| Field | Value |
|-------|-------|
| Mint | `So11111111111111111111111111111111111111112` |
| Decimals | 9 |
| Token Program | Token Program |
| Kamino Reserve | `DQ126djx5db6SMCbejHLNxoosonVes3qW5eVVUQuT93v` |
| Kamino Market | `GVDUXFwS8uvBG35RjZv6Y8S1AkV5uASiMJ9qTUKqb5PL` |
| Scope Oracle | `3NJYftD5sjVfxSnUdZ1wVML8f3aC6mp1CXCL6L7TnU8C` |
| Farm State | `9C3ZmYzfkYLfUDyCoRR4sxYYUNSQJFEXK8FtJuomnQk9` |

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
| Jupiter Price | $134.122926 | - |
| Deviation | 0.19% | ✓ |
| Tolerance | 1% | - |

## Simulation Results

**Status:** SUCCESS
- Compute Units: 80917
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
2DyhKrFxChG2NQgohPQ8GxB2NmsbSpQbtrLNNTU9f6LSRYcxv7XocsMzTSFk8Ewr28Y4ncuZohGRwp85skNCnkEhnxv5joRP7ebEKG3kWby2K9ng1pVmJ9CYo52eBt8M5eKxk9E8NtddEMzxxm4oFxKHSpNX6tzdKC6hisSbVAN2G8v1MuZLXTu5SGHZx38h3y4mYXpj85EZjZzdf4XtF7RZTPty2ZLgo4EhCGhNfS3zbKHzDEKfS8eT8rD4gtT7Azg9ALQqrPSrCg3NUpRcnRuX7H9UdP66rGDfC6shZXEvtkkdTqQ64n7Q6vqMzyuQcMCZK7sJVuZcFbgmpQ7Y1YSfjnt4CsFA1xQsRadfQZHTXPw7TNc8hMceAUzmntv4PmhxoLrEVPtATobcRnBgf6S3Zu2iNfDYvnsiWp5x8XaxG27z5Ajc4ecbedYaSWYSn5QApUkJ11gdj1RHejRmWfEEWEqJVCQeyhvuq5HyduYS8yd4Hd8prp5Z2nYdSEp8ENg4tJYkCpvfVE1SZ1uorAUFHprCgPLePgWkSsj9TFsWR7kPMDVdfwmBvbgthHMDd652gydHZWRnwf4gMZomggv3apHnpNv8aupCkXn4AKFDfjFoHSzEYyYdXTTPvNhcjJxGmEnbEuDbvLireeCyCVdzob6AbbbPc4HA3QpPuEhgdr5eCpM9mifDamLy8ge1TZn6vQ4836dcMXWj49f8EVPJ7vHoNj6mp36M4BtHLGg1Qzz9Xo7sjUTEp2ZZiebocMsryLWEGwm4Fyi1tX9BLwHw5izuJhsPBFoqfU4Y5TYB31zx7wz3CxuSK9pzm6EtvWxkjLFPodZ7ksi6RBQacfkh9BCdwEAvE1RJ3Hx5bYeDM1q8BcmkqKbRJyBn8cHQhtQE8WyTaYCd24FAfMYQ3YqkhVpzKU6TG8NM1WAia3kS4Prnquibv3VePAtdnCdvaEXrxTH3rHtyGXRj84zn5ZXTgMK7L72ogXNTtMFgZSfZN4qnQETAuvQD1
```

## Derived Values

```json
{
  "bankAddress": "4uawSqEM2jDPKkQRtnoSTmBjFJ51Ehu79EvGfu3R45o7",
  "reserveOracle": "3NJYftD5sjVfxSnUdZ1wVML8f3aC6mp1CXCL6L7TnU8C",
  "farmState": "9C3ZmYzfkYLfUDyCoRR4sxYYUNSQJFEXK8FtJuomnQk9",
  "tokenProgram": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
  "decimals": 9,
  "seed": 301
}
```

## Next Steps

1. Submit base58 transaction to Squads multisig
2. Get approvals and execute
3. After confirmation, run init_obligation_from_config.ts
