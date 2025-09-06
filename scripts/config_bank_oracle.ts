import {
  AccountMeta,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { commonSetup } from "../lib/common-setup";

/**
 * If true, send the tx. If false, output the unsigned b58 tx to console.
 */
const sendTx = false;

const ORACLE_TYPE_PYTH = 3;
const ORACLE_TYPE_SWB = 4;

/** Shared settings across all entries */
type SharedConfig = {
  PROGRAM_ID: string;
  ADMIN: PublicKey;
  MULTISIG?: PublicKey; // May be omitted if not using squads
};

const configCommon: SharedConfig = {
  PROGRAM_ID: "MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA",
  ADMIN: new PublicKey("CYXEgwbPHu2f9cY3mcUkinzDoDcsSan7myh1uBvYRbEw"),
  MULTISIG: new PublicKey("CYXEgwbPHu2f9cY3mcUkinzDoDcsSan7myh1uBvYRbEw"),
};

type BankOracleConfig = {
  bank: PublicKey;
  oracle: PublicKey;
  /** Generally 3 (Pyth) or 4 (Switchboard) */
  oracleType: number;
};

/** One entry per bank to update */
const configs: BankOracleConfig[] = [
  {
    bank: new PublicKey("H6bfRmfZPoxDDs8eoVBgouTPowwyv7opfBbHd5KUmuUz"),
    oracle: new PublicKey("DMhGWtLAKE5d56WdyHQxqeFncwUeqMEnuC2RvvZfbuur"),
    oracleType: ORACLE_TYPE_SWB,
  },
  {
    bank: new PublicKey("2ZScBCNKfE6X6fGcBtB2uBuvZqUE3cjKQmRv8wVXTN5B"),
    oracle: new PublicKey("CXuu5iMvjTZpJ7x2PquWKnxcArHmwqmaZDqEef7iXgnF"),
    oracleType: ORACLE_TYPE_SWB,
  },
  {
    bank: new PublicKey("4kNXetv8hSv9PzvzPZzEs1CTH6ARRRi2b8h6jk1ad1nP"),
    oracle: new PublicKey("9QuaHQ8xtrAH3sEJH1GZzmUmLkxUC472UZYjSswk4c8D"),
    oracleType: ORACLE_TYPE_SWB,
  },
  // ...More entries here as needed. The limit even without using LUTs is fairly high (at least 6)
];

async function main() {
  const user = commonSetup(
    sendTx,
    configCommon.PROGRAM_ID,
    "/keys/staging-deploy.json",
    configCommon.MULTISIG
  );
  const program = user.program;
  const connection = user.connection;

  // Build a single transaction with one instruction per configs[] entry
  const transaction = new Transaction();

  for (const cfg of configs) {
    const oracleMeta: AccountMeta = {
      pubkey: cfg.oracle,
      isSigner: false,
      isWritable: false,
    };

    const ix = await program.methods
      .lendingPoolConfigureBankOracle(cfg.oracleType, cfg.oracle)
      .accountsPartial({
        admin: configCommon.ADMIN,
        bank: cfg.bank,
      })
      .remainingAccounts([oracleMeta])
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
    if (configCommon.MULTISIG) {
      transaction.feePayer = configCommon.MULTISIG;
    }
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
