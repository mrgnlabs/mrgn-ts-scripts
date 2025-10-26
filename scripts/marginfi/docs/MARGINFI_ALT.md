# Marginfi Address Lookup Table (ALT)

## Overview

This Address Lookup Table contains common accounts used across all Marginfi bank listing transactions. Using this ALT reduces transaction size by ~279 bytes (9 accounts × 31 bytes per account).

## ALT Information

**Address:** `J2bkica3Gesfw4iudrdstMwmJXLCHCfaPgA9XNtDBTvE`

**Created:** Transaction `9whgYE1QCxrS356oZiyigKHvstM3hYAzCDiC2Bay8EqDwtNkADuAY2u278Wxs6iYk8bLN2AyoNt1NKVrdSUanMw`

**Authority:** `6QXw5bWtMcHBVPoqedh7hdwnetfQyKSZ19Vh1xrCvmym`

**Slot Created:** 375921376

**Cost:** ~0.003290 SOL

## Accounts in ALT (9 total)

### Core Programs (3)

| Index | Address | Description |
|-------|---------|-------------|
| 0 | `MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA` | Marginfi program (mainnet) |
| 1 | `TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA` | SPL Token program |
| 2 | `11111111111111111111111111111111` | System program |

### Marginfi Accounts (3)

| Index | Address | Description |
|-------|---------|-------------|
| 3 | `4qp6Fx6tnZkY5Wropq9wUYgtFxXKwE6viZxFHg3rdAG8` | Marginfi mainnet lending group |
| 4 | `CYXEgwbPHu2f9cY3mcUkinzDoDcsSan7myh1uBvYRbEw` | Squads multisig (admin/payer) |
| 5 | `HoMNdUF3RDZDPKAARYK1mxcPFfUnPjLmpKYibZzAijev` | Common account (TBD: verify purpose) |

### Additional Programs (3)

| Index | Address | Description |
|-------|---------|-------------|
| 6 | `ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL` | Associated Token program |
| 7 | `TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb` | Token 2022 program (for future banks) |
| 8 | `SysvarRent111111111111111111111111111111111` | Rent sysvar |

## Usage

The ALT is automatically used by `add_bank_from_config.ts` when generating bank listing transactions. The script creates versioned transactions (v0) that reference these common accounts by index rather than including their full 32-byte addresses.

### Benefits

- **Transaction Size Reduction:** ~279 bytes saved per transaction
- **Cost Efficiency:** Reduced transaction fees
- **Squads Compatibility:** Smaller transactions work better with multisig overhead
- **Future-Proof:** Includes Token 2022 program for future asset types

### Per-Bank Unique Accounts

The following accounts are unique to each bank and NOT in the ALT:
- Bank mint address
- Bank PDA address
- Oracle address
- Bank vault accounts (3 accounts)
- Bank fee vault accounts (3 accounts)

This means each bank listing transaction includes:
- 9 accounts from ALT (1 byte each = 9 bytes)
- ~9 unique accounts (32 bytes each = 288 bytes)
- Total: ~297 bytes for accounts vs 576 bytes without ALT

## Maintenance

To add more accounts to this ALT in the future, use:

```typescript
import { AddressLookupTableProgram } from "@solana/web3.js";

const extendIx = AddressLookupTableProgram.extendLookupTable({
  payer: authorityKeypair.publicKey,
  authority: authorityKeypair.publicKey,
  lookupTable: new PublicKey("J2bkica3Gesfw4iudrdstMwmJXLCHCfaPgA9XNtDBTvE"),
  addresses: [newAccount1, newAccount2, ...],
});
```

**Note:** Authority is required to extend or modify the ALT.

## Verification

View the ALT on-chain:
- **Solscan:** https://solscan.io/account/J2bkica3Gesfw4iudrdstMwmJXLCHCfaPgA9XNtDBTvE
- **Solana Explorer:** https://explorer.solana.com/address/J2bkica3Gesfw4iudrdstMwmJXLCHCfaPgA9XNtDBTvE
