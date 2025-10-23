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
| **Asset Weight Init** | 0.5 (50%) | Collateral value when opening positions |
| **Asset Weight Maint** | 0.65 (65%) | Collateral value for existing positions |
| **Liability Weight Init** | 2.5 (250%) | Borrow value when opening positions |
| **Liability Weight Maint** | 1.5 (150%) | Borrow value for existing positions |
| **Deposit Limit** | 12,500,000 2Z | Raw: `new BN(12500000 * 10 ** 8)` |
| **Borrow Limit** | 3,750,000 2Z | Raw: `new BN(3750000 * 10 ** 8)` |
| **Total Asset Value Init Limit** | $2,500,000 | Raw: `new BN(2500000)` |
| **Operational State** | operational | |
| **Risk Tier** | collateral | |

### Interest Rate Configuration
| Parameter | Value | Notes |
|-----------|-------|-------|
| **Optimal Utilization Rate** | 80% | Target utilization |
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
- **Oracle**: [Solscan](https://solscan.io/account/Ho9iLZ15SreUnzRpbMHLTzQfCQugmsNnUQ3rLB5V75Ng)
- **Marginfi Bank (after execution)**: [Solscan](https://solscan.io/account/CcVpzLenPRWGB8q3pB9kcNma1bp4SdPjJk9wmW5tMvPp)

---

## 🚀 Transaction

**Derived Bank Address**: `CcVpzLenPRWGB8q3pB9kcNma1bp4SdPjJk9wmW5tMvPp`

**Base58 Transaction**:
```
3vWS6MH7MTkqmGnkzhmuu19C2hMgJ81RuEfjXsXa72FXVvRfbN1xL17tjdmtPy16Y1UgtFvuJWFK6oxe1TkMV2Qs8MmnHNdPByXQQCwHyDwGbx6BDQe4QYEX9ziQUCW1oFAMGi2iy7GKZ75fraUjwQ6yGs2rUMrxJLyPsTdLPZTqbTzxqDCNCSMJmepy64SjUNxqt4sotyDmXjNBvxkmhN7QPCtNaEgWk676xSKW6GEbxQQ1vCZ6D8f26Qtvfzx6tPF1yCZNFmXMXLb2aRsLGEcK7e3bHuPqwe1U456U82e8Pz4iUsJncXJTR4yoXJ85ScrqojpEseUJVcaYsD9RFs36om1t8bQ47VCZctpMFonTHzyDEhsHxeWvryKqbzsFtRxkEovfHqQ1aKvV64MzXdFzTJGMs9amyQ61Htqr3bVgEQYY7oRRa9dBiuJHHfEZvRhmZjrgA8RB5nWMETLyg71jmqgaA8dM3ceDjadzrBdqaVnVC3Bjh3435JCVkHwarcGatnZ6vbnANNaFgBfd7jwAEavWnZxPfYjqFkAWWjH1iP547UERrQbiPBkD4ASw4nFmtN6ptvJHpDfXzm6D3HQdrcL9HRao69SxjKUCGSUwBFCQ7qo7keTagkzsWJxeb5f7eL9P1NazbDD15F7n1YLLQCACMTAvnNmeN1WUc1am565nq94sJ1maLcHhwZVooWFegquUamKYpPvYpJpWpHm2529bQwSsFxW4Heb2upeY4bXo3y9a8Qo25Knpm6PSbF7Zb4wvuuTLUoB14gY67PT4AK2hWzNvaLxfd1MVkS2r5xReN4iCVcuu8r4RusRiozfwq31pGgLEyGWUiyJH6FayvPfV6iUTNpyjRbSUXSNJWqBo9ziFkQiy9TQddpm5syAFcUJVzS8VDh7K6NDqJSg6TSqhPGrjkwAYK5wr42MTBLeBBqmSttRBAGtKcZqfZ9WUXK9dLtbfYGsgCfW1DkkFXmY2nh9VpFjJBBGJtKzkQp28DbxjNnkzift2mBh3599A5G49nnC5wGQf4V8bTkgBndZeut6u4GBHBGCgKY4coCYxUqgfSb8Hs6WCbooHAh3gTj9KvLTco7Pvi1r2dgJQNA4cHh1XUcqNbXeXq757b9kxsiLoh51ywxenH28zPjazWujqz8TJmFNptnfHzRZFrW2sVUmvPAUdFsMHa9mzLURAmdFZKEnJXh9hEpEHrzzDnTa
```

### Simulation Results

**Status**: ⏳ Run simulation to verify

To simulate the transaction, run:
```bash
npx tsx scripts/kamino/simulate_transaction.ts <base58_tx>
```


---

## 📝 Notes

- This adds a new **2Z** bank with seed 0
- Oracle type: Switchboard Pull (type 4)
- Risk parameters are conservative for a volatile asset
- Remember to submit the transaction via Squads multisig
