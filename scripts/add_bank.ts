import {
  AccountMeta,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import {
  bigNumberToWrappedI80F48,
  TOKEN_PROGRAM_ID,
  WrappedI80F48,
} from "@mrgnlabs/mrgn-common";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { commonSetup } from "../lib/common-setup";
import { RiskTierRaw } from "@mrgnlabs/marginfi-client-v2";

/**
 * If true, send the tx. If false, output the unsigned b58 tx to console.
 */
const sendTx = true;

const ASSET_TAG_DEFAULT = 0;

export const ORACLE_TYPE_PYTH = 3;
const ORACLE_TYPE_SWB = 4;

type Config = {
  PROGRAM_ID: string;
  GROUP_KEY: PublicKey;
  /** For Pyth, This is the feed, and is owned by rec5EKMGg6MxZYaMdyBfgwp4d5rB9T1VQH5pJv5LtFJ */
  ORACLE: PublicKey;
  /** Generally 3 (Pyth) or 4 (Switchboard) */
  ORACLE_TYPE: number;
  /** Group admin (generally the MS on mainnet) */
  ADMIN: PublicKey;
  /** Pays flat sol fee to init and rent (generally the MS on mainnet) */
  FEE_PAYER?: PublicKey; // If omitted, defaults to ADMIN
  BANK_MINT: PublicKey;
  SEED: number;
  TOKEN_PROGRAM?: PublicKey; // If omitted, defaults to TOKEN_PROGRAM_ID
  MULTISIG_PAYER?: PublicKey; // May be omitted if not using squads
};

// Feed IDs can be taken from here: https://www.pyth.network/developers/price-feed-ids
// USDC - 6 decimals
const mint = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const oracle = "Dpw1EAVrSB1ibxiDQyTAW6Zip3J4Btk2x4SgApQCeFbX";
// BONK - 5 decimals
// const mint = "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263";
// const oracle = "DBE3N8uNjhKPRHfANdwGvCZghWXyLPdqdSbEW2XFwBiX";

const config: Config = {
  PROGRAM_ID: "MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA",
  GROUP_KEY: new PublicKey("8D7qgu5153s3dHCbnHviijJyJ3CcJAj1QRX46yW2eSu1"),
  ORACLE: new PublicKey(oracle),
  ORACLE_TYPE: ORACLE_TYPE_PYTH,
  ADMIN: new PublicKey("6DdJqQYD8AizuXiCkbn19LiyWRwUsRMzy2Sgyoyasyj7"),
  BANK_MINT: new PublicKey(mint),
  SEED: 14,
};

const rate: InterestRateConfig1_6 = {
  insuranceFeeFixedApr: bigNumberToWrappedI80F48(0),
  insuranceIrFee: bigNumberToWrappedI80F48(0),
  protocolFixedFeeApr: bigNumberToWrappedI80F48(0.0),
  protocolIrFee: bigNumberToWrappedI80F48(0.0),
  protocolOriginationFee: bigNumberToWrappedI80F48(0),

  zeroUtilRate: 0.0,
  hundredUtilRate: 0.0,
  points: [{ util: 0.0, rate: 0.0 }, { util: 0.0, rate: 0.0 }, { util: 0.0, rate: 0.0 }, { util: 0.0, rate: 0.0 }, { util: 0.0, rate: 0.0 }],
  curveType: 1
};

const bankConfig: BankConfig = {
  assetWeightInit: bigNumberToWrappedI80F48(1.0),
  assetWeightMaint: bigNumberToWrappedI80F48(1.0),
  liabilityWeightInit: bigNumberToWrappedI80F48(1.0),
  liabilityWeightMaint: bigNumberToWrappedI80F48(1.0),
  depositLimit: new BN(10000 * 10 ** 8),
  interestRateConfig: rate,
  operationalState: { operational: {} },
  borrowLimit: new BN(5000 * 10 ** 8),
  riskTier: { collateral: {} },
  totalAssetValueInitLimit: new BN(2_000_000),
  oracleMaxAge: 70,
  assetTag: 0,
  oracleMaxConfidence: 0,
  configFlags: 0
};

async function main() {
  await addBank(sendTx, config, "/.config/stage/id.json");
}

export async function addBank(sendTx: boolean, config: Config, walletPath: string, version?: "current"): Promise<PublicKey> {
  console.log("adding bank to group: " + config.GROUP_KEY);
  const user = commonSetup(
    sendTx,
    config.PROGRAM_ID,
    walletPath,
    config.MULTISIG_PAYER,
    version
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
        feePayer: config.FEE_PAYER ?? config.ADMIN,
        bankMint: config.BANK_MINT,
        tokenProgram: config.TOKEN_PROGRAM ?? TOKEN_PROGRAM_ID,
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

  return bankKey;
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

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
  });
}

export type RatePoint = {
  util: number;
  rate: number;
};

type InterestRateConfig1_6 = {
  // Fees
  insuranceFeeFixedApr: WrappedI80F48;
  insuranceIrFee: WrappedI80F48;
  protocolFixedFeeApr: WrappedI80F48;
  protocolIrFee: WrappedI80F48;

  protocolOriginationFee: WrappedI80F48;

  zeroUtilRate: number;
  hundredUtilRate: number;
  points: RatePoint[];
  curveType: number;
};

type OperationalStateRaw =
  | { paused: {} }
  | { operational: {} }
  | { reduceOnly: {} };

type BankConfig = {
  assetWeightInit: WrappedI80F48;
  assetWeightMaint: WrappedI80F48;

  liabilityWeightInit: WrappedI80F48;
  liabilityWeightMaint: WrappedI80F48;

  depositLimit: BN;
  interestRateConfig: InterestRateConfig1_6;

  /** Paused = 0, Operational = 1, ReduceOnly = 2 */
  operationalState: OperationalStateRaw;

  borrowLimit: BN;
  /** Collateral = 0, Isolated = 1 */
  riskTier: RiskTierRaw;
  assetTag: number;
  configFlags: number;
  totalAssetValueInitLimit: BN;
  oracleMaxAge: number;
  /** A u32, e.g. for 100% pass u32::MAX */
  oracleMaxConfidence: number;
};