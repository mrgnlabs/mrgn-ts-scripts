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
| **Asset Weight Init** | 0.65 (65%) | 0.50 (50%) |
| **Asset Weight Maint** | 0.80 (80%) | 0.65 (65%) |
| **Liability Weight Init** | 1.30 (130%) | 2.50 (250%) |
| **Liability Weight Maint** | 1.20 (120%) | 1.50 (150%) |
| **Deposit Limit** | 25,000 dzSOL | 12,500,000 2Z |
| **Borrow Limit** | 5,000 dzSOL | 3,750,000 2Z |
| **Total Asset Value Init Limit** | $8,750,000 | $2,500,000 |
| **Optimal Utilization Rate** | 80% | 80% |
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
3vWS6MH7MTkqmGnkzhmuu19C2hMgJ81RuEfjXsXa72FXVvRfbN1xL17tjdmtPy16Y1UgtFvuJWFK6oxe1TkMV2Qs8MmnHNdPByXQQCwHyDwGbx6BDQe4QYEX9ziQUCW1oFAMGi2iy7GKZ75fraUjwQ6yGs2rUMrxJLyPsTdLPZTqbTzxqDCNCSMJmepy64SjUNxqt4sotyDmXjNBvxkmhN7QPCtNaEgWk676xSKW6GEbxQQ1vCZ6D8f26Qtvfzx6tPF1yCZNFmXMXLb2aRsLGEcK7e3bHuPqwe1U456U82e8Pz4iUsJncXJTR4yoXJ85ScrqojpEseUJVcaYsD9RFs36om1t8bQ47VCZctpMFonTHzyDEhsHxeWvryKqbzsFtRxkEovfHqQ1aKvV64MzXdFzTJGMs9amyQ61Htqr3bVgEQYY7oRRa9dBiuJHHfEZvRhmZjrgA8RB5nWMETLyg71jmqgaA8dM3ceDjadzrBdqaVnVC3Bjh3435JCVkHwarcGatnZ6vbnANNaFgBfd7jwAEavWnZxPfYjqFkAWWjH1iP547UERrQbiPBkD4ASw4nFmtN6ptvJHpDfXzm6D3HQdrcL9HRao69SxjKUCGSUwBFCQ7qo7keTagkzsWJxeb5f7eL9P1NazbDD15F7n1YLLQCACMTAvnNmeN1WUc1am565nq94sJ1maLcHhwZVooWFegquUamKYpPvYpJpWpHm2529bQwSsFxW4Heb2upeY4bXo3y9a8Qo25Knpm6PSbF7Zb4wvuuTLUoB14gY67PT4AK2hWzNvaLxfd1MVkS2r5xReN4iCVcuu8r4RusRiozfwq31pGgLEyGWUiyJH6FayvPfV6iUTNpyjRbSUXSNJWqBo9ziFkQiy9TQddpm5syAFcUJVzS8VDh7K6NDqJSg6TSqhPGrjkwAYK5wr42MTBLeBBqmSttRBAGtKcZqfZ9WUXK9dLtbfYGsgCfW1DkkFXmY2nh9VpFjJBBGJtKzkQp28DbxjNnkzift2mBh3599A5G49nnC5wGQf4V8bTkgBndZeut6u4GBHBGCgKY4coCYxUqgfSb8Hs6WCbooHAh3gTj9KvLTco7Pvi1r2dgJQNA4cHh1XUcqNbXeXq757b9kxsiLoh51ywxenH28zPjazWujqz8TJmFNptnfHzRZFrW2sVUmvPAUdFsMHa9mzLURAmdFZKEnJXh9hEpEHrzzDnTa
```

**Simulation:** ✅ Successful (113,800 compute units)

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
- **2Z** uses conservative volatile token parameters (0.50/0.65 asset weights, 2.50/1.50 liability weights)
- Both use Switchboard Pull oracles with 70-second max age
- Both use standard SPL Token program
- Transactions must be submitted via Squads multisig for approval
