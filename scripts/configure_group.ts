import {
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

type Config = {
  PROGRAM_ID: string;
  GROUP: PublicKey;
  ADMIN_GENERAL: PublicKey;
  EMODE_ADMIN: PublicKey;
  CURVE_ADMIN: PublicKey;
  LIMIT_ADMIN: PublicKey;
  EMISS_ADMIN: PublicKey;
  META_ADMIN: PublicKey;
  RISK_ADMIN: PublicKey;

  MULTISIG?: PublicKey;
};

const config: Config = {
  PROGRAM_ID: "MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA",
  GROUP: new PublicKey("4qp6Fx6tnZkY5Wropq9wUYgtFxXKwE6viZxFHg3rdAG8"),
  ADMIN_GENERAL: new PublicKey("CYXEgwbPHu2f9cY3mcUkinzDoDcsSan7myh1uBvYRbEw"),
  EMODE_ADMIN: new PublicKey("CYXEgwbPHu2f9cY3mcUkinzDoDcsSan7myh1uBvYRbEw"),
  CURVE_ADMIN: new PublicKey("BACjgGYJYwVRRpnHJfcjykfkp2Xu118ghx5fYL1wgY7p"),
  LIMIT_ADMIN: new PublicKey("BACjgGYJYwVRRpnHJfcjykfkp2Xu118ghx5fYL1wgY7p"),
  EMISS_ADMIN: new PublicKey("BACjgGYJYwVRRpnHJfcjykfkp2Xu118ghx5fYL1wgY7p"),
  META_ADMIN: new PublicKey("BACjgGYJYwVRRpnHJfcjykfkp2Xu118ghx5fYL1wgY7p"),
  RISK_ADMIN: new PublicKey("BACjgGYJYwVRRpnHJfcjykfkp2Xu118ghx5fYL1wgY7p"),

  MULTISIG: new PublicKey("CYXEgwbPHu2f9cY3mcUkinzDoDcsSan7myh1uBvYRbEw"),
};

async function main() {
  const user = commonSetup(
    sendTx,
    config.PROGRAM_ID,
    "/keys/staging-deploy.json",
    config.MULTISIG,
    "current"
  );
  const program = user.program;
  const connection = user.connection;
  console.log("setting emode admin to: " + config.EMODE_ADMIN.toString());

  let groupBefore = await program.account.marginfiGroup.fetch(config.GROUP);
  const transaction = new Transaction();
  transaction.add(
    await program.methods
      .marginfiGroupConfigure(
        config.ADMIN_GENERAL,
        config.EMODE_ADMIN,
        config.CURVE_ADMIN,
        config.LIMIT_ADMIN,
        config.EMISS_ADMIN,
        config.META_ADMIN,
        config.RISK_ADMIN,
        false
      )
      .accounts({
        marginfiGroup: config.GROUP,
      })
      .instruction()
  );

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

    let groupAfter = await program.account.marginfiGroup.fetch(config.GROUP);
    console.log("Group " + config.GROUP);
    console.log("new admin: " + groupAfter.admin + " was " + groupBefore.admin);
    console.log(
      "new emode admin: " +
        groupAfter.emodeAdmin +
        " was " +
        groupBefore.emodeAdmin
    );
  } else {
    transaction.feePayer = config.MULTISIG;
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

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
  });
}
