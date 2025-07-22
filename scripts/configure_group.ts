import { PublicKey, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { commonSetup } from "../lib/common-setup";

/**
 * If true, send the tx. If false, output the unsigned b58 tx to console.
 */
const sendTx = true;

type Config = {
  PROGRAM_ID: string;
  GROUP: PublicKey;
  ADMIN_KEY_NEW: PublicKey;
  EMODE_ADMIN_NEW: PublicKey;
  MULTISIG?: PublicKey;
};

const config: Config = {
  PROGRAM_ID: "stag8sTKds2h4KzjUw3zKTsxbqvT4XKHdaR9X9E6Rct",
  GROUP: new PublicKey("FCPfpHA69EbS8f9KKSreTRkXbzFpunsKuYf5qNmnJjpo"),
  ADMIN_KEY_NEW: new PublicKey("mfC1LoEk4mpM5yx1LjwR9QLZQ49AitxxWkK5Aciw7ZC"),
  EMODE_ADMIN_NEW: new PublicKey("D2pmFFwe5RHcAqbN7uWabPX7TnzpXxpPLf6tu3rLZzhp"),

  MULTISIG: new PublicKey("CYXEgwbPHu2f9cY3mcUkinzDoDcsSan7myh1uBvYRbEw"),
};

async function main() {
  const user = commonSetup(sendTx, config.PROGRAM_ID, "/keys/staging-deploy.json", config.MULTISIG);
  const program = user.program;
  const connection = user.connection;
  console.log("setting emode admin to: " + config.EMODE_ADMIN_NEW.toString());

  let groupBefore = await program.account.marginfiGroup.fetch(config.GROUP);
  const transaction = new Transaction();
  transaction.add(
    await program.methods
      .marginfiGroupConfigure(config.ADMIN_KEY_NEW, config.EMODE_ADMIN_NEW, false)
      .accounts({
        marginfiGroup: config.GROUP,
      })
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

  let groupAfter = await program.account.marginfiGroup.fetch(config.GROUP);
  console.log("Group " + config.GROUP);
  console.log("new admin: " + groupAfter.admin + " was " + groupBefore.admin);
  console.log("new emode admin: " + groupAfter.emodeAdmin + " was " + groupBefore.emodeAdmin);
}

main().catch((err) => {
  console.error(err);
});
