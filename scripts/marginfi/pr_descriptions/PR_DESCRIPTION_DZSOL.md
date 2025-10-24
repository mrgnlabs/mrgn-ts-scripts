# Add Marginfi dzSOL Bank

## Summary
Adds a new **dzSOL** bank to the marginfi lending group.

**Asset**: dzSOL
**Mint**: `Gekfj7SL2fVpTDxJZmeC46cTYxinjB6gkAnb6EGT6mnn`
**Bank Seed**: 0
**Asset Tag**: 0
**Description**: DoubleZero Staked SOL - Liquid staking token

---

## 🔍 Configuration Parameters

### Mint Information
| Parameter | Value | Verification |
|-----------|-------|--------------|
| **Token Program** | `TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA` | SPL Token |
| **Mint Decimals** | 9 | Standard for dzSOL |

### Marginfi Bank Configuration
| Parameter | Value | Verification |
|-----------|-------|--------------|
| **Program ID** | `MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA` | Marginfi mainnet program |
| **Group** | `4qp6Fx6tnZkY5Wropq9wUYgtFxXKwE6viZxFHg3rdAG8` | Marginfi mainnet lending group |
| **Bank Mint** | `Gekfj7SL2fVpTDxJZmeC46cTYxinjB6gkAnb6EGT6mnn` | [Solscan](https://solscan.io/account/Gekfj7SL2fVpTDxJZmeC46cTYxinjB6gkAnb6EGT6mnn) |
| **Seed** | 0 | Primary bank |

### Oracle Configuration
| Parameter | Value | Verification |
|-----------|-------|--------------|
| **Oracle Address** | `8wRUjxh4uCdvQdqcWUMvBBTJa95vLuKrze7WLus5h6Gk` | [Solscan](https://solscan.io/account/8wRUjxh4uCdvQdqcWUMvBBTJa95vLuKrze7WLus5h6Gk) |
| **Oracle Type** | Switchboard Pull | Type 4 |
| **Oracle Max Age** | 70 seconds | Standard |
| **Oracle Max Confidence** | 0 | Default (10%) |

### Risk Parameters
| Parameter | Value | Notes |
|-----------|-------|-------|
| **Asset Weight Init** | 0.65 (65%) | Collateral value when opening positions |
| **Asset Weight Maint** | 0.8 (80%) | Collateral value for existing positions |
| **Liability Weight Init** | 1.3 (130%) | Borrow value when opening positions |
| **Liability Weight Maint** | 1.2 (120%) | Borrow value for existing positions |
| **Deposit Limit** | 25,000 dzSOL | Raw: `new BN(25000 * 10 ** 9)` |
| **Borrow Limit** | 5,000 dzSOL | Raw: `new BN(5000 * 10 ** 9)` |
| **Total Asset Value Init Limit** | $8,750,000 | Raw: `new BN(8750000)` |
| **Operational State** | operational | |
| **Risk Tier** | collateral | |

### Interest Rate Configuration
| Parameter | Value | Notes |
|-----------|-------|-------|
| **Optimal Utilization Rate** | 80% | Target utilization |
| **Plateau Interest Rate** | 10% APR | Rate at optimal utilization |
| **Max Interest Rate** | 125% APR | Rate at 100% utilization |
| **Insurance Fee Fixed APR** | 0% | |
| **Insurance IR Fee** | 0% | |
| **Protocol Fixed Fee APR** | 1% | |
| **Protocol IR Fee** | 13.5% | |
| **Protocol Origination Fee** | 0% | |

---

## 🔗 Verification Links

### On-Chain Verification
- **dzSOL Mint**: [Solscan](https://solscan.io/account/Gekfj7SL2fVpTDxJZmeC46cTYxinjB6gkAnb6EGT6mnn)
- **Oracle**: [Switchboard](https://ondemand.switchboard.xyz/solana/mainnet/feed/8wRUjxh4uCdvQdqcWUMvBBTJa95vLuKrze7WLus5h6Gk) | [Solscan](https://solscan.io/account/8wRUjxh4uCdvQdqcWUMvBBTJa95vLuKrze7WLus5h6Gk)
- **Marginfi Bank (after execution)**: [Solscan](https://solscan.io/account/E7LfHgmiWT6TxAcWq18yDBXWxHw4VasjD98aZaoXCp8T)

---

## 🚀 Transaction

**Derived Bank Address**: `E7LfHgmiWT6TxAcWq18yDBXWxHw4VasjD98aZaoXCp8T`

**Base58 Transaction**:
```
3vWS6MH7MTkqmGnkzhmuu19C2hMgJ81RuEfjXsXa72FXVvRfbN1xL17tjdmtPy16Y1UgtFvuJWFK6oxe1TkMV2Qs8MmnHNdPByXQQCwHyDwGbx6BDQe4QYEX9ziQUCW1oFAMGi2iy7GKZ75fraUjwQ6yGs2rUMrxJLyPsTdLPZTqbTzxqDCNCfGXd3Qp5X4mu29XsG4ogHRPqM7BQQTQ7GGMnJ5MaU1bJkon87jgAmXzT8ZdwT5ansarNjgEMfGk5iAXwMK9TXBwgzy6df9CpAQCvX79FBFBBck1x1PAnVaE3opexzHPrb3z7Ct1bxRsnwAZTRQii26q9SAui1mRcUjt5AWycmYXD5JVtRFd8jvdjgLobF7CrBrtJFwv526UDmiDBrNwU5ceyRJbXJv6pFfTCCQ9CSogQAaBdhhUqpJ9aZ9bfKcn95nFHazM5cXyv8paDhqobxQpuhbDCiTt5kj4PH9DQrrUrvbysQyASfgVg3xZws1YgMvYRbfyvFJbVSgz1NTRpTfxxcM6DcWNuxRhLPBN2X7x5eHF2gCv4MeNFAr7LRwRrx8TiSed78MJdHH4mowsRJzSebmc9chHUuD8A7H75n2jboUKd3L1tsFF9ceZ6WyCxoMcHs3AqWLgsoHVy6SwJaoKh8X3JChi9oRwduKCmzAnQUPfK4pNEzEFHSUMg9fcfFp3xV4YMGZCQc34qiEzpqYV8kitLPM5i3efZGcwY9han97NpqyRAKGrJ9R5HpXYtP6fwcC4Cg49isdkBvN65fXrB7c5YyiroEYcn6yv28JSg7L7YYUgK3Tp2pS1Ze9hS9Uknyc5FxpPjg5u24pL3FDzxtpe7v6ooS3YUjCfFBzn6uDBuSe14opG6uHom2qta8dMUimtRNWSPiM58SfeoRyu18szkxFk3sxBu4Jadgvks6iYgT273c6Dp37xFYKE8d96aCDp2NaCUoPKpNnu8JRK6xsruZdhXLHbXdg9LFEdnhPdtDKNe7qHPK2FkddVF9b35YNGdE1fwpypaCHdG2G5opqmyhs9oYzTwCvKrW4Qt5xiVzk2FoYWY7pqoNi7QzgEcbGRQ248DP7WrahV8YMJfeBiV7t8bVsXQGtCRFDjhRSQGcNKeMDWtpR7hYzqbuz4QztnZ6r755YFYgggWLJHfPujRs51XviuDifqkzPJxHTfzU4vH7kyvo46eHd71CUmFxc3PKVAvuG1J5A
```

### Simulation Results

**Status**: ✅ Simulation successful

**Compute Units**: 4,214 / 200,000

**Full Simulation Logs**:
```
bigint: Failed to load bindings, pure JS will be used (try npm run rebuild?)
═══════════════════════════════════════════════════════
  Adding Marginfi Bank: dzSOL
═══════════════════════════════════════════════════════

📄 Config: dzsol.config.ts
🏦 Asset: dzSOL (DoubleZero Staked SOL - Liquid staking token)
🪙  Mint: Gekfj7SL2fVpTDxJZmeC46cTYxinjB6gkAnb6EGT6mnn
🔮 Oracle: 8wRUjxh4uCdvQdqcWUMvBBTJa95vLuKrze7WLus5h6Gk (switchboard)
🌱 Seed: 0
📊 Decimals: 9

🔑 Using keypair: /root/keys/dummy-keypair.json
api: https://rpc.ironforge.network/mainnet?apiKey=01JSM3YXH7YWNSDTPDKVSR85QN
using MS as wallet: CYXEgwbPHu2f9cY3mcUkinzDoDcsSan7myh1uBvYRbEw
🏦 Derived Bank Address: E7LfHgmiWT6TxAcWq18yDBXWxHw4VasjD98aZaoXCp8T

🔧 Token Program: TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA (spl-token)

📋 Bank Configuration:
  Asset Weight Init: 0.65 (65%)
  Asset Weight Maint: 0.8 (80%)
  Liability Weight Init: 1.3 (130%)
  Liability Weight Maint: 1.2 (120%)
  Deposit Limit: 25,000 dzSOL
  Borrow Limit: 5,000 dzSOL
  Total Asset Value Init Limit: $8,750,000
  Risk Tier: collateral
  Operational State: operational
  Asset Tag: 0

💰 Interest Rate Configuration:
  Optimal Utilization Rate: 80%
  Plateau Interest Rate: 10% APR
  Max Interest Rate: 125% APR
  Protocol Fixed Fee APR: 1%
  Protocol IR Fee: 13.5%

🔨 Building transaction...

🔄 Simulating transaction...
✅ Simulation successful!

📊 Simulation Results:
  Compute Units: 118428 / 200,000

📝 Full Simulation Logs:
  [0] Program MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA invoke [1]
  [1] Program log: Instruction: LendingPoolAddBankWithSeed
  [2] Program 11111111111111111111111111111111 invoke [2]
  [3] Program 11111111111111111111111111111111 success
  [4] Program 11111111111111111111111111111111 invoke [2]
  [5] Program 11111111111111111111111111111111 success
  [6] Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]
  [7] Program log: Instruction: InitializeAccount3
  [8] Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4214 of 378283 compute units
  [9] Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success
  [10] Program 11111111111111111111111111111111 invoke [2]
  [11] Program 11111111111111111111111111111111 success
  [12] Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]
  [13] Program log: Instruction: InitializeAccount3
  [14] Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4214 of 357668 compute units
  [15] Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success
  [16] Program 11111111111111111111111111111111 invoke [2]
  [17] Program 11111111111111111111111111111111 success
  [18] Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]
  [19] Program log: Instruction: InitializeAccount3
  [20] Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4214 of 337053 compute units
  [21] Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success
  [22] Program log: Asset weight init: 0.6499999999999986 maint: 0.8000000000000007
  [23] Program log: Liab weight init: 1.3000000000000007 maint: 1.1999999999999993
  [24] Program log: deposit limit: 25000000000000 borrow limit: 5000000000000 init val limit: 8750000
  [25] Program log: op state: 1 risk tier: 0 asset tag: 0
  [26] Program log: oracle conf 0 age: 70 flags: 16
  [27] Program log: Insurance fixed: 0.0 ir: 0.0
  [28] Program log: Group fixed: 0.010000000000001563 ir: 0.13500000000000156 origination: 0.0
  [29] Program log: Plateau: 0.10000000000000142 Optimal: 0.8000000000000007 Max: 1.25
  [30] Program data: 7NzJP+9+iPkBq4O/zg5hoaIzYyukz7q/gSuAI8ryvn34CXK/yf8ydUA5FC9oL9g4hJbsvVEG8Vx5TCR3Qzgo+mZC2+v3IANKYcLHpQm6wWC7FiP90wiKCxSCRMqJj3jjtNyWpRx/fYrk6IsrRpwN3fqimJQK9kMOFr6jmIRU5Q5zhI73bXWXjRc=
  [31] Program MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA consumed 103982 of 400000 compute units
  [32] Program MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA success
  [33] Program MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA invoke [1]
  [34] Program log: Instruction: LendingPoolConfigureBankOracle
  [35] Program log: setting oracle to type: SwitchboardPull key: 8wRUjxh4uCdvQdqcWUMvBBTJa95vLuKrze7WLus5h6Gk
  [36] Program data: d4xu/ZZA0j4Bq4O/zg5hoaIzYyukz7q/gSuAI8ryvn34CXK/yf8ydUA5FC9oL9g4hJbsvVEG8Vx5TCR3Qzgo+mZC2+v3IANKYcLHpQm6wWC7FiP90wiKCxSCRMqJj3jjtNyWpRx/fYrkBHXy2ZCbdBzE9Ma1CxkdHAwF9ju9G2c9pwQuXN0p6XqF
  [37] Program MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA consumed 14446 of 296018 compute units
  [38] Program MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA success

═══════════════════════════════════════════════════════
  Transaction Ready for Squads Multisig
═══════════════════════════════════════════════════════

🏦 Bank Address:
E7LfHgmiWT6TxAcWq18yDBXWxHw4VasjD98aZaoXCp8T

📦 Base58-encoded Transaction:
3vWS6MH7MTkqmGnkzhmuu19C2hMgJ81RuEfjXsXa72FXVvRfbN1xL17tjdmtPy16Y1UgtFvuJWFK6oxe1TkMV2Qs8MmnHNdPByXQQCwHyDwGbx6BDQe4QYEX9ziQUCW1oFAMGi2iy7GKZ75fraUjwQ6yGs2rUMrxJLyPsTdLPZTqbTzxqDCNCfGXd3Qp5X4mu29XsG4ogHRPqM7BQQTQ7GGMnJ5MaU1bJkon87jgAmXzT8ZdwT5ansarNjgEMfGk5iAXwMK9TXBwgzy6df9CpAQCvX79FBFBBck1x1PAnVaE3opexzHPrb3z7Ct1bxRsnwAZTRQii26q9SAui1mRcUjt5AWycmYXD5JVtRFd8jvdjgLobF7CrBrtJFwv526UDmiDBrNwU5ceyRJbXJv6pFfTCCQ9CSogQAaBdhhUqpJ9aZ9bfKcn95nFHazM5cXyv8paDhqobxQpuhbDCiTt5kj4PH9DQrrUrvbysQyASfgVg3xZws1YgMvYRbfyvFJbVSgz1NTRpTfxxcM6DcWNuxRhLPBN2X7x5eHF2gCv4MeNFAr7LRwRrx8TiSed78MJdHH4mowsRJzSebmc9chHUuD8A7H75n2jboUKd3L1tsFF9ceZ6WyCxoMcHs3AqWLgsoHVy6SwJaoKh8X3JChi9oRwduKCmzAnQUPfK4pNEzEFHSUMg9fcfFp3xV4YMGZCQc34qiEzpqYV8kitLPM5i3efZGcwY9han97NpqyRAKGrJ9R5HpXYtP6fwcC4Cg49isdkBvN65fXrB7c5YyiroEYcn6yv28JSg7L7YYUgK3Tp2pS1Ze9hS9Uknyc5FxpPjg5u24pL3FDzxtpe7v6ooS3YUjCfFBzn6uDBuSe14opG6uHom2qta8dMUimtRNWSPiM58SfeoRyu18szkxFk3sxBu4Jadgvks6iYgT273c6Dp37xFYKE8d96aCDp2NaCUoPKpNnu8JRK6xsruZdhXLHbXdg9LFEdnhPdtDKNe7qHPK2FkddVF9b35YNGdE1fwpypaCHdG2G5opqmyhs9oYzTwCvKrW4Qt5xiVzk2FoYWY7pqoNi7QzgEcbGRQ248DP7WrahV8YMJfeBiV7t8bVsXQGtCRFDjhRSQGcNKeMDWtpR7hYzqbuz4QztnZ6r755YFYgggWLJHfPujRs51XviuDifqkzPJxHTfzU4vH7kyvo46eHd71CUmFxc3PKVAvuG1J5A

✅ Done! Copy the base58 transaction above to submit via Squads.

```

**Key Parameters Verified**:
- ✅ Program ID: `MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA` (Mainnet)
- ✅ Token Program: SPL Token
- ✅ Asset Weight Init: 0.65 (65%)
- ✅ Asset Weight Maint: 0.8 (80%)
- ✅ Liability Weight Init: 1.3 (130%)
- ✅ Liability Weight Maint: 1.2 (120%)
- ✅ Deposit Limit: 25,000 dzSOL
- ✅ Borrow Limit: 5,000 dzSOL
- ✅ Total Asset Value Init Limit: $8,750,000
- ✅ Risk Tier: collateral
- ✅ Operational State: operational


---

## 📝 Notes

- This adds a new **dzSOL** bank with seed 0
- Oracle type: Switchboard Pull (type 4)
- Risk parameters are conservative for a liquid staking token
- Remember to submit the transaction via Squads multisig
