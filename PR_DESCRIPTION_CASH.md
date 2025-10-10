# Add Kamino CASH Bank

## Summary
Adds a new Kamino-integrated bank for **CASH** to the marginfi lending group.

**Asset**: CASH
**Mint**: `CASHx9KJUStyftLFWGvEVf59SGeG9sh5FfcnZMVPCASH`
**Bank Seed**: 300 (Kamino banks)
**Asset Tag**: 3 (ASSET_TAG_KAMINO)

---

## 🔍 Configuration Parameters

### Mint Information (Fetched On-Chain)
| Parameter | Value | Verification |
|-----------|-------|--------------|
| **Token Program** | `TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb` | Token-2022 |
| **Mint Decimals** | 6 | Fetched from mint account |
| **Special Note** | Mint has a permanent delegate | Tokens may be seized at any time |

### Marginfi Bank Configuration
| Parameter | Value | Verification |
|-----------|-------|--------------|
| **Program ID** | `MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA` | Marginfi mainnet program |
| **Group** | `4qp6Fx6tnZkY5Wropq9wUYgtFxXKwE6viZxFHg3rdAG8` | Marginfi mainnet lending group |
| **Bank Mint** | `CASHx9KJUStyftLFWGvEVf59SGeG9sh5FfcnZMVPCASH` | [CASH mint](https://solscan.io/account/CASHx9KJUStyftLFWGvEVf59SGeG9sh5FfcnZMVPCASH) |
| **Seed** | 300 | Kamino banks use seed 300 |

### Oracle Configuration
| Parameter | Value | Verification |
|-----------|-------|--------------|
| **Bank Oracle** | `HxQbxDh4SGYi94LrgS6VuSdoBnRZamBvHgdiVTG8yomf` | [Solscan](https://solscan.io/account/HxQbxDh4SGYi94LrgS6VuSdoBnRZamBvHgdiVTG8yomf) |
| **Oracle Type** | Switchboard (kaminoSwitchboardPull) | Switchboard price feed (same as existing CASH bank) |
| **Oracle Max Age** | 300 seconds | |
| **Oracle Max Confidence** | 0 (default 10%) | |

**Note**: Using `kaminoSwitchboardPull` since the existing CASH bank uses Switchboard.

### Risk Parameters
| Parameter | Value | Notes |
|-----------|-------|-------|
| **Asset Weight Init** | 0.50 (50%) | Conservative collateral weight for CASH |
| **Asset Weight Maint** | 0.60 (60%) | Conservative collateral weight for CASH |
| **Deposit Limit** | 2,500,000 CASH | Raw: `new BN(2_500_000 * 10 ** 6)` - 50% of existing 5M CASH bank |
| **Total Asset Value Init Limit** | $2,500,000 | Raw: `new BN(2_500_000)` - 50% of existing $5M limit |
| **Operational State** | Operational | |
| **Risk Tier** | Collateral | |
| **Config Flags** | 1 | |

### Kamino Integration
| Parameter | Value | Verification |
|-----------|-------|--------------|
| **Kamino Market** | `7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF` | Main market |
| **Kamino Reserve** | `ApQkX32ULJUzszZDe986aobLDLMNDoGQK8tRm6oD6SsA` | [Solscan](https://solscan.io/account/ApQkX32ULJUzszZDe986aobLDLMNDoGQK8tRm6oD6SsA) |
| **Farm Collateral** | TBD | Check if CASH has active farm rewards |

**Note**: CASH has conservative 50%/60% collateral weights and 2.5M deposit limit (50% of the existing non-Kamino CASH bank limit of 5M).

---

## 🔗 Verification Links

### On-Chain Verification
- **Existing CASH Bank (non-Kamino)**: [Solscan](https://solscan.io/account/F4brCRJHx8epWah7p8Ace4ehutphxYZ1ctRq2LS3iiBh#accountData)
- **Kamino CASH Bank**: *Will be created after transaction execution*
- **Kamino Reserve**: [Solscan](https://solscan.io/account/ApQkX32ULJUzszZDe986aobLDLMNDoGQK8tRm6oD6SsA#accountData)
- **CASH Mint**: [Solscan](https://solscan.io/account/CASHx9KJUStyftLFWGvEVf59SGeG9sh5FfcnZMVPCASH)
- **Bank Oracle (Switchboard)**: [Solscan](https://solscan.io/account/HxQbxDh4SGYi94LrgS6VuSdoBnRZamBvHgdiVTG8yomf)

---

## 🚀 Transaction

### Step 1: Add Bank

**Derived Bank Address**: `HnKy41QrJNFLJmBGtgLWpy8NissUsNLKRMibRwsNhDnF`

**Base58 Transaction**:
```
3TXwb8T2kyg7hY4DanwQ9m3UJGqUAJxxo99vevVQLSvNoCQFhmmjZyBBVkEhHGXe78hv9Z4W1jSgvV6PBHpCuD3vW6XnT2pKsbWCCPSzGBSbuvoT2NvDN1Yzde1s9Wk3KafyfRCRVijowKkhizRGhH1Xnt3SsY5MfotgvCea5Jy53H8HrRCsvXKvQf1wJ8VuuUCrmq6hrTooeg77nee6xDVkKMW7dDC6xGfHWrfptEu5GU56EnGyBE3mB3bR5t7HBmBMVeNpt4NY36dkrddYQ5iM7AsfDFgKmBRY9fFD3eiKyNQu4x21Dv7QdX684PgYiDw5xEwYD5bq2RMvD6nW1kCScSHFbxRjN8gzpeVb2QDyhZNDuBxGbuWudUEn9VyjwQ6fUGKbCHJxxG6ZGAQWHosSGXdUe7qMPcnnc31sAvQj6pdoDqNMu64BgUXkdzmXmMSqjy9pS4X1fNzua7L5LRrgk96mJ5YWLtzMXze5tbwRbPJFUPBK9NGzqznd6HhE8SW3UNcRNhQw4kjAFMdrATseYS3SbD6TTdE6BGxXrPhAAbGFKQcpb4zYEaxbF6jKTPeTaQxMXLyeCwVmumgKPNE2VkQAyFf2gTgDpQnkccpX7ocSeU53ggFnE5uebGoE7SXefaFzzaafm57r5gZXXiLJhLfXc5JsLN9vY9RHHGUojmSW5UGDaug7z1weLxTC6utMx7mxjdCpHWE7HsCJRNcannykRMtGKuDqXqBAAP9hvVVpzmeuACYdc76JWEJQnqHX6dkpNVSfLd8U9skbVagohmwTwPwPWoLfFYEyybWCS3GrjRyaR1DEWtaw2HPo4nWDuvcvTo7n9vdCy818tQzJGGQcoPacBZ6pvyHLkrtFK1tLt3YVEAoyarekYELbkUJHmUPwngEAEpPnmReUTZ65PPGvDyeKT2LAMh4dbnBs4qgG3xTHxDnenN8tL4z5YBG6csu3Yi8wsYyvsv284zaefGXqTSERKXNHQNLGNTc7n8sDgT
```

### Simulation Results

**Status**: ✅ Simulation successful

**Compute Units**: 88,699 / 200,000

**Full Simulation Logs**:
```
  [0] Program MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA invoke [1]
  [1] Program log: Instruction: LendingPoolAddBankKamino
  [2] Program 11111111111111111111111111111111 invoke [2]
  [3] Program 11111111111111111111111111111111 success
  [4] Program 11111111111111111111111111111111 invoke [2]
  [5] Program 11111111111111111111111111111111 success
  [6] Program TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb invoke [2]
  [7] Program log: Instruction: InitializeAccount3
  [8] Program log: Warning: Mint has a permanent delegate, so tokens in this account may be seized at any time
  [9] Program TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb consumed 2855 of 171781 compute units
  [10] Program TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb success
  [11] Program 11111111111111111111111111111111 invoke [2]
  [12] Program 11111111111111111111111111111111 success
  [13] Program TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb invoke [2]
  [14] Program log: Instruction: InitializeAccount3
  [15] Program log: Warning: Mint has a permanent delegate, so tokens in this account may be seized at any time
  [16] Program TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb consumed 2855 of 158224 compute units
  [17] Program TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb success
  [18] Program 11111111111111111111111111111111 invoke [2]
  [19] Program 11111111111111111111111111111111 success
  [20] Program TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb invoke [2]
  [21] Program log: Instruction: InitializeAccount3
  [22] Program log: Warning: Mint has a permanent delegate, so tokens in this account may be seized at any time
  [23] Program TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb consumed 2855 of 144667 compute units
  [24] Program TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb success
  [25] Program log: Asset weight init: 0.5 maint: 0.6000000000000014
  [26] Program log: Liab weight init: 1.5 maint: 1.25
  [27] Program log: deposit limit: 2500000000000 borrow limit: 0 init val limit: 2500000
  [28] Program log: op state: 1 risk tier: 0 asset tag: 3
  [29] Program log: oracle conf 0 age: 44 flags: 16
  [30] Program log: Insurance fixed: 0.0 ir: 0.10000000000000142
  [31] Program log: Group fixed: 0.010000000000001563 ir: 0.0 origination: 0.0
  [32] Program log: Plateau: 0.3999999999999986 Optimal: 0.3999999999999986 Max: 3.0
  [33] Program data: 7NzJP+9+iPkBq4O/zg5hoaIzYyukz7q/gSuAI8ryvn34CXK/yf8ydUA5FC9oL9g4hJbsvVEG8Vx5TCR3Qzgo+mZC2+v3IANKYflXkpcwcpsS6CWXDPgWt1pSDvjWBmAQVQGJP+6RFTNApdthqvFWnacSNMwAHBIwEumDEWeE757ZWOtSXxn6iJY=
  [34] Program MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA consumed 88699 of 200000 compute units
  [35] Program MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA success
```

**Key Parameters Verified**:
- ✅ Program ID: `MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA` (Mainnet)
- ✅ Instruction: `LendingPoolAddBankKamino`
- ✅ Token Program: `TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb` (Token-2022)
- ⚠️ Warning: Mint has a permanent delegate (tokens may be seized at any time)
- ✅ Asset Weight Init: 0.5 (50%)
- ✅ Asset Weight Maint: 0.6 (60%)
- ✅ Deposit Limit: 2,500,000 CASH (2500000000000 raw with 6 decimals)
- ✅ Asset Value Init Limit: $2,500,000 (2500000 raw)
- ✅ Asset Tag: 3 (ASSET_TAG_KAMINO)
- ✅ Risk Tier: 0 (Collateral)
- ✅ Operational State: 1 (Operational)