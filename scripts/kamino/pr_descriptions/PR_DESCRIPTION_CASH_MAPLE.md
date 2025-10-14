# Add Kamino CASH Bank (Maple Market)

## Summary
Adds a new Kamino-integrated bank for **CASH** on the **Maple Market** to the marginfi lending group.

**Asset**: CASH
**Mint**: `CASHx9KJUStyftLFWGvEVf59SGeG9sh5FfcnZMVPCASH`
**Bank Seed**: 301 (Kamino banks)
**Asset Tag**: 3 (ASSET_TAG_KAMINO)
**Market**: Maple Market

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
| **Seed** | 301 | Kamino Maple Market banks |

### Oracle Configuration
| Parameter | Value | Verification |
|-----------|-------|--------------|
| **Bank Oracle** | `HxQbxDh4SGYi94LrgS6VuSdoBnRZamBvHgdiVTG8yomf` | [Solscan](https://solscan.io/account/HxQbxDh4SGYi94LrgS6VuSdoBnRZamBvHgdiVTG8yomf) |
| **Oracle Type** | Switchboard (kaminoSwitchboardPull) | Switchboard price feed (same as Main Market CASH bank) |
| **Oracle Max Age** | 300 seconds | |
| **Oracle Max Confidence** | 0 (default 10%) | |

**Note**: Using `kaminoSwitchboardPull` since the existing CASH banks use Switchboard. Kamino internally uses Scope oracle `3NJYftD5sjVfxSnUdZ1wVML8f3aC6mp1CXCL6L7TnU8C` for obligation operations.

### Risk Parameters
| Parameter | Value | Notes |
|-----------|-------|-------|
| **Asset Weight Init** | 0.50 (50%) | Conservative collateral weight for CASH (same as Main Market) |
| **Asset Weight Maint** | 0.60 (60%) | Conservative collateral weight for CASH (same as Main Market) |
| **Deposit Limit** | 2,500,000 CASH | Raw: `new BN(2_500_000 * 10 ** 6)` - same as Main Market CASH bank |
| **Total Asset Value Init Limit** | $2,500,000 | Raw: `new BN(2_500_000)` - same as Main Market CASH bank |
| **Operational State** | Operational | |
| **Risk Tier** | Collateral | |
| **Config Flags** | 1 | |

### Kamino Integration
| Parameter | Value | Verification |
|-----------|-------|--------------|
| **Kamino Market** | `6WEGfej9B9wjxRs6t4BYpb9iCXd8CpTpJ8fVSNzHCC5y` | Maple Market |
| **Kamino Reserve** | `FSMWJh3geL7dgeMauFWkjCpU2pvXocGpXcUpVsMQULki` | [Solscan](https://solscan.io/account/FSMWJh3geL7dgeMauFWkjCpU2pvXocGpXcUpVsMQULki) |
| **Farm Collateral** | `8ZwaHVGS9t34U4FKNC5VmiynRmz8QPGvfMfwu87dGCth` | Active farm rewards |
| **Reserve Scope Oracle** | `3NJYftD5sjVfxSnUdZ1wVML8f3aC6mp1CXCL6L7TnU8C` | Used for init_obligation |

**Note**: This is the second CASH Kamino bank. The first CASH bank (seed 300) is on the Main Market. Both use the same conservative 50%/60% collateral weights and 2.5M deposit limits.

---

## 🔗 Verification Links

### On-Chain Verification
- **Existing CASH Bank (Main Market, non-Kamino)**: [Solscan](https://solscan.io/account/F4brCRJHx8epWah7p8Ace4ehutphxYZ1ctRq2LS3iiBh#accountData)
- **Existing CASH Kamino Bank (Main Market, seed 300)**: [Solscan](https://solscan.io/account/HnKy41QrJNFLJmBGtgLWpy8NissUsNLKRMibRwsNhDnF#accountData)
- **Kamino CASH Bank (Maple Market)**: *Will be created after transaction execution*
- **Kamino Reserve (Maple Market)**: [Solscan](https://solscan.io/account/FSMWJh3geL7dgeMauFWkjCpU2pvXocGpXcUpVsMQULki#accountData)
- **CASH Mint**: [Solscan](https://solscan.io/account/CASHx9KJUStyftLFWGvEVf59SGeG9sh5FfcnZMVPCASH)
- **Bank Oracle (Switchboard)**: [Solscan](https://solscan.io/account/HxQbxDh4SGYi94LrgS6VuSdoBnRZamBvHgdiVTG8yomf)
- **Kamino Maple Market**: [Kamino App](https://kamino.com/borrow/reserve/6WEGfej9B9wjxRs6t4BYpb9iCXd8CpTpJ8fVSNzHCC5y/FSMWJh3geL7dgeMauFWkjCpU2pvXocGpXcUpVsMQULki)

---

## 🚀 Transaction

### Step 1: Add Bank

**Derived Bank Address**: `4YPGUhxmAXgoGDRkg68zGnbGrV2xCgaoqQSfcZCjFhon`

**Base58 Transaction**:
```
3TXwb8T2kyg7hY4DanwQ9m3UJGqUAJxxo99vevVQLSvNoCQFhmmjZyBBVkEhHGXe78hv9Z4W1jSgvV6PBHpCuD3vW6XnT2pKsbWCCPSzGBSbuvoT2NvDN1Yzde1s9Wk3KafyfRCRVijowKkhizRGhH1Xnt3SsY5MfotgvCea5Jy53H8HrRCsvNbUK8zAFytArYbZ5RaU8fBKe12ei4PtrVkndMJy34sTZZ3c458Pwwq11RaVB6WRXdyaDX7JB5uEa45YcfjTJUVxC3sUqkC9nuP7u43sbE1HXQrogmCxXMCjbe78sJb14DK2NvPTXuo2xyMRNX56zR7ZaPkdU3ahndu9eXsKTv1PK3Zpm3KXUokixWvAAfsDt4uC4ZQey37LQmP9rhBm8Z4dYR1FGGjbZxXTrAGHfWLcjf4U2TtByRHx64oU7eQSuKARdVqDsNtgdcJcKQh5qf1BX67heFKntz4DFnvbsCvYiZTKUhkAyVMttfbhUi86xGSCEYv51d8dYVAmkUCpWdHQ5jwr4KxR3kBTh9x1MGab9DKtwpx8uJ1oYTZ67VJZk3rM44drxQybki5WFJmnHPCRvJXPuxzzMiQmjZ46sKztwY52foGeG1GWT68UBY5KRuKVbAAFnYv7KqkC4k3Qy4DDgWvrrHaDpodVuBZU9GEW4FLzH9Ltc5XVAsHRmUJDrwBjtZYvmMVZys8cmS7VeZNce8QEqNHJdNhBVSSrEQqPni2JDDCFoYHJHv7yutvMeSfVqi1zYgFkp3aEN7mbzCh94kqpQ3KyrYpe5czr5xDFUDqm8N48u2QJSuw9thaCqWBu8NWQuL6sskBY2Y4cHNJY88rc2hXuMAcPzfzQH9swNwc7oXQtFwa4ud9v9aqmTKvYF21x1CpseidjY1sJ36ruPppKnAYPGJehvHZwxRS7BD5cadavJ7u1WBPaKWmPegeuLUxdJ47Sm4Pas8GRTW7yosGhmK6MWXCQecfH7HSz1Vug6PXgZ8P5HgV2vB
```

### Simulation Results

**Status**: ✅ Simulation successful

**Compute Units**: 90,199 / 200,000

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
  [33] Program data: 7NzJP+9+iPkBq4O/zg5hoaIzYyukz7q/gSuAI8ryvn34CXK/yf8ydUA5FC9oL9g4hJbsvVEG8Vx5TCR3Qzgo+mZC2+v3IANKYTSdPjo0KGbqd2soV51QZnccC2yp7XXF02Ww+jv8PVxppdthqvFWnacSNMwAHBIwEumDEWeE757ZWOtSXxn6iJY=
  [34] Program MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA consumed 90199 of 200000 compute units
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

### Step 2: Initialize Obligation
After the bank is created via Squads, run:
```bash
npx tsx scripts/kamino/init_bank_obligation.ts
```

This creates the Kamino obligation and must be run locally with your wallet (not via Squads).

---

## 📝 Notes

- This is the **second CASH Kamino bank** (Maple Market). The first CASH Kamino bank (seed 300) is on the Main Market.
- **Risk parameters match the Main Market CASH bank**: 50%/60% collateral weights, 2.5M deposit limit, $2.5M TVL limit
- CASH uses **Token-2022** with a permanent delegate (tokens may be seized)
- Marginfi uses **Switchboard oracle** for the bank, while Kamino internally uses **Scope oracle** for obligation operations
- Active farm rewards are available on this reserve
- Remember to run `init_bank_obligation.ts` after adding the bank!
