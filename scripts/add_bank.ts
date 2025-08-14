import {
  AccountMeta,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { I80F48_ONE, I80F48_ZERO } from "./utils";
import {
  bigNumberToWrappedI80F48,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  WrappedI80F48,
} from "@mrgnlabs/mrgn-common";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { commonSetup } from "../lib/common-setup";
import { u32MAX } from "../lib/constants";

/**
 * If true, send the tx. If false, output the unsigned b58 tx to console.
 */
const sendTx = true;

const ASSET_TAG_DEFAULT = 0;

const ORACLE_TYPE_PYTH = 3;
const ORACLE_TYPE_SWB = 4;

type Config = {
  PROGRAM_ID: string;
  GROUP_KEY: PublicKey;
  /** For Pyth, This is the feed, and is owned by rec5EKMGg6MxZYaMdyBfgwp4d5rB9T1VQH5pJv5LtFJ */
  ORACLE: PublicKey;
  /**
   * Pyth only, can be any arbitrary value for Switchboard.
   *
   * This will be oracles[0], and is the feed id of `ORACLE`, owned by
   * FsJ3A3u2vn5cTVofAjvy6y5kwABJAqYWpe4975bi2epH
   * */
  ORACLE_FEED_ID: PublicKey;
  /** Generally 3 (Pyth) or 4 (Switchboard) */
  ORACLE_TYPE: number;
  /** Group admin (generally the MS on mainnet) */
  ADMIN: PublicKey;
  /** Pays flat sol fee to init and rent (generally the MS on mainnet) */
  FEE_PAYER: PublicKey;
  BANK_MINT: PublicKey;
  SEED: number;
  TOKEN_PROGRAM: PublicKey;
  MULTISIG_PAYER?: PublicKey; // May be omitted if not using squads
};

const config: Config = {
  PROGRAM_ID: "stag8sTKds2h4KzjUw3zKTsxbqvT4XKHdaR9X9E6Rct",
  GROUP_KEY: new PublicKey("FCPfpHA69EbS8f9KKSreTRkXbzFpunsKuYf5qNmnJjpo"),
  ORACLE: new PublicKey("HMm3GPbdnqGwbkTnUUqCFsH8AMHDdEC3Lg8gcPD3HJSH"),
  ORACLE_FEED_ID: PublicKey.default,
  ORACLE_TYPE: ORACLE_TYPE_PYTH,
  ADMIN: new PublicKey("mfC1LoEk4mpM5yx1LjwR9QLZQ49AitxxWkK5Aciw7ZC"),
  FEE_PAYER: new PublicKey("mfC1LoEk4mpM5yx1LjwR9QLZQ49AitxxWkK5Aciw7ZC"),
  BANK_MINT: new PublicKey("pumpCmXqMfrsAkQ5r49WcJnRayYRqmXz6ae8H7H9Dfn"),
  SEED: 0,
  TOKEN_PROGRAM: TOKEN_2022_PROGRAM_ID,

  MULTISIG_PAYER: new PublicKey("CYXEgwbPHu2f9cY3mcUkinzDoDcsSan7myh1uBvYRbEw"),
};

const rate: InterestRateConfigRaw = {
  optimalUtilizationRate: bigNumberToWrappedI80F48(0.5),
  plateauInterestRate: bigNumberToWrappedI80F48(0.10000000000000142109),
  maxInterestRate: bigNumberToWrappedI80F48(3),
  insuranceFeeFixedApr: bigNumberToWrappedI80F48(0),
  insuranceIrFee: bigNumberToWrappedI80F48(0),
  protocolFixedFeeApr: bigNumberToWrappedI80F48(0.010000000000001563194),
  protocolIrFee: bigNumberToWrappedI80F48(0.050000000000000710543),
  protocolOriginationFee: bigNumberToWrappedI80F48(0),
};

const bankConfig: BankConfigRaw_v1_4 = {
  assetWeightInit: bigNumberToWrappedI80F48(0.39999999999999857891),
  assetWeightMaint: bigNumberToWrappedI80F48(0.5),
  liabilityWeightInit: bigNumberToWrappedI80F48(1.6000000000000014211),
  liabilityWeightMaint: bigNumberToWrappedI80F48(1.4200000000000017053),
  depositLimit: new BN(400000000000000),
  interestRateConfig: rate,
  operationalState: { operational: {} },
  borrowLimit: new BN(40000000000000),
  riskTier: { collateral: {} },
  totalAssetValueInitLimit: new BN(2500000),
  oracleMaxAge: 70,
  assetTag: 0,
  oracleMaxConfidence: 0,
};

// Staging example (zerotrade)
// const config: Config = {
//   PROGRAM_ID: "stag8sTKds2h4KzjUw3zKTsxbqvT4XKHdaR9X9E6Rct",
//   GROUP_KEY: new PublicKey("FtG71Waj7zMDkJDJhLNmCDq9qtLJq1wy3TrzneXzBBQw"),
//   ORACLE: new PublicKey("6B23K3tkb51vLZA14jcEQVCA1pfHptzEHFA93V5dYwbT"),
//   ORACLE_FEED_ID: new PublicKey("6ABgrEZk8urs6kJ1JNdC1sspH5zKXRqxy8sg3ZG2cQps"),
//   ORACLE_TYPE: ORACLE_TYPE_PYTH,
//   ADMIN: new PublicKey("725Z4QQUVhRiXcCdf4cQTrxXYmQXyW9zgVkW5PDVSJz4"),
//   FEE_PAYER: new PublicKey("725Z4QQUVhRiXcCdf4cQTrxXYmQXyW9zgVkW5PDVSJz4"),
//   BANK_MINT: new PublicKey("EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm"),
//   SEED: 0,
//   MULTISIG_PAYER: new PublicKey("CYXEgwbPHu2f9cY3mcUkinzDoDcsSan7myh1uBvYRbEw"),
// };

// Mainnet example
// const config: Config = {
//   PROGRAM_ID: "MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA",
//   GROUP_KEY: new PublicKey("4qp6Fx6tnZkY5Wropq9wUYgtFxXKwE6viZxFHg3rdAG8"),
//   ORACLE: new PublicKey("HMm3GPbdnqGwbkTnUUqCFsH8AMHDdEC3Lg8gcPD3HJSH"),
//   ORACLE_FEED_ID: new PublicKey("9DGVna8NFhcVEQoswYx3qwhuKSvDUaCZikjMYs9jxZP6"),
//   ORACLE_TYPE: ORACLE_TYPE_PYTH,
//   ADMIN: new PublicKey("CYXEgwbPHu2f9cY3mcUkinzDoDcsSan7myh1uBvYRbEw"),
//   FEE_PAYER: new PublicKey("CYXEgwbPHu2f9cY3mcUkinzDoDcsSan7myh1uBvYRbEw"),
//   BANK_MINT: new PublicKey("pumpCmXqMfrsAkQ5r49WcJnRayYRqmXz6ae8H7H9Dfn"),
//   SEED: 0,
//   TOKEN_PROGRAM: TOKEN_2022_PROGRAM_ID,
//   MULTISIG_PAYER: new PublicKey("CYXEgwbPHu2f9cY3mcUkinzDoDcsSan7myh1uBvYRbEw"),
// };

// // Configurable settings...
// const rate: InterestRateConfigRaw = {
//   optimalUtilizationRate: bigNumberToWrappedI80F48(0.5),
//   plateauInterestRate: bigNumberToWrappedI80F48(0.1),
//   maxInterestRate: bigNumberToWrappedI80F48(3),
//   insuranceFeeFixedApr: bigNumberToWrappedI80F48(0),
//   insuranceIrFee: bigNumberToWrappedI80F48(0),
//   protocolFixedFeeApr: bigNumberToWrappedI80F48(0.01),
//   protocolIrFee: bigNumberToWrappedI80F48(0.05),
//   protocolOriginationFee: bigNumberToWrappedI80F48(0),
// };

// const bankConfig: BankConfigRaw_v1_3 = {
//   assetWeightInit: bigNumberToWrappedI80F48(0.4),
//   assetWeightMaint: bigNumberToWrappedI80F48(0.5),
//   liabilityWeightInit: bigNumberToWrappedI80F48(1.6),
//   liabilityWeightMaint: bigNumberToWrappedI80F48(1.42),
//   depositLimit: new BN(400_000_000_000_000),
//   interestRateConfig: rate,
//   operationalState: {
//     operational: {},
//   },
//   borrowLimit: new BN(40_000_000_000_000),
//   riskTier: {
//     collateral: {},
//   },
//   totalAssetValueInitLimit: new BN(2_500_000),
//   oracleMaxAge: 70,
//   assetTag: ASSET_TAG_DEFAULT,
// };

// const bankConfig: BankConfigRaw_v1_4 = {
//   assetWeightInit: I80F48_ZERO,
//   assetWeightMaint: I80F48_ZERO,
//   liabilityWeightInit: I80F48_ONE,
//   liabilityWeightMaint: I80F48_ONE,
//   depositLimit: new BN(10_000_000_000),
//   interestRateConfig: rate,
//   operationalState: {
//     operational: undefined,
//   },
//   borrowLimit: new BN(10_000_000_000),
//   riskTier: {
//     collateral: undefined,
//   },
//   totalAssetValueInitLimit: new BN(100_000_000_000),
//   oracleMaxAge: 100,
//   assetTag: ASSET_TAG_DEFAULT,
//   oracleMaxConfidence: u32MAX * 0.15, // a %, 0-100, multiplied by u32MAX
// };

async function main() {
  console.log("adding bank to group: " + config.GROUP_KEY);
  const user = commonSetup(
    sendTx,
    config.PROGRAM_ID,
    "/keys/staging-deploy.json",
    config.MULTISIG_PAYER,
    "current"
  );
  const program = user.program;
  const connection = user.connection;

  const [bankKey] = deriveBankWithSeed(
    program.programId,
    config.GROUP_KEY,
    config.BANK_MINT,
    new BN(config.SEED)
  );

  let oracleMeta: AccountMeta;
  oracleMeta = {
    pubkey: config.ORACLE,
    isSigner: false,
    isWritable: false,
  };

  const tx = new Transaction().add(
    await program.methods
      .lendingPoolAddBankWithSeed(
        {
          assetWeightInit: bankConfig.assetWeightInit,
          assetWeightMaint: bankConfig.assetWeightMaint,
          liabilityWeightInit: bankConfig.liabilityWeightInit,
          liabilityWeightMaint: bankConfig.liabilityWeightMaint,
          depositLimit: bankConfig.depositLimit,
          interestRateConfig: bankConfig.interestRateConfig,
          operationalState: bankConfig.operationalState,
          borrowLimit: bankConfig.borrowLimit,
          riskTier: bankConfig.riskTier,
          assetTag: bankConfig.assetTag,
          pad0: [0, 0, 0, 0, 0, 0],
          totalAssetValueInitLimit: new BN(
            bankConfig.totalAssetValueInitLimit.toString()
          ),
          oracleMaxAge: bankConfig.oracleMaxAge,
          configFlags: 0,
          oracleMaxConfidence: bankConfig.oracleMaxConfidence,
        },
        new BN(config.SEED)
      )
      .accountsPartial({
        marginfiGroup: config.GROUP_KEY,
        admin: config.ADMIN,
        feePayer: config.FEE_PAYER,
        bankMint: config.BANK_MINT,
        tokenProgram: config.TOKEN_PROGRAM,
      })
      .instruction(),
    await program.methods
      .lendingPoolConfigureBankOracle(config.ORACLE_TYPE, config.ORACLE)
      .accountsPartial({
        group: config.GROUP_KEY,
        admin: config.ADMIN,
        bank: bankKey,
      })
      .remainingAccounts([oracleMeta])
      .instruction()
  );

  if (sendTx) {
    try {
      const signature = await sendAndConfirmTransaction(connection, tx, [
        user.wallet.payer,
      ]);
      console.log("bank key: " + bankKey);
      console.log("Transaction signature:", signature);
    } catch (error) {
      console.error("Transaction failed:", error);
    }
  } else {
    tx.feePayer = config.MULTISIG_PAYER; // Set the fee payer to Squads wallet
    const { blockhash } = await connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;
    const serializedTransaction = tx.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    });
    const base58Transaction = bs58.encode(serializedTransaction);
    console.log("bank key: " + bankKey);
    console.log("Base58-encoded transaction:", base58Transaction);
  }
}

const deriveBankWithSeed = (
  programId: PublicKey,
  group: PublicKey,
  bankMint: PublicKey,
  seed: BN
) => {
  return PublicKey.findProgramAddressSync(
    [group.toBuffer(), bankMint.toBuffer(), seed.toArrayLike(Buffer, "le", 8)],
    programId
  );
};

main().catch((err) => {
  console.error(err);
});

type BankConfigRaw_v1_4 = {
  assetWeightInit: WrappedI80F48;
  assetWeightMaint: WrappedI80F48;

  liabilityWeightInit: WrappedI80F48;
  liabilityWeightMaint: WrappedI80F48;

  depositLimit: BN;
  borrowLimit: BN;
  riskTier: { collateral: {} } | { isolated: {} };
  assetTag: number;
  totalAssetValueInitLimit: BN;

  interestRateConfig: InterestRateConfigRaw;
  operationalState: { paused: {} } | { operational: {} } | { reduceOnly: {} };

  oracleMaxAge: number;
  oracleMaxConfidence: number;
};

interface InterestRateConfigRaw {
  // Curve Params
  optimalUtilizationRate: WrappedI80F48;
  plateauInterestRate: WrappedI80F48;
  maxInterestRate: WrappedI80F48;

  // Fees
  insuranceFeeFixedApr: WrappedI80F48;
  insuranceIrFee: WrappedI80F48;
  protocolFixedFeeApr: WrappedI80F48;
  protocolIrFee: WrappedI80F48;

  protocolOriginationFee: WrappedI80F48;
}
