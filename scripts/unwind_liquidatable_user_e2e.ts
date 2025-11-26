import {
  PublicKey,
} from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { composeRemainingAccounts } from "../lib/utils";
import { readFileSync } from "fs";
import { repay } from "./repay";
import { withdrawKamino } from "./kamino/withdraw_kamino";
import { withdraw } from "./withdraw";
import { closeAccount } from "./close_account";
import { closeBank } from "./close_bank";
import { Config, State } from "./create_liquidatable_user_e2e";

async function main() {
  const raw_config = readFileSync("liquidation_e2e_config.json", "utf8");
  const config = JSON.parse(raw_config) as Config;
  console.log("loaded config: " + config);
  const raw_state = readFileSync("liquidation_e2e_state.json", "utf8");
  const state = JSON.parse(raw_state) as State;
  console.log("loaded state: " + state);

  // 1. REPAY DEBT BY LIQUIDATEE
  const repayConfig = {
    PROGRAM_ID: config.PROGRAM_ID,
    BANK: state.debtBank,
    ACCOUNT: state.liquidator,
    AMOUNT: new BN(0), // doesn't matter, since we repay all
    REPAY_ALL: true,
    MINT: config.DEBT_MINT,
    ADD_COMPUTE_UNITS: false,
  };
  await repay(true, repayConfig, config.LIQUIDATEE_WALLET_PATH);

  // 2. WITHDRAW FROM KAMINO BANKS BY LIQUIDATEE
  let remainingAccounts: PublicKey[][] = [];
  for (let i = 0; i < 7; i++) {
    remainingAccounts.push([state.paddingBanks[i], config.COLLATERAL_ORACLE]);
  }

  let withdrawKaminoConfig = {
    PROGRAM_ID: config.PROGRAM_ID,
    BANK: state.kaminoBanks[0],
    ACCOUNT: state.liquidatee,
    AMOUNT: new BN(0), // doesn't matter, since we withdraw all
    WITHDRAW_ALL: true,
    BANK_MINT: config.COLLATERAL_MINT,
    KAMINO_RESERVE: config.KAMINO_RESERVE,
    KAMINO_MARKET: config.KAMINO_MARKET,
    RESERVE_ORACLE: config.KAMINO_RESERVE_ORACLE, 
    FARM_STATE: config.KAMINO_FARM_STATE,
    LUT: new PublicKey("FtQ5uKQvFoKQ27SWY15tgBeJQnGKmKGzWqDz7kGUbeiq"), // a liquidator-created LUT
    NEW_REMAINING: [],
    ADD_COMPUTE_UNITS: true,
  };

  for (let i = 0; i < 8; i++) {
    let fullRemainingAccounts = remainingAccounts;
    // Add all active kamino banks except the one to withdraw from
    for (let j = i + 1; j < 8; j++) {
      fullRemainingAccounts.push([state.kaminoBanks[j], config.COLLATERAL_ORACLE, config.KAMINO_RESERVE]);
    }
 
    withdrawKaminoConfig.BANK = state.kaminoBanks[i];
    withdrawKaminoConfig.NEW_REMAINING = composeRemainingAccounts(fullRemainingAccounts);
    await withdrawKamino(true, withdrawKaminoConfig, config.LIQUIDATEE_WALLET_PATH);
  }

  // 3. WITHDRAW FROM NON-KAMINO BANKS BY LIQUIDATEE
  let withdrawConfig = {
    PROGRAM_ID: config.PROGRAM_ID,
    ACCOUNT: state.liquidatee,
    BANK: state.paddingBanks[0],
    MINT: config.COLLATERAL_MINT,
    AMOUNT: new BN(0), // doesn't matter, since we withdraw all
    WITHDRAW_ALL: true,
    LUT: new PublicKey("FtQ5uKQvFoKQ27SWY15tgBeJQnGKmKGzWqDz7kGUbeiq"), // a liquidator-created LUT
    REMAINING: [],
    ADD_COMPUTE_UNITS: false,
  };

  for (let i = 0; i < 7; i++) {
    let fullRemainingAccounts = [];
    // Add all active padding (non-kamino) banks except the one to withdraw from
    for (let j = i + 1; j < 7; j++) {
      fullRemainingAccounts.push([state.paddingBanks[j], config.COLLATERAL_ORACLE]);
    }
 
    withdrawConfig.BANK = state.paddingBanks[i];
    withdrawConfig.REMAINING = fullRemainingAccounts;
    await withdraw(true, withdrawConfig, config.LIQUIDATEE_WALLET_PATH);
  }

  // 3. WITHDRAW FROM DEBT BANK BY LIQUIDATOR
  withdrawConfig.ACCOUNT = state.liquidator;
  withdrawConfig.BANK = state.debtBank;
  withdrawConfig.MINT = config.DEBT_MINT;
  withdrawConfig.REMAINING = [];
  await withdraw(true, withdrawConfig, config.LIQUIDATOR_WALLET_PATH);

  // 4. CLOSE LIQUIDATOR AND LIQUIDATEE ACCOUNTS
  await closeAccount(true, {PROGRAM_ID: config.PROGRAM_ID, ACCOUNT: state.liquidator}, config.LIQUIDATOR_WALLET_PATH);
  await closeAccount(true, {PROGRAM_ID: config.PROGRAM_ID, ACCOUNT: state.liquidatee}, config.LIQUIDATEE_WALLET_PATH);

  // 5. CLOSE ALL BANKS
  for (let i = 0; i < 8; i++) {
    await closeBank(true, {PROGRAM_ID: config.PROGRAM_ID, BANK: state.kaminoBanks[i]}, config.LIQUIDATOR_WALLET_PATH);
  }
  for (let i = 0; i < 7; i++) {
    await closeBank(true, {PROGRAM_ID: config.PROGRAM_ID, BANK: state.paddingBanks[i]}, config.LIQUIDATOR_WALLET_PATH);
  }
  await closeBank(true, {PROGRAM_ID: config.PROGRAM_ID, BANK: state.debtBank}, config.LIQUIDATOR_WALLET_PATH);

  console.log("Cleanup finished.");
}

main().catch((err) => {
  console.error(err);
});
