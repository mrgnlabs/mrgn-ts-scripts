import { AccountMeta, Connection, PublicKey, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import { Program, AnchorProvider, Wallet, BN } from "@coral-xyz/anchor";
import { Marginfi } from "../../marginfi-client-v2/src/idl/marginfi-types_0.1.2";
import marginfiIdl from "../../marginfi-client-v2/src/idl/marginfi_0.1.2.json";
import { loadKeypairFromFile } from "./utils";
import { WrappedI80F48 } from "@mrgnlabs/mrgn-common";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { commonSetup } from "../lib/common-setup";

/**
 * If true, send the tx. If false, output the unsigned b58 tx to console.
 */
const sendTx = false;

const ORACLE_TYPE_PYTH = 3;
const ORACLE_TYPE_SWB = 4;

type Config = {
  PROGRAM_ID: string;
  GROUP_KEY: PublicKey;
  BANK: PublicKey;
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
  ADMIN: PublicKey;

  MULTISIG?: PublicKey; // May be omitted if not using squads
};

const config: Config = {
  PROGRAM_ID: "MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA",
  GROUP_KEY: new PublicKey("4qp6Fx6tnZkY5Wropq9wUYgtFxXKwE6viZxFHg3rdAG8"),
  BANK: new PublicKey("GZcUY6egnYuXHGWPukTo8iKEZiv5CVKXutcphRuKryNE"),
  ORACLE: new PublicKey("Ct5RHK1ZBJni58mTai45k5ucSRhYY1h6gesWpQPwbRSY"),
  ORACLE_FEED_ID: new PublicKey("Ct5RHK1ZBJni58mTai45k5ucSRhYY1h6gesWpQPwbRSY"),
  ORACLE_TYPE: ORACLE_TYPE_SWB,
  ADMIN: new PublicKey("CYXEgwbPHu2f9cY3mcUkinzDoDcsSan7myh1uBvYRbEw"),

  MULTISIG: new PublicKey("CYXEgwbPHu2f9cY3mcUkinzDoDcsSan7myh1uBvYRbEw"),
};

async function main() {
  const user = commonSetup(sendTx, config.PROGRAM_ID, "/keys/staging-deploy.json", config.MULTISIG);
  const program = user.program;
  const connection = user.connection;

  let oraclePassed: PublicKey;
  let oracleMeta: AccountMeta;
  if (config.ORACLE_TYPE == ORACLE_TYPE_PYTH) {
    oraclePassed = config.ORACLE_FEED_ID;
    oracleMeta = {
      pubkey: config.ORACLE,
      isSigner: false,
      isWritable: false,
    };
  } else {
    oraclePassed = config.ORACLE;
    oracleMeta = {
      pubkey: config.ORACLE,
      isSigner: false,
      isWritable: false,
    };
  }

  let transaction = new Transaction().add(
    await program.methods
      .lendingPoolConfigureBankOracle(config.ORACLE_TYPE, oraclePassed)
      .accountsPartial({
        // group: config.GROUP_KEY,
        admin: config.ADMIN,
        bank: config.BANK,
      })
      .remainingAccounts([oracleMeta])
      .instruction()
  );

  if (sendTx) {
    try {
      const signature = await sendAndConfirmTransaction(connection, transaction, [user.wallet.payer]);
      console.log("Transaction signature:", signature);
    } catch (error) {
      console.error("Transaction failed:", error);
    }
  } else {
    transaction.feePayer = config.MULTISIG; // Set the fee payer to Squads wallet
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
