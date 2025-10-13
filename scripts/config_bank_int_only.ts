import {
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { bigNumberToWrappedI80F48, WrappedI80F48 } from "@mrgnlabs/mrgn-common";
import { InterestRateConfigRaw } from "@mrgnlabs/marginfi-client-v2";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { commonSetup } from "../lib/common-setup";
import { u32MAX } from "../lib/constants";

/**
 * If true, send the tx. If false, output the unsigned b58 tx to console.
 */
const sendTx = false;

export type Config = {
  PROGRAM_ID: string;
  CURVE_ADMIN: PublicKey;
  MULTISIG_PAYER?: PublicKey; // May be omitted if not using squads
};

const config: Config = {
  PROGRAM_ID: "MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA",
  CURVE_ADMIN: new PublicKey("BACjgGYJYwVRRpnHJfcjykfkp2Xu118ghx5fYL1wgY7p"),
  MULTISIG_PAYER: new PublicKey("BACjgGYJYwVRRpnHJfcjykfkp2Xu118ghx5fYL1wgY7p"),
};

// ---- List your (BANK, intConfig) pairs here ----
const ITEMS: Array<{ bank: PublicKey; int: InterestRateConfigRaw }> = [
  {
    bank: new PublicKey("2s37akK2eyBbp8DZgCm7RtsaEz8eJP3Nxd4urLHQv7yB"),
    int: {
      protocolOriginationFee: null,
      protocolIrFee: null,
      protocolFixedFeeApr: null,
      insuranceIrFee: null,
      insuranceFeeFixedApr: null,
      maxInterestRate: null,
      optimalUtilizationRate: bigNumberToWrappedI80F48(0.9),
      plateauInterestRate: bigNumberToWrappedI80F48(0.075),
    },
  },
  {
    bank: new PublicKey("HmpMfL8942u22htC4EMiWgLX931g3sacXFR6KjuLgKLV"),
    int: {
      protocolOriginationFee: null,
      protocolIrFee: null,
      protocolFixedFeeApr: null,
      insuranceIrFee: null,
      insuranceFeeFixedApr: null,
      maxInterestRate: null,
      optimalUtilizationRate: bigNumberToWrappedI80F48(0.9),
      plateauInterestRate: bigNumberToWrappedI80F48(0.075),
    },
  },
  {
    bank: new PublicKey("8UEiPmgZHXXEDrqLS3oiTxQxTbeYTtPbeMBxAd2XGbpu"),
    int: {
      protocolOriginationFee: null,
      protocolIrFee: null,
      protocolFixedFeeApr: null,
      insuranceIrFee: null,
      insuranceFeeFixedApr: null,
      maxInterestRate: null,
      optimalUtilizationRate: bigNumberToWrappedI80F48(0.9),
      plateauInterestRate: bigNumberToWrappedI80F48(0.075),
    },
  },
  {
    bank: new PublicKey("FDsf8sj6SoV313qrA91yms3u5b3P4hBxEPvanVs8LtJV"),
    int: {
      protocolOriginationFee: null,
      protocolIrFee: null,
      protocolFixedFeeApr: null,
      insuranceIrFee: null,
      insuranceFeeFixedApr: null,
      maxInterestRate: null,
      optimalUtilizationRate: bigNumberToWrappedI80F48(0.9),
      plateauInterestRate: bigNumberToWrappedI80F48(0.075),
    },
  },
  // Add more items as needed:
  // { bank: new PublicKey("..."), int: { ...intConfig(), maxInterestRate: new BN(123) } },
];

async function main() {
  const user = commonSetup(
    sendTx,
    config.PROGRAM_ID,
    "/keys/staging-deploy.json",
    config.MULTISIG_PAYER,
    "current"
  );
  const program = user.program;
  const connection = user.connection;

  const transaction = new Transaction();

  // Create one instruction per (bank, int) pair
  for (const { bank, int } of ITEMS) {
    const ix = await program.methods
      .lendingPoolConfigureBankInterestOnly(int)
      .accounts({
        bank,
      })
      .accountsPartial({
        delegateCurveAdmin: config.CURVE_ADMIN,
      })
      .instruction();

    transaction.add(ix);
  }

  if (sendTx) {
    try {
      const signature = await sendAndConfirmTransaction(
        connection,
        transaction,
        [user.wallet.payer]
      );
      console.log("Transaction signature:", signature);
    } catch (error) {
      console.error("Transaction failed:", error);
    }
  } else {
    // Prepare unsigned tx for Squads or offline sigs
    if (!config.MULTISIG_PAYER) {
      throw new Error("MULTISIG_PAYER must be set when sendTx = false.");
    }
    transaction.feePayer = config.MULTISIG_PAYER;
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

main().catch((err) => {
  console.error(err);
});
