# Drift Integration Staging Scripts - Plan

## Overview

Scripts for testing drift integration on staging program using drift-integration IDL.

## Tasks

### Stage 1: Add Drift Banks

- [ ] **Script**: `add_drift_bank.ts`
  - Combines two operations: add bank + init user
  - Uses external config files for each bank
  - Config file per bank stored in `configs/` subdirectory

### Stage 2: Gather Drift Market Data

- [ ] Collect drift market information needed for bank configs
- [ ] Helper scripts or manual process (TBD)

### Stage 3: Mainnet Testing - Account Setup

- [ ] **Script**: `create_marginfi_account.ts`
  - Creates marginfi account for local keypair
  - One-time setup for testing

### Stage 4: Mainnet Testing - Deposits & Withdrawals

- [ ] **Script**: `deposit.ts`

  - Deposit to drift banks
  - Handle rewards if present
  - Reference for frontend implementation

- [ ] **Script**: `withdraw.ts`
  - Withdraw from drift banks
  - Handle rewards if present
  - Reference for frontend implementation

### Stage 5: Rewards

- [ ] **Script**: `withdraw_rewards.ts`
  - Withdraw accumulated rewards
  - Handle reward logic in deposit/withdraw scripts
  - Reference for backend reward claiming implementation

## Reference Materials

- Source: `~/projects/drift-integration`
- IDL: drift-integration marginfi program with drift features
- Tests: TypeScript tests in drift-integration repo

## Notes

- All scripts use staging program
- Each script includes simulation before execution
- Config-driven approach for bank creation
- Scripts serve as frontend implementation reference
