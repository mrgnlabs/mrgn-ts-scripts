# Add Marginfi 2Z Bank

## Summary
Adds a new **2Z** bank to the marginfi lending group.

**Asset**: 2Z
**Mint**: `J6pQQ3FAcJQeWPPGppWRb4nM8jU3wLyYbRrLh7feMfvd`
**Bank Seed**: 0
**Asset Tag**: 0
**Description**: DoubleZero - Volatile ecosystem token

---

## 🔍 Configuration Parameters

### Mint Information
| Parameter | Value | Verification |
|-----------|-------|--------------|
| **Token Program** | `TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA` | SPL Token |
| **Mint Decimals** | 8 | Standard for 2Z |

### Marginfi Bank Configuration
| Parameter | Value | Verification |
|-----------|-------|--------------|
| **Program ID** | `MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA` | Marginfi mainnet program |
| **Group** | `4qp6Fx6tnZkY5Wropq9wUYgtFxXKwE6viZxFHg3rdAG8` | Marginfi mainnet lending group |
| **Bank Mint** | `J6pQQ3FAcJQeWPPGppWRb4nM8jU3wLyYbRrLh7feMfvd` | [Solscan](https://solscan.io/account/J6pQQ3FAcJQeWPPGppWRb4nM8jU3wLyYbRrLh7feMfvd) |
| **Seed** | 0 | Primary bank |

### Oracle Configuration
| Parameter | Value | Verification |
|-----------|-------|--------------|
| **Oracle Address** | `Ho9iLZ15SreUnzRpbMHLTzQfCQugmsNnUQ3rLB5V75Ng` | [Solscan](https://solscan.io/account/Ho9iLZ15SreUnzRpbMHLTzQfCQugmsNnUQ3rLB5V75Ng) |
| **Oracle Type** | Switchboard Pull | Type 4 |
| **Oracle Max Age** | 70 seconds | Standard |
| **Oracle Max Confidence** | 0 | Default (10%) |

### Risk Parameters
| Parameter | Value | Notes |
|-----------|-------|-------|
| **Asset Weight Init** | 0.4 (40%) | Collateral value when opening positions |
| **Asset Weight Maint** | 0.5 (50%) | Collateral value for existing positions |
| **Liability Weight Init** | 1.6 (160%) | Borrow value when opening positions |
| **Liability Weight Maint** | 1.42 (142%) | Borrow value for existing positions |
| **Deposit Limit** | 12,500,000 2Z | Raw: `new BN(12500000 * 10 ** 8)` |
| **Borrow Limit** | 1,250,000 2Z | Raw: `new BN(1250000 * 10 ** 8)` |
| **Total Asset Value Init Limit** | $2,500,000 | Raw: `new BN(2500000)` |
| **Operational State** | operational | |
| **Risk Tier** | collateral | |

### Interest Rate Configuration
| Parameter | Value | Notes |
|-----------|-------|-------|
| **Optimal Utilization Rate** | 50% | Target utilization |
| **Plateau Interest Rate** | 10% APR | Rate at optimal utilization |
| **Max Interest Rate** | 300% APR | Rate at 100% utilization |
| **Insurance Fee Fixed APR** | 0% | |
| **Insurance IR Fee** | 0% | |
| **Protocol Fixed Fee APR** | 1% | |
| **Protocol IR Fee** | 5% | |
| **Protocol Origination Fee** | 0% | |

---

## 🔗 Verification Links

### On-Chain Verification
- **2Z Mint**: [Solscan](https://solscan.io/account/J6pQQ3FAcJQeWPPGppWRb4nM8jU3wLyYbRrLh7feMfvd)
- **Oracle**: [Switchboard](https://ondemand.switchboard.xyz/solana/mainnet/feed/Ho9iLZ15SreUnzRpbMHLTzQfCQugmsNnUQ3rLB5V75Ng) | [Solscan](https://solscan.io/account/Ho9iLZ15SreUnzRpbMHLTzQfCQugmsNnUQ3rLB5V75Ng)
- **Marginfi Bank (after execution)**: [Solscan](https://solscan.io/account/CcVpzLenPRWGB8q3pB9kcNma1bp4SdPjJk9wmW5tMvPp)

---

## 🚀 Transaction

**Derived Bank Address**: `CcVpzLenPRWGB8q3pB9kcNma1bp4SdPjJk9wmW5tMvPp`

**Base58 Transaction**:
```
3vWS6MH7MTkqmGnkzhmuu19C2hMgJ81RuEfjXsXa72FXVvRfbN1xL17tjdmtPy16Y1UgtFvuJWFK6oxe1TkMV2Qs8MmnHNdPByXQQCwHyDwGbx6BDQe4QYEX9ziQUCW1oFAMGi2iy7GKZ75fraUjwQ6yGs2rUMrxJLyPsTdLPZTqbTzxqDCNCSMJmepy64SjUNxqt4sotyDmXjNBvxkmhN7QPCtNaEgWk676xSKW6GEbxQQ1vCZ6D8f26Qtvfzx6tPF1yCZNFmXMXLb2aRsLGEcK7e3bHuPqwe1U456U82e8Pz4iUsJncXJTR4yoXJ85ScrqojpEseUJVcaYsD9RFs36om1t8bQ47VCZctpMFonTHzyDEhsHxeWvryKqbzsFtRxkEovfHqQ1aKvV64MzXdFzTJGMs9amyQ61Htqr3bVgEQYY7oRRa9dBiuJHHfEZvRhmZjrgA8RB5nWMETLyg71jmqgaA8dM3ceDjadzrBdqaVnVC3Bjh3435JCVkHwarcGatnZ6vbnANNaFgBfd7jwAEavWnZxPfYjqFkAWWjH1iP547UERrQbiPBkD4ASw4nFmtN6ptvJHpDfXzm6D3HQdrcL9HRao69SxjKUCGSUwBFCQ7qo7keTagkzsWJxeb5f7eL9P1NazbDD15F7n1YLLQCACMTAvnNmeN1WUc1am565nq94sJ1maLcHhwZVooWFegquUamKYpPvYpJpWpHm2529bQwSsFxW4Heb2upeY55YgeDqTReP5oA5QBhYL96keEu6BDCj44vjRf7ATmVgV3KfbPNBDgJwnJEoechD2ydu2VdvT6Rr73sMsopUS3UspfKhzWKtq1C66Bk1HCGigFAyET5dMKZfazb4KTGwtQNEeQjQXFVrkGFasqcNSXG7s8Z8vt3b9wjxfXAncnCYpGQd5w9hhcXvhQf5wMpF3NbJEcr9TDcyAVrHACaKLV6UtDB7sza5sarUiSfzwZpiEoE929aZcn8rR2TfHnzqKpXUpPaxredExWHA4e3pb1fj83ygAsSaPL3q3Z2KYbQDQJooq83uXh6AZkUAdsgWx4qr5pFUzHvhKerqpduVwvNCudn9DZqXsoGkXT32gVcVqmB5xqS3vxS6j7GqmBfWjXm3hzFn549MxZHTSTqMJV4oqaEpikshbWnENZKprArg2VbxKpdBk7qt71W1higZXqxLqqPyk7rLjL4g8qRrm2AxmVxL
```

### Simulation Results

**Status**: ✅ Simulation successful

**Compute Units**: 4,214 / 200,000

**Full Simulation Logs**:
```
bigint: Failed to load bindings, pure JS will be used (try npm run rebuild?)
═══════════════════════════════════════════════════════
  Adding Marginfi Bank: 2Z
═══════════════════════════════════════════════════════

📄 Config: 2z.config.ts
🏦 Asset: 2Z (DoubleZero - Volatile ecosystem token)
🪙  Mint: J6pQQ3FAcJQeWPPGppWRb4nM8jU3wLyYbRrLh7feMfvd
🔮 Oracle: Ho9iLZ15SreUnzRpbMHLTzQfCQugmsNnUQ3rLB5V75Ng (switchboard)
🌱 Seed: 0
📊 Decimals: 8

🔑 Using keypair: /root/keys/dummy-keypair.json
api: https://rpc.ironforge.network/mainnet?apiKey=01JSM3YXH7YWNSDTPDKVSR85QN
using MS as wallet: CYXEgwbPHu2f9cY3mcUkinzDoDcsSan7myh1uBvYRbEw
🏦 Derived Bank Address: CcVpzLenPRWGB8q3pB9kcNma1bp4SdPjJk9wmW5tMvPp

🔧 Token Program: TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA (spl-token)

📋 Bank Configuration:
  Asset Weight Init: 0.4 (40%)
  Asset Weight Maint: 0.5 (50%)
  Liability Weight Init: 1.6 (160%)
  Liability Weight Maint: 1.42 (142%)
  Deposit Limit: 12,500,000 2Z
  Borrow Limit: 1,250,000 2Z
  Total Asset Value Init Limit: $2,500,000
  Risk Tier: collateral
  Operational State: operational
  Asset Tag: 0

💰 Interest Rate Configuration:
  Optimal Utilization Rate: 50%
  Plateau Interest Rate: 10% APR
  Max Interest Rate: 300% APR
  Protocol Fixed Fee APR: 1%
  Protocol IR Fee: 5%

🔨 Building transaction...

🔄 Simulating transaction...
✅ Simulation successful!

📊 Simulation Results:
  Compute Units: 114290 / 200,000

📝 Full Simulation Logs:
  [0] Program MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA invoke [1]
  [1] Program log: Instruction: LendingPoolAddBankWithSeed
  [2] Program 11111111111111111111111111111111 invoke [2]
  [3] Program 11111111111111111111111111111111 success
  [4] Program 11111111111111111111111111111111 invoke [2]
  [5] Program 11111111111111111111111111111111 success
  [6] Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]
  [7] Program log: Instruction: InitializeAccount3
  [8] Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4214 of 372283 compute units
  [9] Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success
  [10] Program 11111111111111111111111111111111 invoke [2]
  [11] Program 11111111111111111111111111111111 success
  [12] Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]
  [13] Program log: Instruction: InitializeAccount3
  [14] Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4214 of 359168 compute units
  [15] Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success
  [16] Program 11111111111111111111111111111111 invoke [2]
  [17] Program 11111111111111111111111111111111 success
  [18] Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]
  [19] Program log: Instruction: InitializeAccount3
  [20] Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4214 of 343053 compute units
  [21] Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success
  [22] Program log: Asset weight init: 0.3999999999999986 maint: 0.5
  [23] Program log: Liab weight init: 1.6000000000000014 maint: 1.4200000000000017
  [24] Program log: deposit limit: 1250000000000000 borrow limit: 125000000000000 init val limit: 2500000
  [25] Program log: op state: 1 risk tier: 0 asset tag: 0
  [26] Program log: oracle conf 0 age: 70 flags: 16
  [27] Program log: Insurance fixed: 0.0 ir: 0.0
  [28] Program log: Group fixed: 0.010000000000001563 ir: 0.05000000000000071 origination: 0.0
  [29] Program log: Plateau: 0.10000000000000142 Optimal: 0.5 Max: 3.0
  [30] Program data: 7NzJP+9+iPkBq4O/zg5hoaIzYyukz7q/gSuAI8ryvn34CXK/yf8ydUA5FC9oL9g4hJbsvVEG8Vx5TCR3Qzgo+mZC2+v3IANKYayIetBM0bXZ62nk5xOXq1aQ1BXUKLnWwOTIh33rBhav/hQuVUtiCqI/NFO43M+ohmCAxxvvsDiH+w9FbqPXui4=
  [31] Program MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA consumed 99779 of 400000 compute units
  [32] Program MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA success
  [33] Program MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA invoke [1]
  [34] Program log: Instruction: LendingPoolConfigureBankOracle
  [35] Program log: setting oracle to type: SwitchboardPull key: Ho9iLZ15SreUnzRpbMHLTzQfCQugmsNnUQ3rLB5V75Ng
  [36] Program data: d4xu/ZZA0j4Bq4O/zg5hoaIzYyukz7q/gSuAI8ryvn34CXK/yf8ydUA5FC9oL9g4hJbsvVEG8Vx5TCR3Qzgo+mZC2+v3IANKYayIetBM0bXZ62nk5xOXq1aQ1BXUKLnWwOTIh33rBhavBPmNjz1dn6tS7BPoswXfcGLqX1EbI78XnOwOqMH3eCmp
  [37] Program MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA consumed 14511 of 300221 compute units
  [38] Program MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA success

═══════════════════════════════════════════════════════
  Transaction Ready for Squads Multisig
═══════════════════════════════════════════════════════

🏦 Bank Address:
CcVpzLenPRWGB8q3pB9kcNma1bp4SdPjJk9wmW5tMvPp

📦 Base58-encoded Transaction:
3vWS6MH7MTkqmGnkzhmuu19C2hMgJ81RuEfjXsXa72FXVvRfbN1xL17tjdmtPy16Y1UgtFvuJWFK6oxe1TkMV2Qs8MmnHNdPByXQQCwHyDwGbx6BDQe4QYEX9ziQUCW1oFAMGi2iy7GKZ75fraUjwQ6yGs2rUMrxJLyPsTdLPZTqbTzxqDCNCSMJmepy64SjUNxqt4sotyDmXjNBvxkmhN7QPCtNaEgWk676xSKW6GEbxQQ1vCZ6D8f26Qtvfzx6tPF1yCZNFmXMXLb2aRsLGEcK7e3bHuPqwe1U456U82e8Pz4iUsJncXJTR4yoXJ85ScrqojpEseUJVcaYsD9RFs36om1t8bQ47VCZctpMFonTHzyDEhsHxeWvryKqbzsFtRxkEovfHqQ1aKvV64MzXdFzTJGMs9amyQ61Htqr3bVgEQYY7oRRa9dBiuJHHfEZvRhmZjrgA8RB5nWMETLyg71jmqgaA8dM3ceDjadzrBdqaVnVC3Bjh3435JCVkHwarcGatnZ6vbnANNaFgBfd7jwAEavWnZxPfYjqFkAWWjH1iP547UERrQbiPBkD4ASw4nFmtN6ptvJHpDfXzm6D3HQdrcL9HRao69SxjKUCGSUwBFCQ7qo7keTagkzsWJxeb5f7eL9P1NazbDD15F7n1YLLQCACMTAvnNmeN1WUc1am565nq94sJ1maLcHhwZVooWFegquUamKYpPvYpJpWpHm2529bQwSsFxW4Heb2upeY55YgeDqTReP5oA5QBhYL96keEu6BDCj44vjRf7ATmVgV3KfbPNBDgJwnJEoechD2ydu2VdvT6Rr73sMsopUS3UspfKhzWKtq1C66Bk1HCGigFAyET5dMKZfazb4KTGwtQNEeQjQXFVrkGFasqcNSXG7s8Z8vt3b9wjxfXAncnCYpGQd5w9hhcXvhQf5wMpF3NbJEcr9TDcyAVrHACaKLV6UtDB7sza5sarUiSfzwZpiEoE929aZcn8rR2TfHnzqKpXUpPaxredExWHA4e3pb1fj83ygAsSaPL3q3Z2KYbQDQJooq83uXh6AZkUAdsgWx4qr5pFUzHvhKerqpduVwvNCudn9DZqXsoGkXT32gVcVqmB5xqS3vxS6j7GqmBfWjXm3hzFn549MxZHTSTqMJV4oqaEpikshbWnENZKprArg2VbxKpdBk7qt71W1higZXqxLqqPyk7rLjL4g8qRrm2AxmVxL

✅ Done! Copy the base58 transaction above to submit via Squads.

```

**Key Parameters Verified**:
- ✅ Program ID: `MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA` (Mainnet)
- ✅ Token Program: SPL Token
- ✅ Asset Weight Init: 0.4 (40%)
- ✅ Asset Weight Maint: 0.5 (50%)
- ✅ Liability Weight Init: 1.6 (160%)
- ✅ Liability Weight Maint: 1.42 (142%)
- ✅ Deposit Limit: 12,500,000 2Z
- ✅ Borrow Limit: 1,250,000 2Z
- ✅ Total Asset Value Init Limit: $2,500,000
- ✅ Risk Tier: collateral
- ✅ Operational State: operational


---

## 📝 Notes

- This adds a new **2Z** bank with seed 0
- Oracle type: Switchboard Pull (type 4)
- Risk parameters are conservative for a volatile asset
- Remember to submit the transaction via Squads multisig
