# Add Kamino USDC Bank

## Summary
Adds a new Kamino-integrated bank for **USDC** to the marginfi lending group.

**Asset**: USDC
**Mint**: `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`
**Bank Seed**: 300 (Kamino banks)
**Asset Tag**: 3 (ASSET_TAG_KAMINO)

---

## 🔍 Configuration Parameters

### Mint Information (Fetched On-Chain)
| Parameter | Value | Verification |
|-----------|-------|--------------|
| **Token Program** | `TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA` | Token Program |
| **Mint Decimals** | 6 | Fetched from mint account |

### Marginfi Bank Configuration
| Parameter | Value | Verification |
|-----------|-------|--------------|
| **Program ID** | `MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA` | Marginfi mainnet program |
| **Group** | `4qp6Fx6tnZkY5Wropq9wUYgtFxXKwE6viZxFHg3rdAG8` | Marginfi mainnet lending group |
| **Bank Mint** | `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v` | [USDC mint](https://solscan.io/account/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v) |
| **Seed** | 300 | Kamino banks use seed 300 |

### Oracle Configuration
| Parameter | Value | Verification |
|-----------|-------|--------------|
| **Bank Oracle** | `Dpw1EAVrSB1ibxiDQyTAW6Zip3J4Btk2x4SgApQCeFbX` | [Solscan](https://solscan.io/account/Dpw1EAVrSB1ibxiDQyTAW6Zip3J4Btk2x4SgApQCeFbX) |
| **Oracle Type** | Pyth (kaminoPythPush) | Pyth price feed |
| **Oracle Max Age** | 300 seconds | |
| **Oracle Max Confidence** | 0 (default 10%) | |

### Risk Parameters
| Parameter | Value | Notes |
|-----------|-------|-------|
| **Asset Weight Init** | 1.00 (100%) | Full collateral weight for stablecoin |
| **Asset Weight Maint** | 1.00 (100%) | Full collateral weight for stablecoin |
| **Deposit Limit** | 100,000,000 USDC | Raw: `new BN(100_000_000 * 10 ** 6)` - 50% of non-Kamino bank |
| **Total Asset Value Init Limit** | $100,000,000 | Raw: `new BN(100_000_000)` - 50% of non-Kamino bank |
| **Operational State** | Operational | |
| **Risk Tier** | Collateral | |
| **Config Flags** | 1 | |

### Kamino Integration
| Parameter | Value | Verification |
|-----------|-------|--------------|
| **Kamino Market** | `7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF` | Main market |
| **Kamino Reserve** | `D6q6wuQSrifJKZYpR1M8R4YawnLDtDsMmWM1NbBmgJ59` | [Solscan](https://solscan.io/account/D6q6wuQSrifJKZYpR1M8R4YawnLDtDsMmWM1NbBmgJ59) |
| **Farm Collateral** | ❌ No active farm | USDC does not have farm rewards |

**Note**: USDC is a major stablecoin with 100% collateral weights and 100M deposit limit (50% of the existing non-Kamino USDC bank limit of 200M).

---

## 🔗 Verification Links

### On-Chain Verification
- **Existing USDC Bank (non-Kamino)**: [Solscan](https://solscan.io/account/2s37akK2eyBbp8DZgCm7RtsaEz8eJP3Nxd4urLHQv7yB#accountData)
- **Kamino USDC Bank**: *Will be created after transaction execution*
- **Kamino Reserve**: [Solscan](https://solscan.io/account/D6q6wuQSrifJKZYpR1M8R4YawnLDtDsMmWM1NbBmgJ59#accountData)
- **USDC Mint**: [Solscan](https://solscan.io/account/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v)
- **Bank Oracle (Pyth)**: [Solscan](https://solscan.io/account/Dpw1EAVrSB1ibxiDQyTAW6Zip3J4Btk2x4SgApQCeFbX)

---

## 🚀 Transaction

### Step 1: Add Bank

**Derived Bank Address**: `27Cpv49jQ3hav8zF3qZjp7T78ATdUTZN4m9x389Z8uH4`

**Base58 Transaction**:
```
3TXwb8T2kyg7hY4DanwQ9m3UJGqUAJxxo99vevVQLSvNoCQFhmmjZyBBVkEhHGXe78hv9Z4W1jSgvV6PBHpCuD3vW6XnT2pKsbWCCPSzGBSbuvoT2NvDN1Yzde1s9Wk3KafyfRCRVgTvvafEXqnHWohVYg4jB7w7HMGUGLpFQ9fEBSQEb2pS7fTpJ2yWqBjreRFnXZjSBGBmhjT5cSzMY3Z6RBbw7U9dkEhzhiXuTLuzJdt7eqMRbraGCgF2A8yA4YRB18jHHkj7dcZjRGZmMpiPgL5y5GSvwch3wsgPmbRLBzzrdXunuCUVA4rVaWVHjEr23S8kyAoh6WBfv332i1rA8qCLtnpc3XDEgMsAWdDYyABy768DAJ9ZHqFoPig4hJzdJqU29KWRR2zdqf4wDYXhnL5pNQuxWHu5BKyx2hqSRRPmysDSPvZRV5zZELmQ4e4LQzYpk4UhBQXv3WWYiSPWSeA8NHqgXtoXECJY4HUoV49qA5Rz7FMjSDhPh6UuYG1oASXao7Si4dLyFV2EDFk7dRLyUQqnYG8rPeRia3Y9jKUU3decaK1u1PmM54wFiAUCqiNpuAT9oojqo1muja6Mnwnj8YAbJfh7QYSzsEpRsziYFGQSYbtcTEJFYr3VHWyDFtxALyDc5Y3gzoNw3TzELBVh7ZM56V6EXoNvj45JeEwGPP32oJgMPGmJdpbxzzkfddMFXxusWzwMLsPg2c3Nzy59AaC5fucCaWxuK38D8TDvYpg273kywRie7kkmN8Ex8LwFby8ESUjhBYeX1MqfRwDaRuFpew4GUVWznMGVbGVRmZeaXhAF6iDYyheu3tBSgiw8M4zopGU9ZtpKm9urUNEQgSGwNA7vzdCeexh648Bo56mBGn2iKRhqfckxNyiZ7F583kYxvyZ7uLUpRBPV9Kic7V1mXt9WPBX8GNtdXBBJHAW839djRQoTBPVMkfwkQQPcoJVJsiVxDiGqiYHJcisxk9aBhDw4Yfr8j484aDPH43
```

### Simulation Results

**Status**: ✅ Simulation successful

**Compute Units**: 87,035 / 200,000

**Full Simulation Logs**:
```
  [0] Program MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA invoke [1]
  [1] Program log: Instruction: LendingPoolAddBankKamino
  [2] Program 11111111111111111111111111111111 invoke [2]
  [3] Program 11111111111111111111111111111111 success
  [4] Program 11111111111111111111111111111111 invoke [2]
  [5] Program 11111111111111111111111111111111 success
  [6] Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]
  [7] Program log: Instruction: InitializeAccount3
  [8] Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4241 of 181374 compute units
  [9] Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success
  [10] Program 11111111111111111111111111111111 invoke [2]
  [11] Program 11111111111111111111111111111111 success
  [12] Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]
  [13] Program log: Instruction: InitializeAccount3
  [14] Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4241 of 168231 compute units
  [15] Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success
  [16] Program 11111111111111111111111111111111 invoke [2]
  [17] Program 11111111111111111111111111111111 success
  [18] Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]
  [19] Program log: Instruction: InitializeAccount3
  [20] Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4241 of 153588 compute units
  [21] Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success
  [22] Program log: Asset weight init: 1.0 maint: 1.0
  [23] Program log: Liab weight init: 1.5 maint: 1.25
  [24] Program log: deposit limit: 100000000000000 borrow limit: 0 init val limit: 100000000
  [25] Program log: op state: 1 risk tier: 0 asset tag: 3
  [26] Program log: oracle conf 0 age: 44 flags: 16
  [27] Program log: Insurance fixed: 0.0 ir: 0.10000000000000142
  [28] Program log: Group fixed: 0.010000000000001563 ir: 0.0 origination: 0.0
  [29] Program log: Plateau: 0.3999999999999986 Optimal: 0.3999999999999986 Max: 3.0
  [30] Program data: 7NzJP+9+iPkBq4O/zg5hoaIzYyukz7q/gSuAI8ryvn34CXK/yf8ydUA5FC9oL9g4hJbsvVEG8Vx5TCR3Qzgo+mZC2+v3IANKYRByiyo1zYUqBuEzvKR4wec0ECinHR6wqFsS9MSQO5TLxvp6877brTo9ZfNqq8l0MbG75MLS9uDkfKYCA0UvXWE=
  [31] Program MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA consumed 87035 of 200000 compute units
  [32] Program MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA success
```

**Key Parameters Verified**:
- ✅ Program ID: `MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA` (Mainnet)
- ✅ Instruction: `LendingPoolAddBankKamino`
- ✅ Token Program: `TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA` (Token Program)
- ✅ Asset Weight Init: 1.0 (100%)
- ✅ Asset Weight Maint: 1.0 (100%)
- ✅ Deposit Limit: 100,000,000 USDC (100000000000000 raw)
- ✅ Asset Value Init Limit: $100,000,000 (100000000 raw)
- ✅ Asset Tag: 3 (ASSET_TAG_KAMINO)
- ✅ Risk Tier: 0 (Collateral)
- ✅ Operational State: 1 (Operational)
- ✅ Config Flags: 1
