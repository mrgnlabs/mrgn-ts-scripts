import {
  Keypair,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { commonSetup } from "../lib/common-setup";

const sendTx = true;

type Config = {
  PROGRAM_ID: string;
  ACCOUNT: PublicKey;
  OLD_AUTHORITY: PublicKey;
  NEW_AUTHORITY: PublicKey;
  /** H4QMTHMVbJ3KrB5bz573cBBZKoYSZ2B4mSST1JKzPUrH on staging, typically the MS on the mainnet  */
  GLOBAL_FEE_WALLET: PublicKey;

  MULTISIG: PublicKey;
};

const config: Config = {
  PROGRAM_ID: "stag8sTKds2h4KzjUw3zKTsxbqvT4XKHdaR9X9E6Rct",
  ACCOUNT: new PublicKey("12W8kr21RZX3tLR8CxZvnqo8fgFirKF3gNhAwSmhsuCg"),
  OLD_AUTHORITY: new PublicKey("H4QMTHMVbJ3KrB5bz573cBBZKoYSZ2B4mSST1JKzPUrH"),
  NEW_AUTHORITY: new PublicKey("CYXEgwbPHu2f9cY3mcUkinzDoDcsSan7myh1uBvYRbEw"),
  GLOBAL_FEE_WALLET: new PublicKey(
    "H4QMTHMVbJ3KrB5bz573cBBZKoYSZ2B4mSST1JKzPUrH"
  ),

  MULTISIG: PublicKey.default,
};

async function main() {
  const user = commonSetup(
    sendTx,
    config.PROGRAM_ID,
    "/keys/phantom-wallet.json",
    config.MULTISIG,
    "current"
  );
  const program = user.program;
  const connection = user.connection;

  const newAcc = Keypair.generate();

  let tx = new Transaction().add(
    await program.methods
      .transferToNewAccount()
      .accounts({
        oldMarginfiAccount: config.ACCOUNT,
        newMarginfiAccount: newAcc.publicKey,
        newAuthority: config.NEW_AUTHORITY,
        globalFeeWallet: config.GLOBAL_FEE_WALLET,
      })
      .accountsPartial({
        authority: config.OLD_AUTHORITY,
      })
      .instruction()
  );
  console.log("Moving account: " + config.ACCOUNT + " to " + newAcc.publicKey);

  if (sendTx) {
    try {
      const signature = await sendAndConfirmTransaction(connection, tx, [
        user.wallet.payer,
        newAcc,
      ]);
      console.log("Transaction signature:", signature);
    } catch (error) {
      console.error("Transaction failed:", error);
    }
  } else {
    // NOTE: this current cannot work unless the ephemeral keypair we just created can sign too!
    tx.feePayer = config.MULTISIG; // Set the fee payer to Squads wallet
    const { blockhash } = await connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;
    const serializedTransaction = tx.serialize({
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
