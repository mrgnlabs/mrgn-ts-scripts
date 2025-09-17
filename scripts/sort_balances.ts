import {
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { commonSetup } from "../lib/common-setup";

type Config = {
  PROGRAM_ID: string;
  ACCOUNT: PublicKey;
};
const config: Config = {
  PROGRAM_ID: "MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA",
  ACCOUNT: new PublicKey("FEK5G85noQnYcvBjA58anuUPC9M1pJsPW8bEVurK8QRh"),
};

async function main() {
  const user = commonSetup(true, config.PROGRAM_ID, "/.config/solana/id.json");
  const program = user.program;

  const transaction = new Transaction().add(
    await program.methods
      .lendingAccountSortBalances()
      .accounts({
        marginfiAccount: config.ACCOUNT,
      })
      .instruction()
  );

  try {
    const signature = await sendAndConfirmTransaction(
      user.connection,
      transaction,
      [user.wallet.payer]
    );
    console.log("Transaction signature:", signature);
  } catch (error) {
    console.error("Transaction failed:", error);
  }
}

main().catch((err) => {
  console.error(err);
});
