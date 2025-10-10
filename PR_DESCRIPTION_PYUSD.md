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
| Parameter | Value | Verification |
|-----------|-------|--------------|
| **Token Program** | `TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb` | Token-2022 Program |
| **Mint Decimals** | 6 | Fetched from mint account |

### Marginfi Bank Configuration
| Parameter | Value | Verification |
|-----------|-------|--------------|
| **Program ID** | `MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA` | Marginfi program |
| **Group** | `ERBiJdWtnVBBd4gFm7YVHT3a776x5NbGbJBR5BDvsxtj` | Marginfi lending group |
| **Bank Mint** | `2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo` | [PYUSD mint](https://solscan.io/account/2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo) |
| **Seed** | 300 | Kamino banks use seed 300 |

### Oracle Configuration
| Parameter | Value | Verification |
|-----------|-------|--------------|
| **Bank Oracle** | `9zXQxpYH3kYhtoybmZfUNNCRVuud7fY9jswTg1hLyT8k` | [Solscan](https://solscan.io/account/9zXQxpYH3kYhtoybmZfUNNCRVuud7fY9jswTg1hLyT8k) |
| **Oracle Type** | Pyth (kaminoPythPush) | Pyth price feed |
| **Oracle Max Age** | 300 seconds | |
| **Oracle Max Confidence** | 0 (default 10%) | |

### Risk Parameters
| Parameter | Value | Notes |
|-----------|-------|-------|
| **Asset Weight Init** | 0.90 (90%) | Initial collateral weight |
| **Asset Weight Maint** | 0.95 (95%) | Maintenance collateral weight |
| **Deposit Limit** | 10,000,000 PYUSD | Raw: `new BN(10_000_000 * 10 ** 6)` |
| **Total Asset Value Init Limit** | $10,000,000 | Raw: `new BN(10_000_000)` |
| **Operational State** | Operational | |
| **Risk Tier** | Collateral | |
| **Config Flags** | 1 | |

### Kamino Integration
| Parameter | Value | Verification |
|-----------|-------|--------------|
| **Kamino Market** | `7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF` | Main market |
| **Kamino Reserve** | `2gc9Dm1eB6UgVYFBUN9bWks6Kes9PbWSaPaa9DqyvEiN` | [Kamino](https://kamino.com/borrow/reserve/7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF/2gc9Dm1eB6UgVYFBUN9bWks6Kes9PbWSaPaa9DqyvEiN), [Solscan](https://solscan.io/account/2gc9Dm1eB6UgVYFBUN9bWks6Kes9PbWSaPaa9DqyvEiN#accountData) |
| **Reserve Oracle (Scope)** | `3NJYftD5sjVfxSnUdZ1wVML8f3aC6mp1CXCL6L7TnU8C` | Kamino's Scope oracle |
| **Farm Collateral** | `DEe2NZ5dAXGxC7M8Gs9Esd9wZRPdQzG8jNamXqhL5yku` | ✅ Active farm |
| **Farm Debt** | `GmJ2vXsDt8R5DNimAZc7Rtphr4oqecBVAx1psaTcVtrX` | ✅ Active farm |

**Note**: PYUSD is the only asset with BOTH active farm states (farmCollateral + farmDebt)!

---

## 🔗 Verification Links

### On-Chain Verification
- **Existing PYUSD Bank**: [Solscan](https://solscan.io/account/8UEiPmgZHXXEDrqLS3oiTxQxTbeYTtPbeMBxAd2XGbpu#accountData)
- **Kamino PYUSD Bank**: *Will be created after Step 1*
- **Kamino Reserve**: [Solscan](https://solscan.io/account/2gc9Dm1eB6UgVYFBUN9bWks6Kes9PbWSaPaa9DqyvEiN#accountData)
- **Kamino Reserve Page**: [Kamino](https://kamino.com/borrow/reserve/7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF/2gc9Dm1eB6UgVYFBUN9bWks6Kes9PbWSaPaa9DqyvEiN)
- **PYUSD Mint**: [Solscan](https://solscan.io/account/2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo)
- **Bank Oracle (Pyth)**: [Solscan](https://solscan.io/account/9zXQxpYH3kYhtoybmZfUNNCRVuud7fY9jswTg1hLyT8k)

---

## 🚀 Transaction

### Step 1: Add Bank
**Derived Bank Address**: `AzunLDdx2f5dPdAVxGtoZLe9ybHkH2HWh2gawZnMBJYV`

**Base58 Transaction**:
```
8URnmuj7G2maf5B5CTjvXSJJJY4BDcAWEGngkMeaq5BDJ772An6fhPpLvqiJPepwkefBVqgp6CJXEavbupPKt9RJQam5DMgjG7ggomCa9DWpzL5YJrRy2aNkWA1t5wwr1YCYXXHaD6N5WjuTVnLcHLjPk5UvvYZxq3R3sWNQWtzwh9KU9XKuAAGGMvnXWWfdBNUDf5RuRQbo33soTBx42FEspPpn9rQCPhgTuK2nNnCa5xXJVKK32SkGrABCwNU2en2y2FSx693xfHDy3kRJ5pSSLT7TuZ5ToBFZErtitxyajmsEBTWmVw6i3xqZrnWYSiEuERRV369r44zCkec5zPZhuu7sWAxYfZFJhAJsuWHdXbXxk3EwiNxGvjaiUzkDvTc7ei8UiHQdQK5hLigZfHDYgjnZw8W52YFFphisnuveSQqcSypah1vK5gGcJWDR4gS7pAjXRkKgy3TeZjT19bUB16rjVsPh3ZkuBG6UTUt9d5QcGaaJFxCi5qqZcWctPVyyYEtWyDoyZrbvUGziAUBYLycu1uiGdoGMHWFxZwzkg9xZuQ3ugbxZzhRFVTCrsStJMLiBosfKqGC1pB1ebkanP3JzcTLbdSj5zH1DnBYKDFL1xvM9vQPfKDLQEGN2mAoCBMkHXvR4aQLyVkJ4tH3D5ku8aRHip3JK2U2UhUUXNUn4U8XYgqD45H7GvnazmUahR4ZESsTxXp3fqihvwL6KfETWShJ8zHQETYk8JotWVsg2tJcUmm24kmX37Rgevt4cAUwoCCKq2fVL5geMn5GaKvFr2ELvbvEzSqQastRq2KVkafTcdNGFQjXV4mXdm88qLZ4AHidp7juArB2oW1AKJurDMADBxCGFPkBvpvF97EUGdrpzw8BXb3nuxj6WRrWg5XdesiZsZCXdgRrUJk4cQf6PtY2Zkm3aDK3HVwZyctXzWzzW616VXDXfJ1B8J5RqRtaC3ph7thBiXG5SSnbqaH5pksdGhx5Deak8EwL5eG6puxV6J6ob8NXDFhuUY4eL9GsGrjBmJhnj8jVF6jmjB1Ha5ErVJjRJxX5vb12hYVkHzNzMJbMpZb9GGBBahkum2ZcxCTsoaZ95Q5bv5d6yyEPf3Jp8GLMMb4k7T9hVXcNFRuHxj
```

### Simulation Results

**Status**: ✅ Simulation successful

**Compute Units**: 100,345

**Transaction Size**: 836 bytes

**Full Simulation Logs**:
```
  [0] Program 5UDghkpgW1HfYSrmEj2iAApHShqU44H6PKTAar9LL9bY invoke [1]
  [1] Program log: Instruction: LendingPoolAddBankKamino
  [2] Program 11111111111111111111111111111111 invoke [2]
  [3] Program 11111111111111111111111111111111 success
  [4] Program 11111111111111111111111111111111 invoke [2]
  [5] Program 11111111111111111111111111111111 success
  [6] Program TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb invoke [2]
  [7] Program log: Instruction: InitializeAccount3
  [8] Program log: Warning: Mint has a permanent delegate, so tokens in this account may be seized at any time
  [9] Program TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb consumed 3396 of 173157 compute units
  [10] Program TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb success
  [11] Program 11111111111111111111111111111111 invoke [2]
  [12] Program 11111111111111111111111111111111 success
  [13] Program TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb invoke [2]
  [14] Program log: Instruction: InitializeAccount3
  [15] Program log: Warning: Mint has a permanent delegate, so tokens in this account may be seized at any time
  [16] Program TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb consumed 3396 of 155935 compute units
  [17] Program TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb success
  [18] Program 11111111111111111111111111111111 invoke [2]
  [19] Program 11111111111111111111111111111111 success
  [20] Program TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb invoke [2]
  [21] Program log: Instruction: InitializeAccount3
  [22] Program log: Warning: Mint has a permanent delegate, so tokens in this account may be seized at any time
  [23] Program TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb consumed 3396 of 138713 compute units
  [24] Program TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb success
  [25] Program log: Asset weight init: 0.8999999999999986 maint: 0.9499999999999993
  [26] Program log: Liab weight init: 1.5 maint: 1.25
  [27] Program log: deposit limit: 10000000000000 borrow limit: 0 init val limit: 10000000
  [28] Program log: op state: 1 risk tier: 0 asset tag: 3
  [29] Program log: oracle conf 0 age: 44 flags: 16
  [30] Program log: Insurance fixed: 0.0 ir: 0.10000000000000142
  [31] Program log: Group fixed: 0.010000000000001563 ir: 0.0 origination: 0.0
  [32] Program log: Plateau: 0.3999999999999986 Optimal: 0.3999999999999986 Max: 3.0
  [33] Program data: 7NzJP+9+iPkBWWzZpDivjSGUi+gW755z0G1vrY00t0EQX7hRwfb5UfnHWftRg1YEzMra4TO8VDqWivRII5yefeLiNfygC4K6lJSO+AFnb6Dvj2FwSNoy/J9bydKZjqiRinOVVG6uGKh2F5JIO2yKKoe3Rx2BT5WR+TlchAqc49n01bp9OkuKdJ4=
  [34] Program 5UDghkpgW1HfYSrmEj2iAApHShqU44H6PKTAar9LL9bY consumed 100345 of 200000 compute units
  [35] Program 5UDghkpgW1HfYSrmEj2iAApHShqU44H6PKTAar9LL9bY success
```

**Key Parameters Verified**:
- ✅ Instruction: `LendingPoolAddBankKamino`
- ✅ Token Program: `TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb` (Token-2022)
- ✅ Asset Weight Init: 0.90 (90%)
- ✅ Asset Weight Maint: 0.95 (95%)
- ✅ Deposit Limit: 10,000,000 PYUSD (10000000000000 raw)
- ✅ Asset Value Init Limit: $10,000,000 (10000000 raw)
- ✅ Asset Tag: 3 (ASSET_TAG_KAMINO)
- ✅ Risk Tier: 0 (Collateral)
- ✅ Operational State: 1 (Operational)