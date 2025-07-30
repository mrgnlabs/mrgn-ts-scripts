import { AccountMeta, PublicKey, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import { commonSetup } from "../lib/common-setup";

type Config = {
  PROGRAM_ID: string;
  GROUP: PublicKey;
  BANK_KEYS: PublicKey[];
  ORACLE?: PublicKey;
};

const config: Config = {
  PROGRAM_ID: "MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA",
  GROUP: new PublicKey("4qp6Fx6tnZkY5Wropq9wUYgtFxXKwE6viZxFHg3rdAG8"),
  BANK_KEYS: [
    new PublicKey("8g5qG6PVygcVSXV1cJnjXaD1yhrDwcWAMQCY2wR9VuAf"),
    // Up to ~30 banks per script execution
  ],
  // only required if changing the oracle, otherwise leave as undefined...
  ORACLE: new PublicKey("7UVimffxr9ow1uXYxsr4LHAcV58mLzhmwaeKvJ1pjLiE"),
  // ORACLE: undefined,
};

async function main() {
  const user = commonSetup(true, config.PROGRAM_ID, "/keys/staging-deploy.json", undefined);
  const program = user.program;
  const connection = user.connection;

  const transaction = new Transaction();
  let [stakedSettingsKey] = deriveStakedSettings(program.programId, config.GROUP);
  let remainingAccounts: AccountMeta[] = [];
  if (config.ORACLE) {
    console.log("updating oracle to: " + config.ORACLE);
    const oracleMeta: AccountMeta = {
      pubkey: config.ORACLE,
      isSigner: false,
      isWritable: false,
    };
    remainingAccounts.push(oracleMeta);
  }
  for (const bankKey of config.BANK_KEYS) {
    const ix = await program.methods
      .propagateStakedSettings()
      .accounts({
        // feeState: derived automatically from static PDA
        stakedSettings: stakedSettingsKey,
        bank: bankKey,
      })
      .remainingAccounts(remainingAccounts)
      .instruction();

    transaction.add(ix);
  }

  try {
    const signature = await sendAndConfirmTransaction(connection, transaction, [user.wallet.payer]);
    console.log("Transaction signature:", signature);
  } catch (error) {
    console.error("Transaction failed:", error);
  }
}

// TODO remove after package updates
const deriveStakedSettings = (programId: PublicKey, group: PublicKey) => {
  return PublicKey.findProgramAddressSync([Buffer.from("staked_settings", "utf-8"), group.toBuffer()], programId);
};

main().catch((err) => {
  console.error(err);
});
