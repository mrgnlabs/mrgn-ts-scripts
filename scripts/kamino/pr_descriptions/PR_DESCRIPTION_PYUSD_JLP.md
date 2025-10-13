# Add Kamino PYUSD Bank (JLP Market)

## Summary
Adds a new Kamino-integrated bank for **PYUSD** on the **JLP Market** to the marginfi lending group.

**Asset**: PYUSD
**Mint**: `2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo`
**Bank Seed**: 301 (Kamino secondary markets)
**Asset Tag**: 3 (ASSET_TAG_KAMINO)
**Market**: JLP Market

---

## 🔍 Configuration Parameters

### Mint Information (Fetched On-Chain)
| Parameter | Value | Verification |
|-----------|-------|--------------|
| **Token Program** | `TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb` | Token-2022 |
| **Mint Decimals** | 6 | Fetched from mint account |
| **Special Note** | Mint has a permanent delegate | Tokens may be seized at any time |

### Marginfi Bank Configuration
| Parameter | Value | Verification |
|-----------|-------|--------------|
| **Program ID** | `MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA` | Marginfi mainnet program |
| **Group** | `4qp6Fx6tnZkY5Wropq9wUYgtFxXKwE6viZxFHg3rdAG8` | Marginfi mainnet lending group |
| **Bank Mint** | `2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo` | [PYUSD mint](https://solscan.io/account/2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo) |
| **Seed** | 301 | Kamino secondary markets |

### Oracle Configuration
| Parameter | Value | Verification |
|-----------|-------|--------------|
| **Bank Oracle** | `9zXQxpYH3kYhtoybmZfUNNCRVuud7fY9jswTg1hLyT8k` | [Solscan](https://solscan.io/account/9zXQxpYH3kYhtoybmZfUNNCRVuud7fY9jswTg1hLyT8k) |
| **Oracle Type** | Pyth (kaminoPythPush) | Pyth price feed (same as Main Market PYUSD bank) |
| **Oracle Max Age** | 300 seconds | |
| **Oracle Max Confidence** | 0 (default 10%) | |

**Note**: Using `kaminoPythPush` since the existing PYUSD banks use Pyth. Kamino internally uses Scope oracle `3NJYftD5sjVfxSnUdZ1wVML8f3aC6mp1CXCL6L7TnU8C` for obligation operations.

### Risk Parameters
| Parameter | Value | Notes |
|-----------|-------|-------|
| **Asset Weight Init** | 0.90 (90%) | Same as Main Market PYUSD |
| **Asset Weight Maint** | 0.95 (95%) | Same as Main Market PYUSD |
| **Deposit Limit** | 5,000,000 PYUSD | Raw: `new BN(5_000_000 * 10 ** 6)` - 50% of Main Market (10M) |
| **Total Asset Value Init Limit** | $5,000,000 | Raw: `new BN(5_000_000)` - 50% of Main Market ($10M) |
| **Operational State** | Operational | |
| **Risk Tier** | Collateral | |
| **Config Flags** | 1 | |

### Kamino Integration
| Parameter | Value | Verification |
|-----------|-------|--------------|
| **Kamino Market** | `DxXdAyU3kCjnyggvHmY5nAwg5cRbbmdyX3npfDMjjMek` | JLP Market |
| **Kamino Reserve** | `FswUCVjvfAuzHCgPDF95eLKscGsLHyJmD6hzkhq26CLe` | [Solscan](https://solscan.io/account/FswUCVjvfAuzHCgPDF95eLKscGsLHyJmD6hzkhq26CLe) |
| **Farm Collateral** | `6HureeaY2WxT5GNTDvK9zFrHsEMAMJXQ5q4Mm9nYapcP` | Active farm rewards |
| **Reserve Scope Oracle** | `3NJYftD5sjVfxSnUdZ1wVML8f3aC6mp1CXCL6L7TnU8C` | Used for init_obligation |

**Note**: This is the second PYUSD Kamino bank. The first PYUSD bank (seed 300) is on the Main Market with 10M deposit limit. This JLP market bank has a reduced 5M deposit limit (50% of Main Market).

---

## 🔗 Verification Links

### On-Chain Verification
- **Existing PYUSD Bank (non-Kamino)**: [Solscan](https://solscan.io/account/8UEiPmgZHXXEDrqLS3oiTxQxTbeYTtPbeMBxAd2XGbpu#accountData)
- **Existing PYUSD Kamino Bank (Main Market, seed 300)**: [Solscan](https://solscan.io/account/9LfTcnXVa84mTwAxgHUkLBk1yg6vCWAMLSNY1oLBnnVx#accountData)
- **Kamino PYUSD Bank (JLP Market)**: *Will be created after transaction execution*
- **Kamino Reserve (JLP Market)**: [Solscan](https://solscan.io/account/FswUCVjvfAuzHCgPDF95eLKscGsLHyJmD6hzkhq26CLe#accountData)
- **PYUSD Mint**: [Solscan](https://solscan.io/account/2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo)
- **Bank Oracle (Pyth)**: [Solscan](https://solscan.io/account/9zXQxpYH3kYhtoybmZfUNNCRVuud7fY9jswTg1hLyT8k)
- **Kamino JLP Market**: [Kamino App](https://kamino.com/borrow/reserve/DxXdAyU3kCjnyggvHmY5nAwg5cRbbmdyX3npfDMjjMek/FswUCVjvfAuzHCgPDF95eLKscGsLHyJmD6hzkhq26CLe)

---

## 🚀 Transaction

### Step 1: Add Bank

**Derived Bank Address**: `GEDEmTGC5hSaJj13mcnGR8TRwUbhGU7JsdnPdYjzSREk`

**Base58 Transaction**:
```
3TXwb8T2kyg7hY4DanwQ9m3UJGqUAJxxo99vevVQLSvNoCQFhmmjZyBBVkEhHGXe78hv9Z4W1jSgvV6PBHpCuD3vW6XnT2pKsbWCCPSzGBSbuvoT2NvDN1Yzde1s9Wk3KafyfRCRVh3LejKJw87GEYhh5v2LtSQrFKeaKVYFoBeZ5wSz6XzC4gig6W1M57aiD4ZDyL8aBuBzo2w7sYwkTww5KipXeg2EXwTBY1SJwTLpfV7aRFSsQBBWbYB9v66MhHKZD83KJorKVwPyBK7cCBNv2iguEjgnKs9189zg8atLh6q1RMGUVp9nSPj2LqhMob1ZvgPMSG6YPjLLw5v2uWqMfVf7asMFj7ZpiqkfbKFzJdGhxyoeMTZ4xodGBrwkWF7SfNDcZaRg2udHwfk2Wen1d1mYgzD4EQCgJc9JzDDfy5C2Nf6i8jkodKCsrf9vKUk8xs1d8pwwJ1sd8tRenraHn3UjoSyo4SLar5NLWStJubN1aFXDV1v3r1dVtiJd9mVmjpzXkT7yu4um2YuZzySwuWfgey8vSAn8DwEfzmYsUXxrbqmY1hrp7PNiBJmvJ9Kqa2VbDUQ7FkvkUafj89CU3vtkyLgHFGmM5MnqCpER6gQ9YFAqj1hFBR5EZQW9kE5q6XN8NKjatt91D9YTgYAK7GzVdms3Gnms7j5HEdBkmHdknjbja8B84eZR2YLmNF3MotcAQJuAtpuwNVaKWdkeKAhWyyXSyRRa2MrHdP9BYgh8VXedPKkxhEpovPHKDVuta619AT2A5MJyX65fhXfsFaRTwjqV5N3Jx5EZcJAYSr4twT4TsDkvaoGtnV6oUHnAsGrBt3zLTd5YXPQPMJwgDeD64EXwYt9RN6DYSuNh1BmrKDRwQuqZjK2E1snQW2cAbX1nnjcoXdNe5EJfRDeaEcySAM8ZTc6AU6v2s6Tn2v8mVvNYk5NwUyiGA3QLexs6LFFGs8Ei5wvDTpN7SD5CpxDn2D8HaKhuWaRLksVYahaVgs
```

### Simulation Results

**Status**: ✅ Simulation successful

**Compute Units**: 91,375 / 200,000

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
  [16] Program TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb consumed 3396 of 161935 compute units
  [17] Program TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb success
  [18] Program 11111111111111111111111111111111 invoke [2]
  [19] Program 11111111111111111111111111111111 success
  [20] Program TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb invoke [2]
  [21] Program log: Instruction: InitializeAccount3
  [22] Program log: Warning: Mint has a permanent delegate, so tokens in this account may be seized at any time
  [23] Program TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb consumed 3396 of 147713 compute units
  [24] Program TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb success
  [25] Program log: Asset weight init: 0.8999999999999986 maint: 0.9499999999999993
  [26] Program log: Liab weight init: 1.5 maint: 1.25
  [27] Program log: deposit limit: 5000000000000 borrow limit: 0 init val limit: 5000000
  [28] Program log: op state: 1 risk tier: 0 asset tag: 3
  [29] Program log: oracle conf 0 age: 44 flags: 16
  [30] Program log: Insurance fixed: 0.0 ir: 0.10000000000000142
  [31] Program log: Group fixed: 0.010000000000001563 ir: 0.0 origination: 0.0
  [32] Program log: Plateau: 0.3999999999999986 Optimal: 0.3999999999999986 Max: 3.0
  [33] Program data: 7NzJP+9+iPkBq4O/zg5hoaIzYyukz7q/gSuAI8ryvn34CXK/yf8ydUA5FC9oL9g4hJbsvVEG8Vx5TCR3Qzgo+mZC2+v3IANKYeJBsPSMO+cRh2kEwe1BAVvjfDIlWQb1d2CHixl3B9T1F5JIO2yKKoe3Rx2BT5WR+TlchAqc49n01bp9OkuKdJ4=
  [34] Program MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA consumed 91375 of 200000 compute units
  [35] Program MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA success
```

**Key Parameters Verified**:
- ✅ Program ID: `MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA` (Mainnet)
- ✅ Instruction: `LendingPoolAddBankKamino`
- ✅ Token Program: `TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb` (Token-2022)
- ⚠️ Warning: Mint has a permanent delegate (tokens may be seized at any time)
- ✅ Asset Weight Init: 0.90 (90%)
- ✅ Asset Weight Maint: 0.95 (95%)
- ✅ Deposit Limit: 5,000,000 PYUSD (5000000000000 raw with 6 decimals)
- ✅ Asset Value Init Limit: $5,000,000 (5000000 raw)
- ✅ Asset Tag: 3 (ASSET_TAG_KAMINO)
- ✅ Risk Tier: 0 (Collateral)
- ✅ Operational State: 1 (Operational)

### Step 2: Initialize Obligation
After the bank is created via Squads, run:
```bash
npx tsx scripts/kamino/init_bank_obligation.ts
```

This creates the Kamino obligation and must be run locally with your wallet (not via Squads).

---

## 📝 Notes

- This is the **second PYUSD Kamino bank** (JLP Market). The first PYUSD Kamino bank (seed 300) is on the Main Market.
- **Deposit limit is 5M PYUSD** (50% of Main Market's 10M limit)
- **Risk parameters match the Main Market PYUSD bank**: 90%/95% collateral weights
- PYUSD uses **Token-2022** with a permanent delegate (tokens may be seized)
- Marginfi uses **Pyth oracle** for the bank, while Kamino internally uses **Scope oracle** for obligation operations
- Active farm rewards are available on this reserve
- Remember to run `init_bank_obligation.ts` after adding the bank!
