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
- **Oracle**: [Solscan](https://solscan.io/account/8wRUjxh4uCdvQdqcWUMvBBTJa95vLuKrze7WLus5h6Gk)
- **Marginfi Bank (after execution)**: [Solscan](https://solscan.io/account/E7LfHgmiWT6TxAcWq18yDBXWxHw4VasjD98aZaoXCp8T)

---

## 🚀 Transaction

**Derived Bank Address**: `E7LfHgmiWT6TxAcWq18yDBXWxHw4VasjD98aZaoXCp8T`

**Base58 Transaction**:
```
3vWS6MH7MTkqmGnkzhmuu19C2hMgJ81RuEfjXsXa72FXVvRfbN1xL17tjdmtPy16Y1UgtFvuJWFK6oxe1TkMV2Qs8MmnHNdPByXQQCwHyDwGbx6BDQe4QYEX9ziQUCW1oFAMGi2iy7GKZ75fraUjwQ6yGs2rUMrxJLyPsTdLPZTqbTzxqDCNCfGXd3Qp5X4mu29XsG4ogHRPqM7BQQTQ7GGMnJ5MaU1bJkon87jgAmXzT8ZdwT5ansarNjgEMfGk5iAXwMK9TXBwgzy6df9CpAQCvX79FBFBBck1x1PAnVaE3opexzHPrb3z7Ct1bxRsnwAZTRQii26q9SAui1mRcUjt5AWycmYXD5JVtRFd8jvdjgLobF7CrBrtJFwv526UDmiDBrNwU5ceyRJbXJv6pFfTCCQ9CSogQAaBdhhUqpJ9aZ9bfKcn95nFHazM5cXyv8paDhqobxQpuhbDCiTt5kj4PH9DQrrUrvbysQyASfgVg3xZws1YgMvYRbfyvFJbVSgz1NTRpTfxxcM6DcWNuxRhLPBN2X7x5eHF2gCv4MeNFAr7LRwRrx8TiSed78MJdHH4mowsRJzSebmc9chHUuD8A7H75n2jboUKd3L1tsFF9ceZ6WyCxoMcHs3AqWLgsoHVy6SwJaoKh8X3JChi9oRwduKCmzAnQUPfK4pNEzEFHSUMg9fcfFp3xV4YMGZCQc34qiEzpqYV8kitLPM5i3efZGcwY9han97NpqyRAKGrJbsBnsgpMiqTzTu6egdcXrmzqiU7EMgLeW9TkSRYrzKUhogFHiYLFT98abhq1fmAETPbnah37q4qwQcFPx5emXb4RTFxJ3bPUunCAxYmMp8E4C19AdFSvqgaeuzZPFCd15EbtY5rGAa4tEbWb3r8b4CAhVDjBgnFFHDbdDLiieUH24QjMW3kqoB3dKx8CHWXeQSZRpBiFvpkDh1TJZmtF3uBJbA4mDBgQtaMkcB1yhc3RB4J7pm54vswEEAsUQhUeZXjwzqCjhgvWwVUL3dyRYSjY4Fd2iCu1fVpFUNyubuWXBZ2pg9tQubmdeBtP7Ep5oE2bRREdLGvTo6HjbKxgjKUG6EybRavgpbykB9GxhLar5xuJnBnhvzH6v3emn4quGiqwhZZdte5FAewaQkWgjbUsaLvTbzBE2PKTiADifSRwEG6qB3CH5Yytoqj8roMRXhhQQVdVpb7S5QKpMbwoUDYBrC
```

### Simulation Results

**Status**: ⏳ Run simulation to verify

To simulate the transaction, run:
```bash
npx tsx scripts/kamino/simulate_transaction.ts <base58_tx>
```


---

## 📝 Notes

- This adds a new **dzSOL** bank with seed 0
- Oracle type: Switchboard Pull (type 4)
- Risk parameters are conservative for a liquid staking token
- Remember to submit the transaction via Squads multisig
