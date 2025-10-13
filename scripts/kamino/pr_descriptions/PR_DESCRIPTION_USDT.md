# Add Kamino USDT Bank

## Summary
Adds a new Kamino-integrated bank for **USDT** to the marginfi lending group.

**Asset**: USDT
**Mint**: `Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB`
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
| **Bank Mint** | `Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB` | [USDT mint](https://solscan.io/account/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB) |
| **Seed** | 300 | Kamino banks use seed 300 |

### Oracle Configuration
| Parameter | Value | Verification |
|-----------|-------|--------------|
| **Bank Oracle** | `HT2PLQBcG5EiCcNSaMHAjSgd9F98ecpATbk4Sk5oYuM` | [Solscan](https://solscan.io/account/HT2PLQBcG5EiCcNSaMHAjSgd9F98ecpATbk4Sk5oYuM) |
| **Oracle Type** | Pyth (kaminoPythPush) | Pyth price feed |
| **Oracle Max Age** | 300 seconds | |
| **Oracle Max Confidence** | 0 (default 10%) | |

### Risk Parameters
| Parameter | Value | Notes |
|-----------|-------|-------|
| **Asset Weight Init** | 1.00 (100%) | Full collateral weight for stablecoin |
| **Asset Weight Maint** | 1.00 (100%) | Full collateral weight for stablecoin |
| **Deposit Limit** | 50,000,000 USDT | Raw: `new BN(50_000_000 * 10 ** 6)` - 50% of non-Kamino bank |
| **Total Asset Value Init Limit** | $50,000,000 | Raw: `new BN(50_000_000)` - 50% of non-Kamino bank |
| **Operational State** | Operational | |
| **Risk Tier** | Collateral | |
| **Config Flags** | 1 | |

### Kamino Integration
| Parameter | Value | Verification |
|-----------|-------|--------------|
| **Kamino Market** | `7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF` | Main market |
| **Kamino Reserve** | `H3t6qZ1JkguCNTi9uzVKqQ7dvt2cum4XiXWom6Gn5e5S` | [Solscan](https://solscan.io/account/H3t6qZ1JkguCNTi9uzVKqQ7dvt2cum4XiXWom6Gn5e5S) |
| **Farm Collateral** | ❌ No active farm | USDT does not have farm rewards |

**Note**: USDT is a major stablecoin with 100% collateral weights and 50M deposit limit (50% of the existing non-Kamino USDT bank limit of 100M).

---

## 🔗 Verification Links

### On-Chain Verification
- **Existing USDT Bank (non-Kamino)**: [Solscan](https://solscan.io/account/HmpMfL8942u22htC4EMiWgLX931g3sacXFR6KjuLgKLV#accountData)
- **Kamino USDT Bank**: *Will be created after transaction execution*
- **Kamino Reserve**: [Solscan](https://solscan.io/account/H3t6qZ1JkguCNTi9uzVKqQ7dvt2cum4XiXWom6Gn5e5S#accountData)
- **USDT Mint**: [Solscan](https://solscan.io/account/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB)
- **Bank Oracle (Pyth)**: [Solscan](https://solscan.io/account/HT2PLQBcG5EiCcNSaMHAjSgd9F98ecpATbk4Sk5oYuM)

---

## 🚀 Transaction

### Step 1: Add Bank

**Derived Bank Address**: `FLnBNuXqJYUNa8EwC1APQ4qV128f8iHQQ6vnr1PaD1ax`

**Base58 Transaction**:
```
3TXwb8T2kyg7hY4DanwQ9m3UJGqUAJxxo99vevVQLSvNoCQFhmmjZyBBVkEhHGXe78hv9Z4W1jSgvV6PBHpCuD3vW6XnT2pKsbWCCPSzGBSbuvoT2NvDN1Yzde1s9Wk3KafyfRCRVijowKkhizRGhH1Xnt3SsY5MfotgvCea5Jy53H8HrRCsvaqfSXvdRYBDHEGywGg1ug4EUKvu8WRYKQKXyzaMANmbiF1foSvPyWmTQcprn8JLYNFNEKYShntBC7MKZcFjbPsQQNB3s3qBboF4v7NoP8Jp7GwDusMfpuA83beV8hPgwS8PYXrVZjZWJEJukvRuftN8FiNL71PDeMUczWLraEuNSGgLBpTkWU1HaoMWgmGyJFdPbNpb5geto7y7Ayb926sWeJ9fTJvASyX6fdasdnTmK27bxpDyuXMsi75CHWDtVyE3ecNAGwwKh4uAbsq86oGAbiCqRF5125KyhX9eF8jrhoQBuYfM2cMadM1FVYohUiVk1mXyiusmroJxvMGMnb5mG62fCPWSAWJZDBL76UPmVEKLDjXrVimpTJCCjnqVsjzwMPmP16TKH6PQaoyrsv1JtrycPWpt6e2VT4Zp8VNiWDVhQtrHKxfyVgeSJSghbmDyo4nEPCpYXs4Mhkk8mfTq4VCgs2WAzUoSEjRpNcnPs4qt9L2koL6piYc923Yc4kJxfgHGGfrc6yC5XM4RDjaKs2opTygc7SUdvA2tzjFV712hdzeskY9iBSVXtKVgBrC7jWQa2stGF2M2sJMepxzAizbDfz37BMJzuD2QmSBvSmnNPTdpx7WRmeSYgnKkDePj8Yuj4aAWRDxoB2YikJQELHZuwfmFqLpJ4eQJJh7kDPjqXtYLVjQR5wHkqPtTBQ9CDArLUCNga5xBX23MtrFgogvvbnXTVqdq8jcUk6mWPfsHhyWoq3LtquUDcpDjfpFdJn31eEq2zpeoP4oa5wRNdpoMzFaDqaCTBXYgaFBco2NmLtGK5zjGmuTcRM
```

### Simulation Results

**Status**: ✅ Simulation successful

**Compute Units**: 88,499 / 200,000

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
  [8] Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4241 of 176874 compute units
  [9] Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success
  [10] Program 11111111111111111111111111111111 invoke [2]
  [11] Program 11111111111111111111111111111111 success
  [12] Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]
  [13] Program log: Instruction: InitializeAccount3
  [14] Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4241 of 163731 compute units
  [15] Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success
  [16] Program 11111111111111111111111111111111 invoke [2]
  [17] Program 11111111111111111111111111111111 success
  [18] Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]
  [19] Program log: Instruction: InitializeAccount3
  [20] Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4241 of 150588 compute units
  [21] Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success
  [22] Program log: Asset weight init: 1.0 maint: 1.0
  [23] Program log: Liab weight init: 1.5 maint: 1.25
  [24] Program log: deposit limit: 50000000000000 borrow limit: 0 init val limit: 50000000
  [25] Program log: op state: 1 risk tier: 0 asset tag: 3
  [26] Program log: oracle conf 0 age: 44 flags: 16
  [27] Program log: Insurance fixed: 0.0 ir: 0.10000000000000142
  [28] Program log: Group fixed: 0.010000000000001563 ir: 0.0 origination: 0.0
  [29] Program log: Plateau: 0.3999999999999986 Optimal: 0.3999999999999986 Max: 3.0
  [30] Program data: 7NzJP+9+iPkBq4O/zg5hoaIzYyukz7q/gSuAI8ryvn34CXK/yf8ydUA5FC9oL9g4hJbsvVEG8Vx5TCR3Qzgo+mZC2+v3IANKYdUUvH8qZD87fRJ5V9AxGynViL0xbo7W5qEhK4sg3dnhzgEOYK/tsicXvWMZL1QUWj+WWjO7gtLHAp6yzh4ggmQ=
  [31] Program MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA consumed 88499 of 200000 compute units
  [32] Program MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA success
```

**Key Parameters Verified**:
- ✅ Program ID: `MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA` (Mainnet)
- ✅ Instruction: `LendingPoolAddBankKamino`
- ✅ Token Program: `TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA` (Token Program)
- ✅ Asset Weight Init: 1.0 (100%)
- ✅ Asset Weight Maint: 1.0 (100%)
- ✅ Deposit Limit: 50,000,000 USDT (50000000000000 raw)
- ✅ Asset Value Init Limit: $50,000,000 (50000000 raw)
- ✅ Asset Tag: 3 (ASSET_TAG_KAMINO)
- ✅ Risk Tier: 0 (Collateral)
- ✅ Operational State: 1 (Operational)
