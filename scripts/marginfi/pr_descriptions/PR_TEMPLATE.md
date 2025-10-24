# Add Marginfi Banks: dzSOL and 2Z

This PR adds two new Marginfi banks to the lending protocol:
- **dzSOL** - DoubleZero Staked SOL (liquid staking token)
- **2Z** - DoubleZero ecosystem token (volatile)

## 📋 Configuration Summary

| Parameter | dzSOL | 2Z |
|-----------|-------|-----|
| **Asset Type** | Liquid Staking Token | Volatile Ecosystem Token |
| **Mint** | `Gekfj7SL2fVpTDxJZmeC46cTYxinjB6gkAnb6EGT6mnn` | `J6pQQ3FAcJQeWPPGppWRb4nM8jU3wLyYbRrLh7feMfvd` |
| **Bank Address** | `E7LfHgmiWT6TxAcWq18yDBXWxHw4VasjD98aZaoXCp8T` | `CcVpzLenPRWGB8q3pB9kcNma1bp4SdPjJk9wmW5tMvPp` |
| **Decimals** | 9 | 8 |
| **Oracle** | [`8wRUj...h6Gk`](https://ondemand.switchboard.xyz/solana/mainnet/feed/8wRUjxh4uCdvQdqcWUMvBBTJa95vLuKrze7WLus5h6Gk) | [`Ho9iL...75Ng`](https://ondemand.switchboard.xyz/solana/mainnet/feed/Ho9iLZ15SreUnzRpbMHLTzQfCQugmsNnUQ3rLB5V75Ng) |
| **Oracle Type** | Switchboard Pull | Switchboard Pull |
| **Oracle Max Age** | 70 seconds | 70 seconds |
| **Seed** | 0 | 0 |
| **Asset Weight Init** | 0.65 (65%) | 0.40 (40%) |
| **Asset Weight Maint** | 0.80 (80%) | 0.50 (50%) |
| **Liability Weight Init** | 1.30 (130%) | 1.60 (160%) |
| **Liability Weight Maint** | 1.20 (120%) | 1.42 (142%) |
| **Deposit Limit** | 25,000 dzSOL | 12,500,000 2Z |
| **Borrow Limit** | 5,000 dzSOL | 1,250,000 2Z |
| **Total Asset Value Init Limit** | $8,750,000 | $2,500,000 |
| **Optimal Utilization Rate** | 80% | 50% |
| **Plateau Interest Rate** | 10% APR | 10% APR |
| **Max Interest Rate** | 125% APR | 300% APR |
| **Protocol Fixed Fee APR** | 1% | 1% |
| **Protocol IR Fee** | 13.5% | 5% |

## 📄 Detailed Documentation

Full parameter details and simulation results:
- [dzSOL Bank Details](./PR_DESCRIPTION_DZSOL.md)
- [2Z Bank Details](./PR_DESCRIPTION_2Z.md)

## 🚀 Transactions for Squads Multisig

### dzSOL Bank Transaction

**Bank Address:** `E7LfHgmiWT6TxAcWq18yDBXWxHw4VasjD98aZaoXCp8T`

**Base58 Transaction:**
```
3vWS6MH7MTkqmGnkzhmuu19C2hMgJ81RuEfjXsXa72FXVvRfbN1xL17tjdmtPy16Y1UgtFvuJWFK6oxe1TkMV2Qs8MmnHNdPByXQQCwHyDwGbx6BDQe4QYEX9ziQUCW1oFAMGi2iy7GKZ75fraUjwQ6yGs2rUMrxJLyPsTdLPZTqbTzxqDCNCfGXd3Qp5X4mu29XsG4ogHRPqM7BQQTQ7GGMnJ5MaU1bJkon87jgAmXzT8ZdwT5ansarNjgEMfGk5iAXwMK9TXBwgzy6df9CpAQCvX79FBFBBck1x1PAnVaE3opexzHPrb3z7Ct1bxRsnwAZTRQii26q9SAui1mRcUjt5AWycmYXD5JVtRFd8jvdjgLobF7CrBrtJFwv526UDmiDBrNwU5ceyRJbXJv6pFfTCCQ9CSogQAaBdhhUqpJ9aZ9bfKcn95nFHazM5cXyv8paDhqobxQpuhbDCiTt5kj4PH9DQrrUrvbysQyASfgVg3xZws1YgMvYRbfyvFJbVSgz1NTRpTfxxcM6DcWNuxRhLPBN2X7x5eHF2gCv4MeNFAr7LRwRrx8TiSed78MJdHH4mowsRJzSebmc9chHUuD8A7H75n2jboUKd3L1tsFF9ceZ6WyCxoMcHs3AqWLgsoHVy6SwJaoKh8X3JChi9oRwduKCmzAnQUPfK4pNEzEFHSUMg9fcfFp3xV4YMGZCQc34qiEzpqYV8kitLPM5i3efZGcwY9han97NpqyRAKGrJbsBnsgpMiqTzTu6egdcXrmzqiU7EMgLeW9TkSRYrzKUhogFHiYLFT98abhq1fmAETPbnah37q4qwQcFPx5emXb4RTFxJ3bPUunCAxYmMp8E4C19AdFSvqgaeuzZPFCd15EbtY5rGAa4tEbWb3r8b4CAhVDjBgnFFHDbdDLiieUH24QjMW3kqoB3dKx8CHWXeQSZRpBiFvpkDh1TJZmtF3uBJbA4mDBgQtaMkcB1yhc3RB4J7pm54vswEEAsUQhUeZXjwzqCjhgvWwVUL3dyRYSjY4Fd2iCu1fVpFUNyubuWXBZ2pg9tQubmdeBtP7Ep5oE2bRREdLGvTo6HjbKxgjKUG6EybRavgpbykB9GxhLar5xuJnBnhvzH6v3emn4quGiqwhZZdte5FAewaQkWgjbUsaLvTbzBE2PKTiADifSRwEG6qB3CH5Yytoqj8roMRXhhQQVdVpb7S5QKpMbwoUDYBrC
```

**Simulation:** ✅ Successful (118,428 compute units)

---

### 2Z Bank Transaction

**Bank Address:** `CcVpzLenPRWGB8q3pB9kcNma1bp4SdPjJk9wmW5tMvPp`

**Base58 Transaction:**
```
3vWS6MH7MTkqmGnkzhmuu19C2hMgJ81RuEfjXsXa72FXVvRfbN1xL17tjdmtPy16Y1UgtFvuJWFK6oxe1TkMV2Qs8MmnHNdPByXQQCwHyDwGbx6BDQe4QYEX9ziQUCW1oFAMGi2iy7GKZ75fraUjwQ6yGs2rUMrxJLyPsTdLPZTqbTzxqDCNCSMJmepy64SjUNxqt4sotyDmXjNBvxkmhN7QPCtNaEgWk676xSKW6GEbxQQ1vCZ6D8f26Qtvfzx6tPF1yCZNFmXMXLb2aRsLGEcK7e3bHuPqwe1U456U82e8Pz4iUsJncXJTR4yoXJ85ScrqojpEseUJVcaYsD9RFs36om1t8bQ47VCZctpMFonTHzyDEhsHxeWvryKqbzsFtRxkEovfHqQ1aKvV64MzXdFzTJGMs9amyQ61Htqr3bVgEQYY7oRRa9dBiuJHHfEZvRhmZjrgA8RB5nWMETLyg71jmqgaA8dM3ceDjadzrBdqaVnVC3Bjh3435JCVkHwarcGatnZ6vbnANNaFgBfd7jwAEavWnZxPfYjqFkAWWjH1iP547UERrQbiPBkD4ASw4nFmtN6ptvJHpDfXzm6D3HQdrcL9HRao69SxjKUCGSUwBFCQ7qo7keTagkzsWJxeb5f7eL9P1NazbDD15F7n1YLLQCACMTAvnNmeN1WUc1am565nq94sJ1maLcHhwZVooWFegquUamKYpPvYpJpWpHm2529bQwSsFxW4Heb2upeY55YgeDqTReP5oA5QBhYL96keEu6BDCj44vjRf7ATmVgV3KfbPNBDgJwnJEoechD2ydu2VdvT6Rr73sMsopUS3UspfKhzWKtq1C66Bk1HCGigFAyET5dMKZfazb4KTGwtQNEeQjQXFVrkGFasqcNSXG7s8Z8vt3b9wjxfXAncnCYpGQd5w9hhcXvhQf5wMpF3NbJEcr9TDcyAVrHACaKLV6UtDB7sza5sarUiSfzwZpiEoE929aZcn8rR2TfHnzqKpXUpPaxredExWHA4e3pb1fj83ygAsSaPL3q3Z2KYbQDQJooq83uXh6AZkUAdsgWx4qr5pFUzHvhKerqpduVwvNCudn9DZqXsoGkXT32gVcVqmB5xqS3vxS6j7GqmBfWjXm3hzFn549MxZHTSTqMJV4oqaEpikshbWnENZKprArg2VbxKpdBk7qt71W1higZXqxLqqPyk7rLjL4g8qRrm2AxmVxL
```

**Simulation:** ✅ Successful (114,290 compute units)

---

## ✅ Verification

Both transactions have been simulated successfully with signature verification disabled. Key verifications:
- ✅ All parameters match configuration
- ✅ Oracle configurations are correct
- ✅ Token programs are correctly identified
- ✅ Compute units are well within limits
- ✅ Both transactions ready for Squads multisig submission

## 📝 Notes

- **dzSOL** uses standard liquid staking token risk parameters (0.65/0.80 asset weights)
- **2Z** uses PUMP-aligned parameters (0.40/0.50 asset weights, 1.60/1.42 liability weights, 50% optimal utilization, 10% borrow-to-deposit ratio)
- Both use Switchboard Pull oracles with 70-second max age
- Both use standard SPL Token program
- Transactions must be submitted via Squads multisig for approval
