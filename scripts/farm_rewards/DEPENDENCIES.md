# Dependencies and Imports Used

This document lists all the dependencies used by `harvest_farm_rewards.ts` to help verify everything is available in the codebase.

## External Dependencies (from package.json)

✅ All available in the workspace:

```typescript
@solana/web3.js - PublicKey, Transaction, sendAndConfirmTransaction
@coral-xyz/anchor - BN, bs58
@solana/spl-token - TOKEN_PROGRAM_ID
@mrgnlabs/mrgn-common - createAssociatedTokenAccountIdempotentInstruction, getAssociatedTokenAddressSync
```

## Internal Dependencies (from local modules)

### From `lib/common-setup.ts`
✅ **Status**: Available and verified
```typescript
import { commonSetup } from "../lib/common-setup";
```
- Used to initialize the program with the "kamino" IDL version
- Supports all required IDL versions including "kamino"

### From `scripts/common/pdas.ts`
✅ **Status**: Available and verified
```typescript
import { deriveLiquidityVaultAuthority } from "./common/pdas";
```
- Used to derive the liquidity vault authority PDA
- Required for finding the Kamino obligation

### From `idl/marginfi_kamino.ts`
✅ **Status**: Available and verified
- The "kamino" version of the IDL is loaded automatically by `commonSetup`
- Contains the `kaminoHarvestReward` instruction
- Full instruction definition verified at lines 743-919

## PDA Derivation Functions

All PDA derivation functions are implemented directly in the script (no external dependencies):

1. ✅ `deriveGlobalFeeState` - Derives fee state PDA
2. ✅ `deriveUserState` - Derives Kamino user state PDA
3. ✅ `deriveBaseObligation` - Derives Kamino obligation PDA
4. ✅ `deriveFarmVaultsAuthority` - Derives farm vaults authority PDA
5. ✅ `deriveRewardVault` - Derives reward vault PDA
6. ✅ `deriveRewardTreasuryVault` - Derives treasury vault PDA

These are based on the patterns seen in the test file but are standalone implementations.

## Constants Used

### Hardcoded in Script
```typescript
FARMS_PROGRAM_ID = "FarmsPZpWu9i7Kky8tPN37rs2TpmMrAZrC7S7vJa91Hr"
KLEND_PROGRAM_ID = "KLend2g3cP87fffoy8q1mQqGKjrxjC8boSyAYavgmjD"
```

These match the values used in the test file and are correct for mainnet.

## IDL Instruction Verification

The `kaminoHarvestReward` instruction exists in `/idl/marginfi_kamino.ts`:

```typescript
{
  "name": "kaminoHarvestReward",
  "discriminator": [163, 202, 248, 141, 106, 20, 116, 5],
  "accounts": [
    "bank",
    "feeState",
    "destinationTokenAccount",
    "liquidityVaultAuthority",
    "userState",
    "farmState",
    "globalConfig",
    "rewardMint",
    "userRewardAta",
    "rewardsVault",
    "rewardsTreasuryVault",
    "farmVaultsAuthority",
    "scopePrices",
    "farmsProgram",
    "tokenProgram"
  ],
  "args": [
    { "name": "rewardIndex", "type": "u64" }
  ]
}
```

✅ All accounts are provided in the script
✅ Reward index parameter is passed as `BN`

## Missing Dependencies

❌ **None** - All required dependencies are available in the codebase.

## Potential Imports to Check (Optional)

If you want to see the source implementation of any helpers used in the test file, you might want to check:

1. **Kamino SDK Functions** (if needed for finding farm states):
   - Not imported in our script (we use manual PDA derivation)
   - Available at: `@kamino-finance/klend-sdk`
   - Used in test file for: `lendingMarketAuthPda`

2. **Kamino Farms IDL** (if needed for direct farm queries):
   - Not imported in our script
   - Referenced in test file: `../idls/kamino_farms.json`
   - Not needed for harvest operation

## Recommended: Helper Script for Finding Config Values

You might want to create a helper script to find the required config values:

```typescript
// Example: scripts/find_farm_config.ts
import { PublicKey } from "@solana/web3.js";
import { commonSetup } from "../lib/common-setup";

const BANK = new PublicKey("YOUR_BANK_HERE");

async function main() {
  const user = commonSetup(true, "MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA", 
                          "/.config/solana/id.json", undefined, "kamino");
  
  // Fetch bank
  const bank = await user.program.account.bank.fetch(BANK);
  console.log("Kamino Market:", bank.config.kaminoMarket?.toString());
  console.log("Kamino Reserve:", bank.config.kaminoReserve?.toString());
  
  // You would need Kamino SDK to fetch reserve and farm details
}
```

## Summary

✅ **All dependencies are satisfied**
✅ **All required functions are available**
✅ **IDL contains the required instruction**
✅ **Script is ready to use**

The only thing needed is to fill in the correct configuration values for your specific farm.

