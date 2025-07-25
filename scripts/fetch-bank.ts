import { PublicKey } from "@solana/web3.js";
import {
  getAccount,
  TOKEN_2022_PROGRAM_ID,
  wrappedI80F48toBigNumber,
} from "@mrgnlabs/mrgn-common";
import type { WrappedI80F48 } from "@mrgnlabs/mrgn-common";
import BigNumber from "bignumber.js";
import { commonSetup } from "../lib/common-setup";
import { Marginfi } from "../idl/marginfi";
import { Program } from "@coral-xyz/anchor";

// If true, prints this bank's settings in a format to be copy-pasted into add_bank
const printForCopy = false;

type Config = {
  PROGRAM_ID: string;
  BANKS: PublicKey[];
};

const config: Config = {
  PROGRAM_ID: "MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA",
  BANKS: [
    new PublicKey("CCKtUs6Cgwo4aaQUmBPmyoApH2gUDErxNZCAntD6LYGh"),
    // new PublicKey("CCKtUs6Cgwo4aaQUmBPmyoApH2gUDErxNZCAntD6LYGh"),
  ],
};

async function printBankInfo(program: Program<Marginfi>, bankKey: PublicKey) {
  const bank = await program.account.bank.fetch(bankKey);
  const mintInfo = await program.provider.connection.getAccountInfo(bank.mint);
  const isT22 = mintInfo.owner.toString() === TOKEN_2022_PROGRAM_ID.toString();
  const decimals = bank.mintDecimals;

  // Typed helpers for fixed-point conversion
  const toBN = (x: WrappedI80F48): BigNumber => wrappedI80F48toBigNumber(x);
  const toStr = (x: WrappedI80F48): string => toBN(x).toString();

  // Formatting helpers
  const formatBN = (bn: BigNumber, dp = 2): string => bn.toFormat(dp);

  console.groupCollapsed(`Bank: ${bankKey.toString()}`);

  // Metrics
  console.log("Metrics:");
  console.table([
    { Property: "is T22 Mint", Value: isT22 },
    { Property: "Group", Value: bank.group.toString() },
    { Property: "Mint", Value: bank.mint.toString() },
    { Property: "Mint Decimals", Value: decimals },
    { Property: "Bank Flags", Value: bank.flags.toNumber() },
    { Property: "Config Flags", Value: bank.config.configFlags },
    { Property: "Risk Tier", Value: JSON.stringify(bank.config.riskTier) },
    {
      Property: "Operating Mode",
      Value: JSON.stringify(bank.config.operationalState),
    },
    { Property: "Oracle Max Age (secs)", Value: bank.config.oracleMaxAge },
  ]);

  // Weights
  console.log("Weights:");
  console.table([
    { Metric: "Asset Weight Init", Value: toStr(bank.config.assetWeightInit) },
    {
      Metric: "Asset Weight Maint",
      Value: toStr(bank.config.assetWeightMaint),
    },
    {
      Metric: "Liab Weight Init",
      Value: toStr(bank.config.liabilityWeightInit),
    },
    {
      Metric: "Liab Weight Maint",
      Value: toStr(bank.config.liabilityWeightMaint),
    },
  ]);

  // Oracle
  const oracleRows = bank.config.oracleKeys
    .map((key, idx) => ({ Index: idx, Pubkey: key.toString() }))
    .filter((row) => row.Pubkey !== "11111111111111111111111111111111");
  if (oracleRows.length > 0) {
    console.log("Oracle:");
    console.table(oracleRows);
  }

  // Calculate totals and limits in human-readable tokens
  const scale = new BigNumber(10).pow(decimals);
  const totalAssets = toBN(bank.totalAssetShares)
    .multipliedBy(toBN(bank.assetShareValue))
    .dividedBy(scale);
  const totalLiabs = toBN(bank.totalLiabilityShares)
    .multipliedBy(toBN(bank.liabilityShareValue))
    .dividedBy(scale);
  const depositLimitToken = new BigNumber(
    bank.config.depositLimit.toString()
  ).dividedBy(scale);
  const borrowLimitToken = new BigNumber(
    bank.config.borrowLimit.toString()
  ).dividedBy(scale);

  // Deposit information
  console.log("Deposit information:");
  console.table([
    {
      Label: "Deposits (shares)",
      Value: formatBN(toBN(bank.totalAssetShares)),
    },
    {
      Label: "Liabilities (shares)",
      Value: formatBN(toBN(bank.totalLiabilityShares)),
    },
    { Label: "Deposits per Share", Value: toStr(bank.assetShareValue) },
    {
      Label: "Liabilities per Share",
      Value: toStr(bank.config.liabilityWeightMaint),
    },
    { Label: "Total Deposits (token)", Value: formatBN(totalAssets) },
    { Label: "Total Liabilities (token)", Value: formatBN(totalLiabs) },
    { Label: "Deposit Limit (token)", Value: formatBN(depositLimitToken) },
    { Label: "Borrow Limit (token)", Value: formatBN(borrowLimitToken) },
    {
      Label: "UI Limit ($)",
      Value: bank.config.totalAssetValueInitLimit.toNumber().toLocaleString(),
    },
  ]);

  // Fees
  console.log("Fees:");
  const insuranceOwedBN = toBN(
    bank.collectedInsuranceFeesOutstanding
  ).dividedBy(scale);
  const groupOwedBN = toBN(bank.collectedGroupFeesOutstanding).dividedBy(scale);
  const programOwedBN = toBN(bank.collectedProgramFeesOutstanding).dividedBy(
    scale
  );
  const vaultAcc = await getAccount(
    program.provider.connection,
    bank.feeVault,
    undefined,
    mintInfo.owner
  );
  const availableBN = new BigNumber(vaultAcc.amount.toString()).dividedBy(
    scale
  );
  console.table([
    { Fee: "Owed to Insurance", Value: formatBN(insuranceOwedBN) },
    { Fee: "Owed to Group", Value: formatBN(groupOwedBN) },
    { Fee: "Available in Vault", Value: formatBN(availableBN) },
    { Fee: "Owed to Program", Value: formatBN(programOwedBN) },
  ]);

  // Interest Rate Config
  const irc = bank.config.interestRateConfig;
  console.log("Interest Rate Config:");
  console.table([
    {
      Field: "Optimal Utilization Rate",
      Value: toStr(irc.optimalUtilizationRate),
    },
    { Field: "Plateau Interest Rate", Value: toStr(irc.plateauInterestRate) },
    { Field: "Max Interest Rate", Value: toStr(irc.maxInterestRate) },
    {
      Field: "Insurance Fee Fixed APR",
      Value: toStr(irc.insuranceFeeFixedApr),
    },
    { Field: "Insurance IR Fee", Value: toStr(irc.insuranceIrFee) },
    { Field: "Protocol Fixed Fee APR", Value: toStr(irc.protocolFixedFeeApr) },
    { Field: "Protocol IR Fee", Value: toStr(irc.protocolIrFee) },
    {
      Field: "Protocol Origination Fee",
      Value: toStr(irc.protocolOriginationFee),
    },
  ]);

  // EMODE Settings
  const entries = bank.emode.emodeConfig.entries || [];
  const emodeRows = entries
    .filter(
      (e) =>
        e.collateralBankEmodeTag !== 0 &&
        e.assetWeightInit != null &&
        e.assetWeightMaint != null
    )
    .map((e) => ({
      Tag: e.collateralBankEmodeTag,
      Flags: e.flags,
      AssetWeightInit: toStr(e.assetWeightInit),
      AssetWeightMaint: toStr(e.assetWeightMaint),
    }));

  if (emodeRows.length > 0) {
    console.group("EMODE Settings");
    console.log(`Tag:   ${bank.emode.emodeTag}`);
    console.log(`Flags: ${bank.emode.flags}`);
    console.table(emodeRows);
    console.groupEnd();
  }

  console.groupEnd();

  if (printForCopy) {
    await printCopyConfigSnippet(program, bankKey);
  }
}

async function main() {
  const user = commonSetup(true, config.PROGRAM_ID, "/.config/solana/id.json");
  const program = user.program;

  console.log("====================================");
  for (const bankKey of config.BANKS) {
    await printBankInfo(program, bankKey);
  }
}

const deriveFeeVault = (programId: PublicKey, bank: PublicKey) =>
  PublicKey.findProgramAddressSync(
    [Buffer.from("fee_vault"), bank.toBuffer()],
    programId
  );

const formatI80F48 = (x: WrappedI80F48): string =>
  wrappedI80F48toBigNumber(x).toString();

// prettier-ignore
/**
 * Print the banks' settings in a way that can be copy-pasted into the add_bank script.
 * @param program
 * @param bankKey
 */
async function printCopyConfigSnippet(program: Program<Marginfi>, bankKey: PublicKey) {
  const bank = await program.account.bank.fetch(bankKey);
  const mintInfo = await program.provider.connection.getAccountInfo(bank.mint)!;
  const isT22 = mintInfo.owner.toString() === TOKEN_2022_PROGRAM_ID.toString();

  // fetch group to get admin
  const group = await program.account.marginfiGroup.fetch(bank.group);
  PublicKey.default

  // determine oracleType variant index from bank.config.oracleSetup
  const os = (bank.config as any).oracleSetup;
  let oracleTypeConst = "ORACLE_TYPE_NONE";

  if ("pythLegacy" in os) {
    oracleTypeConst = "ORACLE_TYPE_PYTH_LEGACY";
  } else if ("switchboardV2" in os) {
    oracleTypeConst = "ORACLE_TYPE_SWITCHBOARD_V2";
  } else if ("pythPushOracle" in os) {
    oracleTypeConst = "ORACLE_TYPE_PYTH_PUSH_ORACLE";
  } else if ("switchboardPull" in os) {
    oracleTypeConst = "ORACLE_TYPE_SWITCHBOARD_PULL";
  } else if ("stakedWithPythPush" in os) {
    oracleTypeConst = "ORACLE_TYPE_STAKED_WITH_PYTH_PUSH";
  }

  console.log("\n// ===== Copy the following into your add_bank script =====\n");

  // 1) Top‑level Config
  console.log("const config: Config = {");
  console.log(`  PROGRAM_ID: "${program.programId.toString()}",`);
  console.log(`  GROUP_KEY: new PublicKey("${bank.group.toString()}"),`);
  console.log(`  ORACLE: new PublicKey("${bank.config.oracleKeys[0].toString()}"),`);
  console.log(`  ORACLE_FEED_ID: PublicKey.default, `);
  console.log(`  ORACLE_TYPE: ${oracleTypeConst},`);
  console.log(`  ADMIN: new PublicKey("${group.admin.toString()}"),`);
  console.log(`  FEE_PAYER: new PublicKey("PLACEHOLDER_FEE_PAYER"),`);
  console.log(`  BANK_MINT: new PublicKey("${bank.mint.toString()}"),`);
  console.log(`  SEED: PLACEHOLDER_SEED,`);
  console.log(`  TOKEN_PROGRAM: ${isT22 ? "TOKEN_2022_PROGRAM_ID" : "TOKEN_PROGRAM_ID"},`);
  console.log(`  MULTISIG_PAYER: new PublicKey("PLACEHOLDER_MULTISIG_PAYER"),`);
  console.log("};\n");

  // 2) InterestRateConfigRaw
  const irc = bank.config.interestRateConfig;
  console.log("const rate: InterestRateConfigRaw = {");
  console.log(`  optimalUtilizationRate: bigNumberToWrappedI80F48(${formatI80F48(irc.optimalUtilizationRate)}),`);
  console.log(`  plateauInterestRate:   bigNumberToWrappedI80F48(${formatI80F48(irc.plateauInterestRate)}),`);
  console.log(`  maxInterestRate:       bigNumberToWrappedI80F48(${formatI80F48(irc.maxInterestRate)}),`);
  console.log(`  insuranceFeeFixedApr:  bigNumberToWrappedI80F48(${formatI80F48(irc.insuranceFeeFixedApr)}),`);
  console.log(`  insuranceIrFee:        bigNumberToWrappedI80F48(${formatI80F48(irc.insuranceIrFee)}),`);
  console.log(`  protocolFixedFeeApr:   bigNumberToWrappedI80F48(${formatI80F48(irc.protocolFixedFeeApr)}),`);
  console.log(`  protocolIrFee:         bigNumberToWrappedI80F48(${formatI80F48(irc.protocolIrFee)}),`);
  console.log(`  protocolOriginationFee:bigNumberToWrappedI80F48(${formatI80F48(irc.protocolOriginationFee)}),`);
  console.log("};\n");

  // 3) BankConfigRaw_v1_3
  const cfg = bank.config;
  console.log("const bankConfig: BankConfigRaw_v1_3 = {");
  console.log(`  assetWeightInit:          bigNumberToWrappedI80F48(${formatI80F48(cfg.assetWeightInit)}),`);
  console.log(`  assetWeightMaint:         bigNumberToWrappedI80F48(${formatI80F48(cfg.assetWeightMaint)}),`);
  console.log(`  liabilityWeightInit:      bigNumberToWrappedI80F48(${formatI80F48(cfg.liabilityWeightInit)}),`);
  console.log(`  liabilityWeightMaint:     bigNumberToWrappedI80F48(${formatI80F48(cfg.liabilityWeightMaint)}),`);
  console.log(`  depositLimit:             new BN(${cfg.depositLimit.toString()}),`);
  console.log(`  interestRateConfig:       rate,`);
  console.log(`  operationalState:         { operational: {} },`);
  console.log(`  borrowLimit:              new BN(${cfg.borrowLimit.toString()}),`);
  console.log(`  riskTier:                 { collateral: {} },`);
  console.log(`  totalAssetValueInitLimit: new BN(${cfg.totalAssetValueInitLimit.toString()}),`);
  console.log(`  oracleMaxAge:             ${cfg.oracleMaxAge},`);
  console.log(`  assetTag:                 ${cfg.assetTag},`);
  console.log("};\n");
}

main().catch(console.error);
