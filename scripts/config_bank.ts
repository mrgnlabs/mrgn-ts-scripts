import {
  PublicKey,
  VersionedTransaction,
  TransactionMessage,
  AddressLookupTableAccount,
  Transaction,
} from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { bigNumberToWrappedI80F48, WrappedI80F48 } from "@mrgnlabs/mrgn-common";
import { InterestRateConfigRaw } from "@mrgnlabs/marginfi-client-v2";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { commonSetup } from "../lib/common-setup";
import { u32MAX } from "../lib/constants";

/**
 * If true, send the txs. If false, output the unsigned b58 v0 txs to console.
 */
const sendTx = false;

export type BankConfigOptRaw = {
  assetWeightInit: WrappedI80F48 | null;
  assetWeightMaint: WrappedI80F48 | null;

  liabilityWeightInit: WrappedI80F48 | null;
  liabilityWeightMaint: WrappedI80F48 | null;

  depositLimit: BN | null;
  borrowLimit: BN | null;
  riskTier: { collateral: {} } | { isolated: {} } | null;
  assetTag: number | null;
  totalAssetValueInitLimit: BN | null;

  interestRateConfig: InterestRateConfigRaw | null;
  operationalState:
    | { paused: {} }
    | { operational: {} }
    | { reduceOnly: {} }
    | null;

  oracleMaxAge: number | null;
  oracleMaxConfidence: number | null;
  permissionlessBadDebtSettlement: boolean | null;
  freezeSettings: boolean | null;
};

export type BankConfigPair = {
  bank: PublicKey;
  config: BankConfigOptRaw;
};

const rate: InterestRateConfigRaw = {
  optimalUtilizationRate: bigNumberToWrappedI80F48(0.8),
  plateauInterestRate: bigNumberToWrappedI80F48(0.1),
  maxInterestRate: bigNumberToWrappedI80F48(0.5655),
  insuranceFeeFixedApr: bigNumberToWrappedI80F48(0),
  insuranceIrFee: bigNumberToWrappedI80F48(0),
  protocolFixedFeeApr: bigNumberToWrappedI80F48(0.0001),
  protocolIrFee: bigNumberToWrappedI80F48(0.135),
  protocolOriginationFee: bigNumberToWrappedI80F48(0),
};

export type Config = {
  PROGRAM_ID: string;
  ADMIN: PublicKey;
  LUT: PublicKey;

  /**
   * Exclude if not using MS
   */
  MULTISIG_PAYER?: PublicKey;

  /**
   * Array of banks and their corresponding config overrides.
   */
  BANKS: BankConfigPair[];
};

const config: Config = {
  PROGRAM_ID: "MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA",
  ADMIN: new PublicKey("CYXEgwbPHu2f9cY3mcUkinzDoDcsSan7myh1uBvYRbEw"),
  MULTISIG_PAYER: new PublicKey("CYXEgwbPHu2f9cY3mcUkinzDoDcsSan7myh1uBvYRbEw"),

  LUT: new PublicKey("CQ8omkUwDtsszuJLo9grtXCeEyDU4QqBLRv9AjRDaUZ3"),

  // One tx per entry in this array:
  BANKS: [
    {
      bank: new PublicKey("ARwrmohp8qMCkxQNiq5di4pTnTWhvXhAc7c18tZ877Kg"),
      config: {
        assetWeightInit: bigNumberToWrappedI80F48(0.65),
        assetWeightMaint: bigNumberToWrappedI80F48(0.8),
        liabilityWeightInit: bigNumberToWrappedI80F48(1.3),
        liabilityWeightMaint: bigNumberToWrappedI80F48(1.2),
        depositLimit: new BN(20000 * 10 ** 9),
        interestRateConfig: rate,
        operationalState: { operational: {} },
        borrowLimit: new BN(5000 * 10 ** 9),
        riskTier: { collateral: {} },
        totalAssetValueInitLimit: new BN(10000000),
        oracleMaxAge: 70,
        assetTag: null,
        oracleMaxConfidence: null,
        permissionlessBadDebtSettlement: null,
        freezeSettings: null,
      },
    },
    // Add more { bank, config: bankConfigOptForThatBank() } as needed

    // Example reduce-only config:
    // assetWeightInit: bigNumberToWrappedI80F48(0),
    // assetWeightMaint: bigNumberToWrappedI80F48(0),
    // liabilityWeightInit: null,
    // liabilityWeightMaint: null,
    // depositLimit: null,
    // borrowLimit: null,
    // riskTier: null,
    // assetTag: null,
    // totalAssetValueInitLimit: null,
    // interestRateConfig: {
    //   protocolOriginationFee: null,
    //   protocolIrFee: null,
    //   protocolFixedFeeApr: null,
    //   insuranceIrFee: null,
    //   insuranceFeeFixedApr: null,
    //   maxInterestRate: null,
    //   optimalUtilizationRate: null,
    //   plateauInterestRate: null,
    // },
    // operationalState: { reduceOnly: {} },
    // oracleMaxAge: null,
    // oracleMaxConfidence: null,
    // permissionlessBadDebtSettlement: null,
    // freezeSettings: null,
  ],
};

export function bankConfigOptDefault(): BankConfigOptRaw {
  const bankConfigOpt: BankConfigOptRaw = {
    assetWeightInit: null, // I80, a %
    assetWeightMaint: null, // I80, a %
    liabilityWeightInit: null, // I80, a %
    liabilityWeightMaint: null, // I80, a %
    depositLimit: null, // BN, in native token
    borrowLimit: null, // BN, in native token
    riskTier: null, // { collateral: {} } or { isolated: {} }
    assetTag: null, // 0 - Default, 1 - SOL, 2 - STAKED COLLATERAL
    totalAssetValueInitLimit: null, // BN, in $
    interestRateConfig: {
      protocolOriginationFee: null, // I80, a %
      protocolIrFee: null, // I80, a %
      protocolFixedFeeApr: null, // I80, a %
      insuranceIrFee: null, // I80, a %
      insuranceFeeFixedApr: null, // I80, a %
      maxInterestRate: null, // I80, a %
      optimalUtilizationRate: null, // I80, a %
      plateauInterestRate: null, // I80, a %
    },
    operationalState: { paused: {} }, // { reduceOnly: {} } or { operational: {} }
    oracleMaxAge: null, // number, in seconds
    oracleMaxConfidence: null, // number, a % out of 100%, as u32, e.g. 10% = u32MAX * 0.10
    permissionlessBadDebtSettlement: null, // true or false
    freezeSettings: null, // true or false
  };
  return bankConfigOpt;
}

async function main() {
  if (config.BANKS.length === 0) {
    throw new Error("Config.BANKS is empty - nothing to do.");
  }

  const user = commonSetup(
    sendTx,
    config.PROGRAM_ID,
    "/keys/staging-deploy.json",
    config.MULTISIG_PAYER,
    "1.4"
  );

  const program = user.program;
  const connection = user.connection;

  // Fetch LUT (hard-coded in config). If not found, we still proceed without it.
  let luts: AddressLookupTableAccount[] = [];
  const lutLookup = await connection.getAddressLookupTable(config.LUT);
  if (!lutLookup || !lutLookup.value) {
    console.warn(
      `Warning: LUT ${config.LUT.toBase58()} not found on-chain. Proceeding without it.`
    );
    luts = [];
  } else {
    luts = [lutLookup.value];
  }

  for (let i = 0; i < config.BANKS.length; i++) {
    const entry = config.BANKS[i];

    // Choose payer: if broadcasting now, use the local wallet; otherwise, use multisig payer.
    const payerKey = sendTx
      ? user.wallet.publicKey
      : config.MULTISIG_PAYER ??
        (() => {
          throw new Error("MULTISIG_PAYER must be set when sendTx = false");
        })();

    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash();

    const ix = await program.methods
      .lendingPoolConfigureBank(entry.config)
      .accounts({
        bank: entry.bank,
      })
      .accountsPartial({
        admin: config.ADMIN,
      })
      .instruction();

    if (sendTx) {
      const v0Message = new TransactionMessage({
        payerKey: user.wallet.publicKey,
        recentBlockhash: blockhash,
        instructions: [ix],
      }).compileToV0Message(luts);
      const v0Tx = new VersionedTransaction(v0Message);

      v0Tx.sign([user.wallet.payer]);
      const signature = await connection.sendTransaction(v0Tx, {
        maxRetries: 2,
      });
      await connection.confirmTransaction(
        { signature, blockhash, lastValidBlockHeight },
        "confirmed"
      );

      console.log("tx signature:", signature);
    } else {
      // No versioned tx for squads (yet)
      let transaction = new Transaction().add(ix);
      transaction.feePayer = config.MULTISIG_PAYER; // Set the fee payer to Squads wallet
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      const serializedTransaction = transaction.serialize({
        requireAllSignatures: false,
        verifySignatures: false,
      });
      const base58Transaction = bs58.encode(serializedTransaction);
      console.log("Base58-encoded transaction:", base58Transaction);
    }
  }
}

const ASSET_TAG_DEFAULT = 0;
const ASSET_TAG_SOL = 1;
const ASSET_TAG_STAKED = 2;

main().catch((err) => {
  console.error(err);
});
