# Add Kamino SOL Bank

## Summary
Adds a new Kamino-integrated bank for **SOL** (native Solana) to the marginfi lending group.

**Asset**: SOL
**Mint**: `So11111111111111111111111111111111111111112`
**Bank Seed**: 300 (Kamino banks)
**Asset Tag**: 3 (ASSET_TAG_KAMINO)

---

## 🔍 Configuration Parameters

### Mint Information (Fetched On-Chain)
| Parameter | Value | Verification |
|-----------|-------|--------------|
| **Token Program** | `TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA` | Token Program |
| **Mint Decimals** | 9 | Fetched from mint account |

### Marginfi Bank Configuration
| Parameter | Value | Verification |
|-----------|-------|--------------|
| **Program ID** | `MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA` | Marginfi mainnet program |
| **Group** | `4qp6Fx6tnZkY5Wropq9wUYgtFxXKwE6viZxFHg3rdAG8` | Marginfi mainnet lending group |
| **Bank Mint** | `So11111111111111111111111111111111111111112` | [SOL mint](https://solscan.io/account/So11111111111111111111111111111111111111112) |
| **Seed** | 300 | Kamino banks use seed 300 |

### Oracle Configuration
| Parameter | Value | Verification |
|-----------|-------|--------------|
| **Bank Oracle** | `4Hmd6PdjVA9auCoScE12iaBogfwS4ZXQ6VZoBeqanwWW` | [Solscan](https://solscan.io/account/4Hmd6PdjVA9auCoScE12iaBogfwS4ZXQ6VZoBeqanwWW) |
| **Oracle Type** | Switchboard (kaminoSwitchboardPull) | Switchboard price feed (same as existing SOL bank) |
| **Oracle Max Age** | 300 seconds | |
| **Oracle Max Confidence** | 0 (default 10%) | |

**Note**: Using `kaminoSwitchboardPull` since the existing SOL bank uses Switchboard. Kamino banks support both Pyth (`kaminoPythPush`) and Switchboard (`kaminoSwitchboardPull`) oracles.

### Risk Parameters
| Parameter | Value | Notes |
|-----------|-------|-------|
| **Asset Weight Init** | 0.80 (80%) | Same as existing SOL bank |
| **Asset Weight Maint** | 0.90 (90%) | Same as existing SOL bank |
| **Deposit Limit** | 800,000 SOL | Raw: `new BN(800_000 * 10 ** 9)` - 40% of existing 2M SOL bank |
| **Total Asset Value Init Limit** | $160,000,000 | Raw: `new BN(160_000_000)` - 800K SOL × $200 |
| **Operational State** | Operational | |
| **Risk Tier** | Collateral | |
| **Config Flags** | 1 | |

### Kamino Integration
| Parameter | Value | Verification |
|-----------|-------|--------------|
| **Kamino Market** | `7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF` | Main market |
| **Kamino Reserve** | `d4A2prbA2whesmvHaL88BH6Ewn5N4bTSU2Ze8P6Bc4Q` | [Solscan](https://solscan.io/account/d4A2prbA2whesmvHaL88BH6Ewn5N4bTSU2Ze8P6Bc4Q) |
| **Farm Collateral** | TBD | Check if SOL has active farm rewards |

**Note**: SOL is the native Solana token with 80%/90% collateral weights and 800K deposit limit (40% of the existing non-Kamino SOL bank limit of 2M).

---

## 🔗 Verification Links

### On-Chain Verification
- **Existing SOL Bank (non-Kamino)**: [Solscan](https://solscan.io/account/CCKtUs6Cgwo4aaQUmBPmyoApH2gUDErxNZCAntD6LYGh#accountData)
- **Kamino SOL Bank**: *Will be created after transaction execution*
- **Kamino Reserve**: [Solscan](https://solscan.io/account/d4A2prbA2whesmvHaL88BH6Ewn5N4bTSU2Ze8P6Bc4Q#accountData)
- **SOL Mint**: [Solscan](https://solscan.io/account/So11111111111111111111111111111111111111112)
- **Bank Oracle (Switchboard)**: [Solscan](https://solscan.io/account/4Hmd6PdjVA9auCoScE12iaBogfwS4ZXQ6VZoBeqanwWW)

---

## 🚀 Transaction

### Step 1: Add Bank

**Derived Bank Address**: `9SerK63jzwLimSP8nnH5aGoZzK2pVXBWTWmUZSyivwaV`

**Base58 Transaction**:
```
3TXwb8T2kyg7hY4DanwQ9m3UJGqUAJxxo99vevVQLSvNoCQFhmmjZyBBVkEhHGXe78hv9Z4W1jSgvV6PBHpCuD3vW6XnT2pKsbWCCPSzGBSbuvoT2NvDN1Yzde1s9Wk3KafyfRCRVijowKkhizRGhH1Xnt3SsY5MfotgvCea5Jy53H8HrRCsvZbZYyrv82wcvYtcNnrB7V96mqGScmBmMi85Qi3whZf8nyU3GRNj7catWKH8VqetHvA8fh7nnKPhm3xSQHuoogYFh2Y3ZyguTYyMMUjMGTBR1ucRL7JVBmmEEmBJDATWEjLzhbyX98nEL6EdpMHdZbKvrRmaiyPEWQgNAoxjtBFaQWwjhWzGpqzfivxApKDHDarLHHBAovpfgKhYUUDCmvxgKrucddcUqjHNexfc5aLVUci53NdNk1zgWq7tSzo6PLkKDcSWoL4QpH8WgwXA6ZrjrnzeXtMCffisvmKWpz1Vzb9ZrD9RU9F6E4EoHyYT6zLVyj87cyyZUg8LNLCpdxbTbCwwRJvbZS5wWheJnDoHmRqjTaYntpNa2qaX2oYePsivKif1AJa5SC85ytYtLxecLVUxtSPpXuzUxdjNMMaXZGnyqZEvW9MPjPbCz69KnFL7EvCaoQ5PjhcvPBhku1KNso9hCZcDGC5oT7zjVKPv7zKeE9S9ymGN5Wzxj2dazrwFyAT7uMP2XKFQ4hZeEtkeVBmab4wNXWuJMg8f9SfGqpvT49SSLRvXQdmCRUBxM6FewvGAigSF1SZ6h1FXRYscuN5yN2amN1keipAMK6GgohjT4cbKaNW6JZCKnT5Zt4CD5muEkyMDX9ViFdSkaqodYZ2YLHjdCHELsEnvFJLGg7eJY3DmWib7SyBFx1VAMSKrPHhZC8irtJZMRctLXjU9sGiFJekEAcnrKtnqViUfkhcmDDnbcSPt6FScRCF3znF3yyeB998LD5TrSopP1ardJhzR5GHusMfphrSaxMNv3nYt6Xd1tRyjMaWSgF
```

### Simulation Results

**Status**: ✅ Simulation successful

**Compute Units**: 87,445 / 200,000

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
  [8] Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 3158 of 175385 compute units
  [9] Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success
  [10] Program 11111111111111111111111111111111 invoke [2]
  [11] Program 11111111111111111111111111111111 success
  [12] Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]
  [13] Program log: Instruction: InitializeAccount3
  [14] Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 3158 of 163326 compute units
  [15] Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success
  [16] Program 11111111111111111111111111111111 invoke [2]
  [17] Program 11111111111111111111111111111111 success
  [18] Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]
  [19] Program log: Instruction: InitializeAccount3
  [20] Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 3158 of 149767 compute units
  [21] Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success
  [22] Program log: Asset weight init: 0.8000000000000007 maint: 0.8999999999999986
  [23] Program log: Liab weight init: 1.5 maint: 1.25
  [24] Program log: deposit limit: 800000000000000 borrow limit: 0 init val limit: 160000000
  [25] Program log: op state: 1 risk tier: 0 asset tag: 3
  [26] Program log: oracle conf 0 age: 44 flags: 16
  [27] Program log: Insurance fixed: 0.0 ir: 0.10000000000000142
  [28] Program log: Group fixed: 0.010000000000001563 ir: 0.0 origination: 0.0
  [29] Program log: Plateau: 0.3999999999999986 Optimal: 0.3999999999999986 Max: 3.0
  [30] Program data: 7NzJP+9+iPkBq4O/zg5hoaIzYyukz7q/gSuAI8ryvn34CXK/yf8ydUA5FC9oL9g4hJbsvVEG8Vx5TCR3Qzgo+mZC2+v3IANKYX1v0CDFidW8EA9HZ8i3dIgMLUOJvvmZq2L7UqDfoj1GBpuIV/6rgYT7aH9jRhjANdrEOdwa6ztVmKDwAAAAAAE=
  [31] Program MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA consumed 87445 of 200000 compute units
  [32] Program MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA success
```

**Key Parameters Verified**:
- ✅ Program ID: `MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA` (Mainnet)
- ✅ Instruction: `LendingPoolAddBankKamino`
- ✅ Token Program: `TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA` (Token Program)
- ✅ Asset Weight Init: 0.80 (80%)
- ✅ Asset Weight Maint: 0.90 (90%)
- ✅ Deposit Limit: 800,000 SOL (800000000000000 raw with 9 decimals)
- ✅ Asset Value Init Limit: $160,000,000 (160000000 raw)
- ✅ Asset Tag: 3 (ASSET_TAG_KAMINO)
- ✅ Risk Tier: 0 (Collateral)
- ✅ Operational State: 1 (Operational)
