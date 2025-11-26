import {
  PublicKey,
} from "@solana/web3.js";
import { loadKeypairFromFile } from "../scripts/utils";
import { initGroup } from "./init_group";
import { initAccount } from "./init_account";
import { addKaminoBank } from "./kamino/add_bank";
import { initKaminoObligation } from "./kamino/init_bank_obligation";
import { BN } from "@coral-xyz/anchor";
import { depositKamino } from "./kamino/deposit_kamino";
import { addBank, ORACLE_TYPE_PYTH } from "./add_bank";
import { depositRegular } from "./deposit_regular";
import { borrow } from "./borrow";
import { composeRemainingAccounts } from "../lib/utils";
import { bankConfigOptDefault, configBank } from "./config_bank";
import { bigNumberToWrappedI80F48 } from "@mrgnlabs/mrgn-common";
import { pulseHealth } from "./health_pulse";
import { writeFileSync } from "fs";

export type Config = {
  PROGRAM_ID: string;
  LIQUIDATOR_WALLET_PATH: string;
  LIQUIDATEE_WALLET_PATH: string;
  COLLATERAL_MINT: PublicKey;
  COLLATERAL_ORACLE: PublicKey;
  DEBT_MINT: PublicKey;
  DEBT_ORACLE: PublicKey;
  KAMINO_RESERVE: PublicKey;
  KAMINO_MARKET: PublicKey;
  KAMINO_RESERVE_ORACLE: PublicKey;
  KAMINO_FARM_STATE: PublicKey;
};

export type State = {
  marginfiGroup: PublicKey;
  liquidator: PublicKey;
  liquidatee: PublicKey;
  debtBank: PublicKey;
  kaminoBanks: PublicKey[];
  kaminoObligations: PublicKey[];
  paddingBanks: PublicKey[];
};

const config: Config = {
  PROGRAM_ID: "stag8sTKds2h4KzjUw3zKTsxbqvT4XKHdaR9X9E6Rct",
  LIQUIDATOR_WALLET_PATH: "/.config/stage/id.json",
  LIQUIDATEE_WALLET_PATH: "/.config/arena/id.json",
  COLLATERAL_MINT: new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"), // usdc
  COLLATERAL_ORACLE: new PublicKey("Dpw1EAVrSB1ibxiDQyTAW6Zip3J4Btk2x4SgApQCeFbX"), // usdc PythPull
  DEBT_MINT: new PublicKey("DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263"), // bonk
  DEBT_ORACLE: new PublicKey("DBE3N8uNjhKPRHfANdwGvCZghWXyLPdqdSbEW2XFwBiX"), // bonk PythPull
  KAMINO_RESERVE: new PublicKey("D6q6wuQSrifJKZYpR1M8R4YawnLDtDsMmWM1NbBmgJ59"), // usdc
  KAMINO_MARKET: new PublicKey("7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF"), // main
  KAMINO_RESERVE_ORACLE: new PublicKey("3t4JZcueEzTbVP6kLxXrL3VpWx45jDer4eqysweBchNH"), 
  KAMINO_FARM_STATE: new PublicKey("JAvnB9AKtgPsTEoKmn24Bq64UMoYcrtWtq42HHBdsPkh"),
};

async function main() {
  const liquidatorWallet = loadKeypairFromFile(process.env.HOME + config.LIQUIDATOR_WALLET_PATH);
  const liquidateeWallet = loadKeypairFromFile(process.env.HOME + config.LIQUIDATEE_WALLET_PATH);
  console.log("liquidator: " + liquidatorWallet.publicKey);
  console.log("liquidatee: " + liquidateeWallet.publicKey);

  // 1. INIT GROUP
  const marginfiGroup = await initGroup(true, {PROGRAM_ID: config.PROGRAM_ID, ADMIN_KEY: liquidatorWallet.publicKey}, config.LIQUIDATOR_WALLET_PATH);

  // 2. INIT MARGINFI ACCOUNTS
  const liquidator = await initAccount(true, {PROGRAM_ID: config.PROGRAM_ID, GROUP: marginfiGroup, AUTHORITY: liquidatorWallet.publicKey}, config.LIQUIDATOR_WALLET_PATH);
  const liquidatee = await initAccount(true, {PROGRAM_ID: config.PROGRAM_ID, GROUP: marginfiGroup, AUTHORITY: liquidateeWallet.publicKey}, config.LIQUIDATEE_WALLET_PATH);

  // 3. ADD KAMINO (USDC) BANKS
  let kaminoBankConfig = {
    PROGRAM_ID: config.PROGRAM_ID,
    GROUP_KEY: marginfiGroup,
    ORACLE: config.COLLATERAL_ORACLE,
    ORACLE_TYPE: { kaminoPythPush: {} },
    ADMIN: liquidatorWallet.publicKey,
    BANK_MINT: config.COLLATERAL_MINT,
    KAMINO_RESERVE: config.KAMINO_RESERVE,
    KAMINO_MARKET: config.KAMINO_MARKET,
    SEED: 0,
  };
  let kaminoBanks = [];
  for (let i = 0; i < 8; i++) {
    kaminoBankConfig.SEED = i;
    kaminoBanks.push(await addKaminoBank(true, kaminoBankConfig, config.LIQUIDATOR_WALLET_PATH));
  }

  // 4. INIT KAMINO OBLIGATIONS
  let kaminoObligationConfig = {
    PROGRAM_ID: config.PROGRAM_ID,
    GROUP_KEY: marginfiGroup,
    ADMIN: liquidatorWallet.publicKey,
    BANK_MINT: config.COLLATERAL_MINT,
    KAMINO_RESERVE: config.KAMINO_RESERVE,
    KAMINO_MARKET: config.KAMINO_MARKET,
    RESERVE_ORACLE: config.KAMINO_RESERVE_ORACLE, 
    FARM_STATE: config.KAMINO_FARM_STATE,
    SEED: 0,
  };
  let kaminoObligations = [];
  for (let i = 0; i < 8; i++) {
    kaminoObligationConfig.SEED = i;
    kaminoObligations.push(await initKaminoObligation(true, kaminoObligationConfig, config.LIQUIDATOR_WALLET_PATH));
  }

  // 5. DEPOSIT TO ALL KAMINO BANKS BY LIQUIDATEE
  let kaminoDepositConfig = {
    PROGRAM_ID: config.PROGRAM_ID,
    BANK: kaminoBanks[0],
    ACCOUNT: liquidatee,
    AMOUNT: new BN(1 * 10 ** 5), // 0.1 USDC
    BANK_MINT: config.COLLATERAL_MINT,
    KAMINO_RESERVE: config.KAMINO_RESERVE,
    KAMINO_MARKET: config.KAMINO_MARKET,
    RESERVE_ORACLE: config.KAMINO_RESERVE_ORACLE, 
    FARM_STATE: config.KAMINO_FARM_STATE,
  };
  for (let i = 0; i < 8; i++) {
    kaminoDepositConfig.BANK = kaminoBanks[i];
    await depositKamino(true, kaminoDepositConfig, config.LIQUIDATEE_WALLET_PATH);
  }

  // 6. ADD 1 DEBT BANK AND 7 MORE COLLATERAL BANKS (padding up to a maximum of 16 open positions)
  let bankConfig = {
    PROGRAM_ID: config.PROGRAM_ID,
    GROUP_KEY: marginfiGroup,
    ORACLE: config.DEBT_ORACLE,
    ORACLE_TYPE: ORACLE_TYPE_PYTH,
    ADMIN: liquidatorWallet.publicKey,
    BANK_MINT: config.DEBT_MINT,
    SEED: 0,
  };
  const debtBank = await addBank(true, bankConfig, config.LIQUIDATOR_WALLET_PATH);

  let paddingBanks = [];
  bankConfig.BANK_MINT = config.COLLATERAL_MINT;
  bankConfig.ORACLE = config.COLLATERAL_ORACLE;
  for (let i = 8; i < 15; i++) {
    bankConfig.SEED = i;
    paddingBanks.push(await addBank(true, bankConfig, config.LIQUIDATOR_WALLET_PATH));
  }

  // 7. DEPOSIT TO DEBT BANK BY LIQUIDATOR AND TO PADDING BANKS - BY LIQUIDATEE
  let regularDepositConfig = {
    PROGRAM_ID: config.PROGRAM_ID,
    BANK: debtBank,
    ACCOUNT: liquidator,
    AMOUNT: new BN(50000 * 10 ** 5), // 50'000 BONK (** 5 decimals)
    MINT: config.DEBT_MINT,
  };
  await depositRegular(true, regularDepositConfig, config.LIQUIDATOR_WALLET_PATH);

  regularDepositConfig.ACCOUNT = liquidatee;
  regularDepositConfig.MINT = config.COLLATERAL_MINT;
  regularDepositConfig.AMOUNT = new BN(1 * 10 ** 5); // 0.1 USDC
  for (let i = 0; i < 7; i++) {
    regularDepositConfig.BANK = paddingBanks[i];
    await depositRegular(true, regularDepositConfig, config.LIQUIDATEE_WALLET_PATH);
  }

  // 8. BORROW FROM DEBT BANK BY LIQUIDATEE
  let remainingAccounts: PublicKey[][] = [];
  for (let i = 0; i < 8; i++) {
    remainingAccounts.push([kaminoBanks[i], config.COLLATERAL_ORACLE, config.KAMINO_RESERVE]);
  }
  for (let i = 0; i < 7; i++) {
    remainingAccounts.push([paddingBanks[i], config.COLLATERAL_ORACLE]);
  }
  remainingAccounts.push([debtBank, config.DEBT_ORACLE]);

  let borrowConfig = {
    PROGRAM_ID: config.PROGRAM_ID,
    BANK: debtBank,
    ACCOUNT: liquidatee,
    AMOUNT: new BN(50000 * 10 ** 5), // 50k BONK
    MINT: config.DEBT_MINT,
    ADD_COMPUTE_UNITS: true,
    KAMINO_RESERVE: config.KAMINO_RESERVE,
    KAMINO_MARKET: config.KAMINO_MARKET,
    RESERVE_ORACLE: config.KAMINO_RESERVE_ORACLE, 
    FARM_STATE: config.KAMINO_FARM_STATE,
    NEW_REMAINING: composeRemainingAccounts(remainingAccounts),
  };

  await borrow(true, borrowConfig, config.LIQUIDATEE_WALLET_PATH);

  // 9. SET ALL COLLATERAL BANKS' ASSET WEIGHT TO 0.1 TO RENDER LIQUIDATEE UNHEALTHY
  let updatedBankConfig = bankConfigOptDefault();
  updatedBankConfig.assetWeightInit = bigNumberToWrappedI80F48(0.1);
  updatedBankConfig.assetWeightMaint = bigNumberToWrappedI80F48(0.1);

  let configBankConfig = {
    PROGRAM_ID: config.PROGRAM_ID,
    ADMIN: liquidatorWallet.publicKey,
    LUT: new PublicKey("CQ8omkUwDtsszuJLo9grtXCeEyDU4QqBLRv9AjRDaUZ3"), // copied from config_bank.ts
    BANKS: [],
  };

  // config all banks in bulk
  let bankEntries = []
  for (let i = 0; i < 8; i++) {
    bankEntries.push({
      bank: kaminoBanks[i],
      config: updatedBankConfig,
    });
  }
  for (let i = 0; i < 7; i++) {
    bankEntries.push({
      bank: paddingBanks[i],
      config: updatedBankConfig,
    });
  }
  configBankConfig.BANKS = bankEntries;
  await configBank(true, configBankConfig, config.LIQUIDATOR_WALLET_PATH);

  // 10. CONFIRM LIQUIDATEE IS LIQUIDATABLE NOW
  const pulseHealthConfig = {
    PROGRAM_ID: config.PROGRAM_ID,
    ACCOUNT: liquidatee,
    LUT: new PublicKey("CQ8omkUwDtsszuJLo9grtXCeEyDU4QqBLRv9AjRDaUZ3"), // copied from health_pulse.ts
  }
  await pulseHealth(pulseHealthConfig, config.LIQUIDATEE_WALLET_PATH);

  console.log("Account " + liquidatee + " is now liquidatable.");

  writeJsonFile(
    "liquidation_e2e_config.json",
    serializeConfig(config)
  );

  const state = {
    marginfiGroup: pkToString(marginfiGroup),
    liquidator: pkToString(liquidator),
    liquidatee: pkToString(liquidatee),
    debtBank: pkToString(debtBank),
    kaminoBanks: kaminoBanks.map(pkToString),
    kaminoObligations: kaminoObligations.map(pkToString),
    paddingBanks: paddingBanks.map(pkToString),
  };

  writeJsonFile(
    "liquidation_e2e_state.json",
    state
  );
}

function pkToString(pk: PublicKey | string): string {
  return typeof pk === "string" ? pk : pk.toBase58();
}

function serializeConfig(config: Config): any {
  return {
    PROGRAM_ID: config.PROGRAM_ID,
    LIQUIDATOR_WALLET_PATH: config.LIQUIDATOR_WALLET_PATH,
    LIQUIDATEE_WALLET_PATH: config.LIQUIDATEE_WALLET_PATH,
    COLLATERAL_MINT: pkToString(config.COLLATERAL_MINT),
    COLLATERAL_ORACLE: pkToString(config.COLLATERAL_ORACLE),
    DEBT_MINT: pkToString(config.DEBT_MINT),
    DEBT_ORACLE: pkToString(config.DEBT_ORACLE),
    KAMINO_RESERVE: pkToString(config.KAMINO_RESERVE),
    KAMINO_MARKET: pkToString(config.KAMINO_MARKET),
    KAMINO_RESERVE_ORACLE: pkToString(config.KAMINO_RESERVE_ORACLE),
    KAMINO_FARM_STATE: pkToString(config.KAMINO_FARM_STATE),
  };
}

function writeJsonFile(path: string, obj: any) {
  const json = JSON.stringify(obj, null, 2);
  writeFileSync(path, json);
  console.log(`✔ wrote ${path}`);
}

main().catch((err) => {
  console.error(err);
});
