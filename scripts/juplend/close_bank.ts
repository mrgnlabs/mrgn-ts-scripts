import {
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { commonSetup } from "../../lib/common-setup";
import { bs58 } from "@switchboard-xyz/common";

const sendTx = true;

type Config = {
  PROGRAM_ID: string;
  BANK: PublicKey;
  MULTISIG_PAYER?: PublicKey;
};

const config: Config = {
  PROGRAM_ID: "stag8sTKds2h4KzjUw3zKTsxbqvT4XKHdaR9X9E6Rct",
  BANK: new PublicKey("8qPLKaKb4F5BC6mVncKAryMp78yp5ZRGYnPkQbt9ikKt"),
};

async function main() {
  await closeJuplendBank(sendTx, config, "/.config/stage/id.json");
}

export async function closeJuplendBank(
  sendTx: boolean,
  config: Config,
  walletPath: string,
  version?: "current",
) {
  const user = commonSetup(
    sendTx,
    config.PROGRAM_ID,
    walletPath,
    config.MULTISIG_PAYER,
    version,
  );
  const program = user.program;
  const connection = user.connection;

  console.log("=== Close JupLend Bank ===\n");
  console.log("Bank:", config.BANK.toString());
  console.log();

  const transaction = new Transaction().add(
    await program.methods
      .lendingPoolCloseBank()
      .accounts({
        bank: config.BANK,
      })
      .instruction(),
  );

  if (sendTx) {
    try {
      const signature = await sendAndConfirmTransaction(
        connection,
        transaction,
        [user.wallet.payer],
      );
      console.log("Transaction signature:", signature);
      console.log("Bank closed!");
    } catch (error) {
      console.error("Transaction failed:", error);
    }
  } else {
    transaction.feePayer = config.MULTISIG_PAYER;
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    const serializedTransaction = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    });
    const base58Transaction = bs58.encode(serializedTransaction);
    console.log("bank key: " + config.BANK);
    console.log("Base58-encoded transaction:", base58Transaction);
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
  });
}
