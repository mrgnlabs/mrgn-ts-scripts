# Add Kamino PYUSD Bank

## Summary

Adds a new Kamino-integrated bank for **PYUSD** to the marginfi lending group.

**Asset**: PYUSD
**Mint**: `2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo`
**Bank Seed**: 300 (Kamino banks)
**Asset Tag**: 3 (ASSET_TAG_KAMINO)

---

## 🔍 Configuration Parameters

### Mint Information (Fetched On-Chain)

| Parameter         | Value                                         | Verification              |
| ----------------- | --------------------------------------------- | ------------------------- |
| **Token Program** | `TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb` | Token-2022 Program        |
| **Mint Decimals** | 6                                             | Fetched from mint account |

### Marginfi Bank Configuration

| Parameter      | Value                                          | Verification                                                                          |
| -------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------- |
| **Program ID** | `MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA`  | Marginfi mainnet program                                                              |
| **Group**      | `4qp6Fx6tnZkY5Wropq9wUYgtFxXKwE6viZxFHg3rdAG8` | Marginfi mainnet lending group                                                        |
| **Bank Mint**  | `2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo` | [PYUSD mint](https://solscan.io/account/2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo) |
| **Seed**       | 300                                            | Kamino banks use seed 300                                                             |

### Oracle Configuration

| Parameter                 | Value                                          | Verification                                                                       |
| ------------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------- |
| **Bank Oracle**           | `9zXQxpYH3kYhtoybmZfUNNCRVuud7fY9jswTg1hLyT8k` | [Solscan](https://solscan.io/account/9zXQxpYH3kYhtoybmZfUNNCRVuud7fY9jswTg1hLyT8k) |
| **Oracle Type**           | Pyth (kaminoPythPush)                          | Pyth price feed                                                                    |
| **Oracle Max Age**        | 300 seconds                                    |                                                                                    |
| **Oracle Max Confidence** | 0 (default 10%)                                |                                                                                    |

### Risk Parameters

| Parameter                        | Value            | Notes                               |
| -------------------------------- | ---------------- | ----------------------------------- |
| **Asset Weight Init**            | 0.90 (90%)       | Initial collateral weight           |
| **Asset Weight Maint**           | 0.95 (95%)       | Maintenance collateral weight       |
| **Deposit Limit**                | 10,000,000 PYUSD | Raw: `new BN(10_000_000 * 10 ** 6)` |
| **Total Asset Value Init Limit** | $10,000,000      | Raw: `new BN(10_000_000)`           |
| **Operational State**            | Operational      |                                     |
| **Risk Tier**                    | Collateral       |                                     |
| **Config Flags**                 | 1                |                                     |

### Kamino Integration

| Parameter                  | Value                                          | Verification                                                                                                                                                                                                                          |
| -------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Kamino Market**          | `7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF` | Main market                                                                                                                                                                                                                           |
| **Kamino Reserve**         | `2gc9Dm1eB6UgVYFBUN9bWks6Kes9PbWSaPaa9DqyvEiN` | [Kamino](https://kamino.com/borrow/reserve/7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF/2gc9Dm1eB6UgVYFBUN9bWks6Kes9PbWSaPaa9DqyvEiN), [Solscan](https://solscan.io/account/2gc9Dm1eB6UgVYFBUN9bWks6Kes9PbWSaPaa9DqyvEiN#accountData) |
| **Reserve Oracle (Scope)** | `3NJYftD5sjVfxSnUdZ1wVML8f3aC6mp1CXCL6L7TnU8C` | Kamino's Scope oracle                                                                                                                                                                                                                 |
| **Farm Collateral**        | `DEe2NZ5dAXGxC7M8Gs9Esd9wZRPdQzG8jNamXqhL5yku` | ✅ Active farm                                                                                                                                                                                                                        |
| **Farm Debt**              | `GmJ2vXsDt8R5DNimAZc7Rtphr4oqecBVAx1psaTcVtrX` | ✅ Active farm                                                                                                                                                                                                                        |

**Note**: PYUSD is the only asset with BOTH active farm states (farmCollateral + farmDebt)!

---

## 🔗 Verification Links

### On-Chain Verification

- **Existing PYUSD Bank**: [Solscan](https://solscan.io/account/8UEiPmgZHXXEDrqLS3oiTxQxTbeYTtPbeMBxAd2XGbpu#accountData)
- **Kamino PYUSD Bank**: _Will be created after Step 1_
- **Kamino Reserve**: [Solscan](https://solscan.io/account/2gc9Dm1eB6UgVYFBUN9bWks6Kes9PbWSaPaa9DqyvEiN#accountData)
- **Kamino Reserve Page**: [Kamino](https://kamino.com/borrow/reserve/7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF/2gc9Dm1eB6UgVYFBUN9bWks6Kes9PbWSaPaa9DqyvEiN)
- **PYUSD Mint**: [Solscan](https://solscan.io/account/2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo)
- **Bank Oracle (Pyth)**: [Solscan](https://solscan.io/account/9zXQxpYH3kYhtoybmZfUNNCRVuud7fY9jswTg1hLyT8k)

---

## 🚀 Transaction

### Step 1: Add Bank

**Derived Bank Address**: `9LfTcnXVa84mTwAxgHUkLBk1yg6vCWAMLSNY1oLBnnVx`

**Base58 Transaction**:

```
3TXwb8T2kyg7hY4DanwQ9m3UJGqUAJxxo99vevVQLSvNoCQFhmmjZyBBVkEhHGXe78hv9Z4W1jSgvV6PBHpCuD3vW6XnT2pKsbWCCPSzGBSbuvoT2NvDN1Yzde1s9Wk3KafyfRCRVibyq5dNnwtFGcuPXXE9qjXvMFF3B4wwWFd7RSQXSr8EFvAazW8QJrYidbq2CriKPb9LssR3Kun58HbR2d6RzDwsNURT9kPvpDgpdMaDHyCf98WVfmGChWZnfH6xAH21TkZYeVH33pX6HQy2n1gJxm18D9Dd3xcQ3TQY3chrMkeJnSPZXks8Gqy5rdeEmuZu9vGYy2u7Qg2N9UjnTReL4wve6n6CCs8CyCthMHxwLpYu9Sn5GLxNub9UWV2mm12yhQFXSdXzuahDcQQ6W7RbevnM4rpJbnDAMYLBVHhexRMoxLyjQdE2hjnJu1P9s7yiheiM34aZYgkYjQUx27bvZbkx8Am1NHG48PwtwW6s3CcoRpz2LAf4MdM5HZivFdPkna3NyR9Rzj9dMN8A5ksR9jbtGeNVGFt7bj9w7cjXyYxsxNUuR19ccLrLGihEJnjhmefUvUPgKXGyxBT5EUTbQikqq7VE1HKAsJ52y274nMsaJ45nff1gn5x97JRwU585HU2iKrp1FaM3EKvaQbLrGDuzTSte3PPZnWnbP2Ndz78fjNVd4Nh4DDW6fCbkyBfL5jfgPrvEhwURE4tk8KekKGjgRASPTqfV6Ez2beSJhhSDNy7ppGYB8dSmJx7bgyL3oGncaGLkiH4pMDR8Y2TZToxthPwDUr1NKhgf72GifAjJqKtnkpUPn7Zkm6igdLQPjQB9fDKSKHpEAcnP893Rd8xwE26hjeaFHE49kXGEhrPWakpRoaYPSjMStLRmgoZDRXyF2ckwa89xyY46Wqgx7Bw5JtFJWhj2UECCypjwVryQdEQzY4jEgwm6QHbjRipfwUQZFxar4HjUjrKe5XsrxqekBRNAWi2jcMFGa5vRju
```

### Simulation Results

**Status**: ✅ Simulation successful

**Compute Units**: 103,345 / 200,000

**Full Simulation Logs**:

```
  [0] Program MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA invoke [1]
  [1] Program log: Instruction: LendingPoolAddBankKamino
  [2] Program 11111111111111111111111111111111 invoke [2]
  [3] Program 11111111111111111111111111111111 success
  [4] Program 11111111111111111111111111111111 invoke [2]
  [5] Program 11111111111111111111111111111111 success
  [6] Program TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb invoke [2]
  [7] Program log: Instruction: InitializeAccount3
  [8] Program log: Warning: Mint has a permanent delegate, so tokens in this account may be seized at any time
  [9] Program TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb consumed 3396 of 176157 compute units
  [10] Program TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb success
  [11] Program 11111111111111111111111111111111 invoke [2]
  [12] Program 11111111111111111111111111111111 success
  [13] Program TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb invoke [2]
  [14] Program log: Instruction: InitializeAccount3
  [15] Program log: Warning: Mint has a permanent delegate, so tokens in this account may be seized at any time
  [16] Program TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb consumed 3396 of 160435 compute units
  [17] Program TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb success
  [18] Program 11111111111111111111111111111111 invoke [2]
  [19] Program 11111111111111111111111111111111 success
  [20] Program TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb invoke [2]
  [21] Program log: Instruction: InitializeAccount3
  [22] Program log: Warning: Mint has a permanent delegate, so tokens in this account may be seized at any time
  [23] Program TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb consumed 3396 of 146213 compute units
  [24] Program TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb success
  [25] Program log: Asset weight init: 0.8999999999999986 maint: 0.9499999999999993
  [26] Program log: Liab weight init: 1.5 maint: 1.25
  [27] Program log: deposit limit: 10000000000000 borrow limit: 0 init val limit: 10000000
  [28] Program log: op state: 1 risk tier: 0 asset tag: 3
  [29] Program log: oracle conf 0 age: 44 flags: 16
  [30] Program log: Insurance fixed: 0.0 ir: 0.10000000000000142
  [31] Program log: Group fixed: 0.010000000000001563 ir: 0.0 origination: 0.0
  [32] Program log: Plateau: 0.3999999999999986 Optimal: 0.3999999999999986 Max: 3.0
  [33] Program data: 7NzJP+9+iPkBq4O/zg5hoaIzYyukz7q/gSuAI8ryvn34CXK/yf8ydUA5FC9oL9g4hJbsvVEG8Vx5TCR3Qzgo+mZC2+v3IANKYXvnBDPLxtCxiv5uoutcBGYOYIe6rIu3zumtzaQ04QjrF5JIO2yKKoe3Rx2BT5WR+TlchAqc49n01bp9OkuKdJ4=
  [34] Program MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA consumed 103345 of 200000 compute units
  [35] Program MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA success
```

**Key Parameters Verified**:

- ✅ Program ID: `MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA` (Mainnet)
- ✅ Instruction: `LendingPoolAddBankKamino`
- ✅ Token Program: `TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb` (Token-2022)
- ✅ Asset Weight Init: 0.90 (90%)
- ✅ Asset Weight Maint: 0.95 (95%)
- ✅ Deposit Limit: 10,000,000 PYUSD (10000000000000 raw)
- ✅ Asset Value Init Limit: $10,000,000 (10000000 raw)
- ✅ Asset Tag: 3 (ASSET_TAG_KAMINO)
- ✅ Risk Tier: 0 (Collateral)
- ✅ Operational State: 1 (Operational)
