import { PublicKey } from "@solana/web3.js";
import {
  getAccount,
  TOKEN_2022_PROGRAM_ID,
  wrappedI80F48toBigNumber,
} from "@mrgnlabs/mrgn-common";
import type { WrappedI80F48 } from "@mrgnlabs/mrgn-common";
import BigNumber from "bignumber.js";
import { commonSetup } from "../lib/common-setup";
import { getTokenBalance } from "../lib/utils";

// If true, prints this bank's settings in a format to be copy-pasted into add_bank
const printForCopy = false;

type Config = {
  PROGRAM_ID: string;
  BANKS: PublicKey[];
};

const config: Config = {
  PROGRAM_ID: "MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA",
  BANKS: [
    // new PublicKey("2s37akK2eyBbp8DZgCm7RtsaEz8eJP3Nxd4urLHQv7yB"), // usdc
    // new PublicKey("HmpMfL8942u22htC4EMiWgLX931g3sacXFR6KjuLgKLV"), // usdt
    // new PublicKey("8UEiPmgZHXXEDrqLS3oiTxQxTbeYTtPbeMBxAd2XGbpu"), // py
    // new PublicKey("FDsf8sj6SoV313qrA91yms3u5b3P4hBxEPvanVs8LtJV"), // usds
    new PublicKey("CCKtUs6Cgwo4aaQUmBPmyoApH2gUDErxNZCAntD6LYGh"),
  ],
};

async function printBankInfo(bankKey: PublicKey) {
  const user = commonSetup(
    true,
    config.PROGRAM_ID,
    "/.config/solana/id.json",
    undefined,
    "kamino"
  );

  const program = user.program;
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

  const [bankLiquidityVault] = deriveLiquidityVault(program.programId, bankKey);
  const [bankInsuranceVault] = deriveInsuranceVault(program.programId, bankKey);
  const [bankFeeVault] = deriveFeeVault(program.programId, bankKey);

  const liquidityBalPromise = getTokenBalance(
    program.provider,
    bankLiquidityVault
  );
  const insuranceBalPromise = getTokenBalance(
    program.provider,
    bankInsuranceVault
  );
  const feePromise = getTokenBalance(program.provider, bankFeeVault);
  const liquidityBal = await liquidityBalPromise;
  const insuranceBal = await insuranceBalPromise;
  const feeBal = await feePromise;

  try {
    // @ts-ignore
    if (bank.kaminoObligation.toString() != PublicKey.default.toString()) {
      // @ts-ignore
      console.log("kamino reserve: " + bank.kaminoReserve);
      // @ts-ignore
      console.log("kamino obligation: " + bank.kaminoObligation);
    }
  } catch (err) {
    // do nothing
  }

  // Metrics
  console.log("Metrics:");
  console.table([
    { Property: "is T22 Mint", Value: isT22 },
    { Property: "Group", Value: bank.group.toString() },
    { Property: "Mint", Value: bank.mint.toString() },
    { Property: "Fee Dest", Value: bank.feesDestinationAccount.toString() },
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

  console.log("Vaults:");
  console.table([
    {
      Balance: "Liquidity Vault",
      Value: (liquidityBal / 10 ** decimals).toLocaleString(),
    },
    {
      Balance: "Insurance Vault",
      Value: (insuranceBal / 10 ** decimals).toLocaleString(),
    },
    { Balance: "Fee Vault", Value: (feeBal / 10 ** decimals).toLocaleString() },
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
  console.log("====================================");
  for (const bankKey of config.BANKS) {
    await printBankInfo(bankKey);
  }
}

const deriveLiquidityVault = (programId: PublicKey, bank: PublicKey) => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("liquidity_vault", "utf-8"), bank.toBuffer()],
    programId
  );
};

const deriveInsuranceVault = (programId: PublicKey, bank: PublicKey) => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("insurance_vault", "utf-8"), bank.toBuffer()],
    programId
  );
};

const deriveFeeVault = (programId: PublicKey, bank: PublicKey) =>
  PublicKey.findProgramAddressSync(
    [Buffer.from("fee_vault"), bank.toBuffer()],
    programId
  );

const formatI80F48 = (x: WrappedI80F48): string =>
  wrappedI80F48toBigNumber(x).toString();

const ORACLE_TYPE_PYTH = 3;
const ORACLE_TYPE_SWB = 4;

/**
 * turns { collateral: {} } into "collateral", { paused: {} } into "paused", etc.
 * @param v
 * @returns
 */
function unwrapVariant(v: any): string {
  if (!v || typeof v !== "object") return "unknown";
  const k = Object.keys(v)[0];
  return k ?? "unknown";
}

// prettier-ignore
/**
 * AI slop
 *
 * Print the banks' settings in a way that can be copy-pasted into the add_bank script.
 * @param program
 * @param bankKey
 */
async function printCopyConfigSnippet(program: any, bankKey: PublicKey) {
  const bank = await program.account.bank.fetch(bankKey);
  const mintInfo = await program.provider.connection.getAccountInfo(bank.mint)!;
  const isT22 = mintInfo.owner.toString() === TOKEN_2022_PROGRAM_ID.toString();

  // fetch group to get admin
  const group = await program.account.marginfiGroup.fetch(bank.group);

  // --- ORACLE TYPE MAPPING (contract expects numbers: 3=PYTH, 4=SWB) ---
  const os = (bank.config as any).oracleSetup ?? {};
  let oracleTypeNumeric = 0;
  // Treat any Pyth-like variant as PYTH, any Switchboard-like as SWB
  if (
    "pythLegacy" in os ||
    "pythPushOracle" in os ||
    "stakedWithPythPush" in os
  ) {
    oracleTypeNumeric = ORACLE_TYPE_PYTH;
  } else if ("switchboardV2" in os || "switchboardPull" in os) {
    oracleTypeNumeric = ORACLE_TYPE_SWB;
  }

  const cfg = bank.config;
  const irc = cfg.interestRateConfig;

  // Pull through runtime variants for printing
  const riskTierVariant = unwrapVariant(cfg.riskTier); // "collateral" | "isolated" | unknown
  const opStateVariant  = unwrapVariant(cfg.operationalState); // "operational" | "paused" | "reduceOnly" | unknown

  // oracleMaxConfidence is new in v1_4; default to 0 if not present on-chain
  const oracleMaxConfidence =
    typeof (cfg as any).oracleMaxConfidence === "number"
      ? (cfg as any).oracleMaxConfidence
      : 0;

  console.log("\n// ===== Copy the following into your addBank script (v1_4) =====\n");

  // ---- Top-level Config (matches your new addBank.ts) ----
  console.log("const config: Config = {");
  console.log(`  PROGRAM_ID: "${program.programId.toString()}",`);
  console.log(`  GROUP_KEY: new PublicKey("${bank.group.toString()}"),`);
  // choose first non-default oracle key if present; otherwise default pubkey
  const oracleKey =
    (cfg.oracleKeys?.find((k: PublicKey) => k && k.toString() !== PublicKey.default.toString()) ??
      PublicKey.default).toString();
  console.log(`  ORACLE: new PublicKey("${oracleKey}"),`);
  console.log(`  ORACLE_TYPE: ${oracleTypeNumeric || 0}, // 3=PYTH, 4=SWB`);
  console.log(`  ADMIN: new PublicKey("${group.admin.toString()}"),`);
  console.log(`  FEE_PAYER: new PublicKey("PLACEHOLDER_FEE_PAYER"),`);
  console.log(`  BANK_MINT: new PublicKey("${bank.mint.toString()}"),`);
  console.log(`  SEED: PLACEHOLDER_SEED, // number`);
  console.log(`  TOKEN_PROGRAM: ${isT22 ? "TOKEN_2022_PROGRAM_ID" : "TOKEN_PROGRAM_ID"},`);
  console.log(`  MULTISIG_PAYER: new PublicKey("PLACEHOLDER_MULTISIG_PAYER"),`);
  console.log("};\n");

  // ---- InterestRateConfigRaw ----
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

  // ---- BankConfigRaw_v1_4 ----
  // Note: we preserve your on-chain values instead of hardcoding.
  // depositLimit / borrowLimit / totalAssetValueInitLimit are already BN on-chain.
  const riskTierPrint =
    riskTierVariant === "isolated" ? "{ isolated: {} }" : "{ collateral: {} }";
  let opStatePrint = "{ operational: {} }";
  if (opStateVariant === "paused") opStatePrint = "{ paused: {} }";
  else if (opStateVariant === "reduceOnly") opStatePrint = "{ reduceOnly: {} }";

  console.log("const bankConfig: BankConfigRaw_v1_4 = {");
  console.log(`  assetWeightInit:          bigNumberToWrappedI80F48(${formatI80F48(cfg.assetWeightInit)}),`);
  console.log(`  assetWeightMaint:         bigNumberToWrappedI80F48(${formatI80F48(cfg.assetWeightMaint)}),`);
  console.log(`  liabilityWeightInit:      bigNumberToWrappedI80F48(${formatI80F48(cfg.liabilityWeightInit)}),`);
  console.log(`  liabilityWeightMaint:     bigNumberToWrappedI80F48(${formatI80F48(cfg.liabilityWeightMaint)}),`);
  console.log(`  depositLimit:             new BN(${cfg.depositLimit.toString()}),`);
  console.log(`  interestRateConfig:       rate,`);
  console.log(`  operationalState:         ${opStatePrint},`);
  console.log(`  borrowLimit:              new BN(${cfg.borrowLimit.toString()}),`);
  console.log(`  riskTier:                 ${riskTierPrint},`);
  console.log(`  totalAssetValueInitLimit: new BN(${cfg.totalAssetValueInitLimit.toString()}),`);
  console.log(`  oracleMaxAge:             ${cfg.oracleMaxAge},`);
  console.log(`  assetTag:                 ${cfg.assetTag ?? 0},`);
  console.log(`  oracleMaxConfidence:      ${oracleMaxConfidence},`);
  console.log("};\n");
}

main().catch(console.error);
