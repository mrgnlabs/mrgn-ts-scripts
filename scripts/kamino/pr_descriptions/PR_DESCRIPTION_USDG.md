# Add Kamino USDG Bank

## Summary
Adds a new Kamino-integrated bank for **USDG** to the marginfi lending group.

**Asset**: USDG
**Mint**: `2u1tszSeqZ3qBWF3uNGPFc8TzMk2tdiwknnRMWGWjGWH`
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
| **Bank Mint** | `2u1tszSeqZ3qBWF3uNGPFc8TzMk2tdiwknnRMWGWjGWH` | [USDG mint](https://solscan.io/account/2u1tszSeqZ3qBWF3uNGPFc8TzMk2tdiwknnRMWGWjGWH) |
| **Seed** | 300 | Kamino banks use seed 300 |

### Oracle Configuration
| Parameter | Value | Verification |
|-----------|-------|--------------|
| **Bank Oracle** | `6JkZmXGgWnzsyTQaqRARzP64iFYnpMNT4siiuUDUaB8s` | [Solscan](https://solscan.io/account/6JkZmXGgWnzsyTQaqRARzP64iFYnpMNT4siiuUDUaB8s) |
| **Oracle Type** | Pyth (kaminoPythPush) | Pyth price feed (same as existing USDG bank) |
| **Oracle Max Age** | 300 seconds | |
| **Oracle Max Confidence** | 0 (default 10%) | |

### Risk Parameters
| Parameter | Value | Notes |
|-----------|-------|-------|
| **Asset Weight Init** | 0.85 (85%) | Same as existing USDG bank |
| **Asset Weight Maint** | 0.91 (91%) | Same as existing USDG bank |
| **Deposit Limit** | 100,000 USDG | Raw: `new BN(100_000 * 10 ** 6)` - Matches existing 100K USDG bank |
| **Total Asset Value Init Limit** | $100,000 | Raw: `new BN(100_000)` - Matches existing $100K limit |
| **Operational State** | Operational | |
| **Risk Tier** | Collateral | |
| **Config Flags** | 1 | |

### Kamino Integration
| Parameter | Value | Verification |
|-----------|-------|--------------|
| **Kamino Market** | `7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF` | Main market |
| **Kamino Reserve** | `ESCkPWKHmgNE7Msf77n9yzqJd5kQVWWGy3o5Mgxhvavp` | [Solscan](https://solscan.io/account/ESCkPWKHmgNE7Msf77n9yzqJd5kQVWWGy3o5Mgxhvavp) |
| **Farm Collateral** | TBD | Check if USDG has active farm rewards |

**Note**: USDG is a stablecoin with 85%/91% collateral weights and 100K deposit limit (matching the existing non-Kamino USDG bank limit).

---

## 🔗 Verification Links

### On-Chain Verification
- **Existing USDG Bank (non-Kamino)**: [Solscan](https://solscan.io/account/Dj2CwMF3GM7mMT5hcyGXKuYSQ2kQ5zaVCkA1zX1qaTva#accountData)
- **Kamino USDG Bank**: *Will be created after transaction execution*
- **Kamino Reserve**: [Solscan](https://solscan.io/account/ESCkPWKHmgNE7Msf77n9yzqJd5kQVWWGy3o5Mgxhvavp#accountData)
- **USDG Mint**: [Solscan](https://solscan.io/account/2u1tszSeqZ3qBWF3uNGPFc8TzMk2tdiwknnRMWGWjGWH)
- **Bank Oracle (Pyth)**: [Solscan](https://solscan.io/account/6JkZmXGgWnzsyTQaqRARzP64iFYnpMNT4siiuUDUaB8s)

---

## 🚀 Transaction

### Step 1: Add Bank

**Derived Bank Address**: `6KP94PsCrBk2gPqtqT4WSvZ8Zss7r1auz3azXpv5ptrS`

**Base58 Transaction**:
```
3TXwb8T2kyg7hY4DanwQ9m3UJGqUAJxxo99vevVQLSvNoCQFhmmjZyBBVkEhHGXe78hv9Z4W1jSgvV6PBHpCuD3vW6XnT2pKsbWCCPSzGBSbuvoT2NvDN1Yzde1s9Wk3KafyfRCRVhjQbdqE5ksF5Zdt4PTGqoLLgEWGUM398zHHoV3h5P8XW2tezqKPcVct3AGZKUcDsJFmn1Mj42LhohipKFa8a622HRursZ6C5g6FHUccUBSBGJb4achD354zt7Q6fnSfjJYyVSUn2eRJk9CipPC8BqTufmPRE8hSyH7UNBaQR6Hozb4mrWUt1L5g6aLogRdHRm5rtMxuhPoJ8Yxh4HxCj14MDbMyWA6GLVSfJveDGet4EBZMRnbYLrCeXeRF5jDmuQp9k6g3CB9QUJcmSkq27iWSEmMeAAbSSkZ8EMYLLVtXVvVvx7tTho75ciCyjkoEGAzY8AsPXUZn1ogEjybjBuhxnUSEz3gzAG48zDbnhRPLtd5nfXwQw2EwKCHXKfDbbA8L4eqisqTrso6k4vjxm9wgn8JhCpBsTTmzpynVBxTTTfFkWdAAueuX8F6vx4j4fGUUtRWD6MV3vk8eGpFjWB4fmDzhrDXd6bhV4qAJ1TZWqLc8vXUAR2md6tDXBc6ega4tgpzxRob6ApkXqwGY78RcssTQjqXbZTHGxrayfnjFVPu4GRRgT76xqaYWVeXbcogNUybEva6Dyb1MXDXEGJgEgoGsQPpB2PSfv7CB9oApTchTX1xWqJpnNgaEwEhZfw7f1ZCmwPYewEDm9odSNZzQfeBVkmz34eyctxmWSh8cdpF7ctMJKBQMGy2rK8rKFKBrqaD7bYnToyc5bW7ZeXdzzDwaK1AiXT6C3hyQkYGBJUiNh2yKqrCapkNEg9t7XStUxBNnHpSwfs8wUNwbuXrcAyZnTpH86cPHTpz4SiEcUfyCy7qYAs2jYv4Nie85Tkc48HPuZGka1byYGFNaMn5CQothAJrbXmzyjfirCP
```

### Simulation Results

**Status**: ✅ Simulation successful

**Compute Units**: 91,335 / 200,000

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
  [9] Program TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb consumed 3396 of 179157 compute units
  [10] Program TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb success
  [11] Program 11111111111111111111111111111111 invoke [2]
  [12] Program 11111111111111111111111111111111 success
  [13] Program TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb invoke [2]
  [14] Program log: Instruction: InitializeAccount3
  [15] Program log: Warning: Mint has a permanent delegate, so tokens in this account may be seized at any time
  [16] Program TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb consumed 3396 of 164935 compute units
  [17] Program TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb success
  [18] Program 11111111111111111111111111111111 invoke [2]
  [19] Program 11111111111111111111111111111111 success
  [20] Program TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb invoke [2]
  [21] Program log: Instruction: InitializeAccount3
  [22] Program log: Warning: Mint has a permanent delegate, so tokens in this account may be seized at any time
  [23] Program TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb consumed 3396 of 147713 compute units
  [24] Program TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb success
  [25] Program log: Asset weight init: 0.8500000000000014 maint: 0.9100000000000001
  [26] Program log: Liab weight init: 1.5 maint: 1.25
  [27] Program log: deposit limit: 100000000000 borrow limit: 0 init val limit: 100000
  [28] Program log: op state: 1 risk tier: 0 asset tag: 3
  [29] Program log: oracle conf 0 age: 44 flags: 16
  [30] Program log: Insurance fixed: 0.0 ir: 0.10000000000000142
  [31] Program log: Group fixed: 0.010000000000001563 ir: 0.0 origination: 0.0
  [32] Program log: Plateau: 0.3999999999999986 Optimal: 0.3999999999999986 Max: 3.0
  [33] Program data: 7NzJP+9+iPkBq4O/zg5hoaIzYyukz7q/gSuAI8ryvn34CXK/yf8ydUA5FC9oL9g4hJbsvVEG8Vx5TCR3Qzgo+mZC2+v3IANKYU7/6/loOZc7Od0maeM9Sx+vz1hdwvo/h4TGySxyJojXHC7mfxJN9u3yqdK/XjpTPHcBtY+NqpVyEKHlsGGM0r4=
  [34] Program MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA consumed 91335 of 200000 compute units
  [35] Program MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA success
```

**Key Parameters Verified**:
- ✅ Program ID: `MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA` (Mainnet)
- ✅ Instruction: `LendingPoolAddBankKamino`
- ✅ Token Program: `TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb` (Token-2022)
- ⚠️ Warning: Mint has a permanent delegate (tokens may be seized at any time)
- ✅ Asset Weight Init: 0.85 (85%)
- ✅ Asset Weight Maint: 0.91 (91%)
- ✅ Deposit Limit: 100,000 USDG (100000000000 raw with 6 decimals)
- ✅ Asset Value Init Limit: $100,000 (100000 raw)
- ✅ Asset Tag: 3 (ASSET_TAG_KAMINO)
- ✅ Risk Tier: 0 (Collateral)
- ✅ Operational State: 1 (Operational)
