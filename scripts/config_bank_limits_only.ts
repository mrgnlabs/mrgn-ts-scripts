import {
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { commonSetup } from "../lib/common-setup";
import { cap } from "./utils";

/**
 * If true, send the tx. If false, output the unsigned b58 tx to console.
 */
const sendTx = false;

export type Config = {
  PROGRAM_ID: string;
  LIMIT_ADMIN: PublicKey;
  MULTISIG_PAYER?: PublicKey; // May be omitted if not using squads
};

const config: Config = {
  PROGRAM_ID: "MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA",
  LIMIT_ADMIN: new PublicKey("BACjgGYJYwVRRpnHJfcjykfkp2Xu118ghx5fYL1wgY7p"),
  MULTISIG_PAYER: new PublicKey("BACjgGYJYwVRRpnHJfcjykfkp2Xu118ghx5fYL1wgY7p"),
};

export type BankLimitsEntry = {
  bank: PublicKey;
  depositLimit: BN | null;
  borrowLimit: BN | null;
  initValue: BN | null;
};

/**
 * Provide as many entries as you want, while noting that tx size limits will eventually apply
 *  (though using a LUT can help).
 */
const bankLimits: BankLimitsEntry[] = [
  // usdg
  {
    bank: new PublicKey("Dj2CwMF3GM7mMT5hcyGXKuYSQ2kQ5zaVCkA1zX1qaTva"),
    depositLimit: cap(5_000_000, 6),
    borrowLimit: cap(2_500_000, 6),
    initValue: new BN(5_000_000),
  },
  // usdg (kamino)
  {
    bank: new PublicKey("6KP94PsCrBk2gPqtqT4WSvZ8Zss7r1auz3azXpv5ptrS"),
    depositLimit: cap(2_500_000, 6),
    borrowLimit: cap(0, 6),
    initValue: new BN(2_500_000),
  },
];

async function main() {
  const user = commonSetup(
    sendTx,
    config.PROGRAM_ID,
    "/keys/staging-deploy.json",
    config.MULTISIG_PAYER,
    "kamino"
  );
  const program = user.program;
  const connection = user.connection;

  const transaction = new Transaction();

  for (const { bank, depositLimit, borrowLimit, initValue } of bankLimits) {
    const ix = await program.methods
      .lendingPoolConfigureBankLimitsOnly(depositLimit, borrowLimit, initValue)
      .accounts({
        bank,
      })
      .accountsPartial({
        delegateLimitAdmin: config.LIMIT_ADMIN,
      })
      .instruction();

    transaction.add(ix);
  }

  if (sendTx) {
    // TODO versioned tx with LUT
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
    // Prepare unsigned tx (b58) for multisig flow
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
