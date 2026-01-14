# Harvest Farm Rewards Script

## Overview

The `harvest_farm_rewards.ts` script harvests rewards from Kamino Farms attached to marginfi banks on mainnet. This script is designed to be run by fee administrators to collect farm rewards that have accrued from bank positions.

## Location

```
/scripts/harvest_farm_rewards.ts
```

## What It Does

1. **Harvests Rewards**: Calls the `kaminoHarvestReward` instruction on the marginfi program
2. **Sends to Fee Wallet**: Automatically routes harvested rewards to the global fee wallet
3. **Creates ATAs**: Automatically creates required Associated Token Accounts if they don't exist
4. **Supports Multisig**: Can generate transactions for multisig wallets (like Squads)

## Prerequisites

Before running this script, you need to gather the following information:

### Required Information

1. **BANK** - The marginfi bank address that has a Kamino farm attached
   - Find this from your bank deployment records
   - Must be a bank with `config.kaminoMarket` set

2. **FARM_STATE** - The Kamino farm state address
   - This is the farm associated with the bank's reserve
   - Can be found in the bank's reserve data on Kamino

3. **GLOBAL_CONFIG** - The Kamino farms global config address
   - This is a global Kamino farms parameter
   - Same for all farms on mainnet

4. **REWARD_MINT** - The SPL token mint address for the reward token
   - The token being distributed as rewards (e.g., KMNO, JTO, etc.)

5. **REWARD_INDEX** - The index of the reward in the farm's reward list
   - Usually `0` for the first/primary reward
   - Can be `1`, `2`, etc. for additional rewards

### How to Find These Values

#### Finding FARM_STATE
```typescript
// From the bank account
const bankAccount = await program.account.bank.fetch(BANK_ADDRESS);
const reserve = bankAccount.config.kaminoReserve;

// Fetch the reserve to get farm state
const reserveAccount = await kaminoProgram.account.reserve.fetch(reserve);
const farmState = reserveAccount.farmCollateral; // or farmDebt depending on position type
```

#### Finding GLOBAL_CONFIG
This is typically a known constant for Kamino on mainnet. Check Kamino's documentation or SDK.

#### Finding REWARD_MINT
```typescript
// From the farm state
const farmStateAccount = await farmProgram.account.farmState.fetch(FARM_STATE);
const rewards = farmStateAccount.rewardInfos;
const rewardMint = rewards[REWARD_INDEX].token.mint; // Get the mint for the specific reward index
```

## Configuration

Edit the `config` object at the top of the script:

```typescript
const config: Config = {
  PROGRAM_ID: "MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA", // Mainnet marginfi
  
  // Replace these with actual values
  BANK: new PublicKey("YOUR_BANK_ADDRESS"),
  FARM_STATE: new PublicKey("YOUR_FARM_STATE_ADDRESS"),
  GLOBAL_CONFIG: new PublicKey("YOUR_GLOBAL_CONFIG_ADDRESS"),
  REWARD_MINT: new PublicKey("YOUR_REWARD_MINT_ADDRESS"),
  REWARD_INDEX: 0, // Usually 0 for first reward
  
  // Optional: for multisig
  // MULTISIG: new PublicKey("YOUR_MULTISIG_ADDRESS"),
};
```

## Running the Script

### Direct Execution
```bash
cd /Users/fenrir/Documents/Github/p0dotxyz/mrgn-ts-scripts
ts-node scripts/harvest_farm_rewards.ts
```

### For Multisig (Squads)
1. Set `sendTx = false` at the top of the script
2. Add your `MULTISIG` address to the config
3. Run the script to generate a base58-encoded transaction
4. Import the transaction into Squads for approval

## Accounts Derived Automatically

The script automatically derives the following PDAs:

| Account | Derivation |
|---------|------------|
| `feeState` | PDA from "feestate" seed |
| `liquidityVaultAuthority` | PDA from bank |
| `obligation` | Kamino obligation PDA |
| `userState` | Kamino farm user state |
| `farmVaultsAuthority` | Kamino farm authority |
| `rewardsVault` | Kamino reward vault |
| `rewardsTreasuryVault` | Kamino treasury vault |
| `destinationAta` | ATA for fee wallet |
| `userRewardAta` | ATA for vault authority |

## Important Notes

1. **Fee Admin Only**: This instruction can only be called by the fee admin
2. **Kamino Banks Only**: Only works with banks that have Kamino markets attached
3. **Reward Must Exist**: The farm must have been initialized with rewards
4. **Accrued Rewards**: Only harvests rewards that have already accrued
5. **Automatic Distribution**: Rewards go directly to the global fee wallet

## IDL Version

This script uses the `"kamino"` version of the marginfi IDL, which includes the `kaminoHarvestReward` instruction. This is loaded via:

```typescript
commonSetup(sendTx, config.PROGRAM_ID, walletPath, multisig, "kamino")
```

## Instruction Details

The `kaminoHarvestReward` instruction:
- **Discriminator**: `[163, 202, 248, 141, 106, 20, 116, 5]`
- **Parameters**: `reward_index: u64`
- **Access**: Fee admin only (checked via `feeState.globalFeeAdmin`)

## Error Handling

Common errors and solutions:

| Error | Cause | Solution |
|-------|-------|----------|
| "ConstraintTokenOwner" | Destination ATA wrong owner | Ensure destination is owned by `globalFeeWallet` |
| "AccountNotInitialized" | User state doesn't exist | Farm may not be initialized for this bank |
| "This bank does not have a Kamino market" | Not a Kamino bank | Only Kamino banks support farm rewards |
| Insufficient permissions | Wrong signer | Must be signed by fee admin wallet |

## Testing

Before running on mainnet:
1. Verify all addresses in the config are correct
2. Check the bank has a Kamino market configured
3. Verify farm has rewards available to harvest
4. Test with `sendTx = false` first to review the transaction

## Related Files

- `/scripts/farm_rewards/kamino-instructions.ts` - Instruction builders (reference)
- `/scripts/farm_rewards/k13_KfarmsHarvestReward.spec.ts` - Test cases (reference)
- `/idl/marginfi_kamino.ts` - IDL with harvest reward instruction
- `/lib/common-setup.ts` - Common setup utilities

## Support

For issues or questions:
1. Check the Kamino SDK documentation
2. Review the test file for working examples
3. Verify all addresses are correct for mainnet
4. Ensure wallet has fee admin privileges

