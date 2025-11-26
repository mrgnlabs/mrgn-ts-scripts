import { PublicKey, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import { commonSetup } from "../lib/common-setup";

const sendTx = true;

type Config = {
  PROGRAM_ID: string;
  ACCOUNT: PublicKey;
};

const config: Config = {
  PROGRAM_ID: "MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA",
  ACCOUNT: new PublicKey("SvABoHi4D71ZsYp4KtUoATz8jz5oaRSvtseWvMDHXJG"),
};

async function main() {
  await closeAccount(sendTx, config, "/.config/stage/id.json");
}

export async function closeAccount(sendTx: boolean, config: Config, walletPath: string, version?: "current") {
  const user = commonSetup(
    sendTx,
    config.PROGRAM_ID,
    walletPath,
    undefined,
    version
  );
  const program = user.program;
  const connection = user.connection;

  const transaction = new Transaction().add(
    await program.methods
      .marginfiAccountClose()
      .accounts({
        marginfiAccount: config.ACCOUNT,
      })
      .instruction()
  );

  try {
    const signature = await sendAndConfirmTransaction(connection, transaction, [user.wallet.payer]);
    console.log("Transaction signature:", signature);
  } catch (error) {
    console.error("Transaction failed:", error);
  }
}

main().catch((err) => {
  console.error(err);
});
