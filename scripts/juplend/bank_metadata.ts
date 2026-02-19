import {
  PublicKey,
  Transaction,
  VersionedTransaction,
  TransactionMessage,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { bs58 } from "@switchboard-xyz/common";
import { commonSetup } from "../../lib/common-setup";

const sendTx = false;

type BankMetadataEntry = {
  bank: PublicKey;
  ticker: string;
  description: string;
};

type Config = {
  PROGRAM_ID: string;
  GROUP: PublicKey;
  BANKS: BankMetadataEntry[];
  MULTISIG_PAYER?: PublicKey;
};

/**
 * Seeds: ["metadata", bank]
 */
function deriveBankMetadataPda(
  programId: PublicKey,
  bank: PublicKey,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("metadata", "utf-8"), bank.toBuffer()],
    programId,
  );
}

// Edit this config for your deployment
const config: Config = {
  PROGRAM_ID: "stag8sTKds2h4KzjUw3zKTsxbqvT4XKHdaR9X9E6Rct",
  GROUP: new PublicKey("4qp6Fx6tnZkY5Wropq9wUYgtFxXKwE6viZxFHg3rdAG8"),
  BANKS: [
    // Add entries here. ticker and description are utf-8 strings.
    // Example:
    // {
    //   bank: new PublicKey("<BANK_ADDRESS>"),
    //   ticker: "USDC | USD Coin",
    //   description: "USD Coin | Stablecoin | USDC | JupLend",
    // },
  ],
};

async function main() {
  if (config.BANKS.length === 0) {
    console.error("No banks configured. Edit the config object.");
    process.exit(1);
  }

  await writeBankMetadata(sendTx, config, "/keys/staging-deploy.json");
}

export async function writeBankMetadata(
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
  const programId = new PublicKey(config.PROGRAM_ID);

  const payerKey = sendTx ? user.wallet.publicKey : config.MULTISIG_PAYER;

  if (!payerKey) {
    throw new Error("MULTISIG_PAYER must be set when sendTx = false");
  }

  console.log("=== JupLend Bank Metadata ===\n");
  console.log("Program:", config.PROGRAM_ID);
  console.log("Group:", config.GROUP.toString());
  console.log("Banks:", config.BANKS.length);
  console.log();

  for (let i = 0; i < config.BANKS.length; i++) {
    const entry = config.BANKS[i];
    console.log(`[${i + 1}/${config.BANKS.length}] ${entry.bank.toString()}`);
    console.log("  Ticker:", entry.ticker);
    console.log("  Description:", entry.description);

    const [metadataPda] = deriveBankMetadataPda(programId, entry.bank);
    console.log("  Metadata PDA:", metadataPda.toString());

    // Check if metadata account already exists
    const metadataInfo = await connection.getAccountInfo(metadataPda);

    if (!metadataInfo) {
      console.log("  Initializing metadata account...");

      const initIx = await program.methods
        .initBankMetadata()
        .accounts({
          bank: entry.bank,
          feePayer: payerKey,
        })
        .instruction();

      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash();

      if (sendTx) {
        const msg = new TransactionMessage({
          payerKey,
          recentBlockhash: blockhash,
          instructions: [initIx],
        }).compileToV0Message();
        const vtx = new VersionedTransaction(msg);
        vtx.sign([user.wallet.payer]);
        const sig = await connection.sendTransaction(vtx, {
          maxRetries: 2,
        });
        await connection.confirmTransaction(
          { signature: sig, blockhash, lastValidBlockHeight },
          "confirmed",
        );
        console.log("  initBankMetadata:", sig);
      } else {
        const tx = new Transaction().add(initIx);
        tx.feePayer = config.MULTISIG_PAYER;
        tx.recentBlockhash = blockhash;
        const serialized = tx.serialize({
          requireAllSignatures: false,
          verifySignatures: false,
        });
        console.log("  initBankMetadata b58:", bs58.encode(serialized));
      }
    } else {
      console.log("  Metadata account exists, skipping init.");
    }

    // Write metadata
    console.log("  Writing metadata...");

    const tickerBytes = Buffer.from(entry.ticker, "utf-8");
    const descriptionBytes = Buffer.from(entry.description, "utf-8");

    const writeIx = await program.methods
      .writeBankMetadata(tickerBytes, descriptionBytes)
      .accountsPartial({
        group: config.GROUP,
        bank: entry.bank,
        metadataAdmin: payerKey,
        metadata: metadataPda,
      })
      .instruction();

    const { blockhash: writeBlockhash, lastValidBlockHeight: writeLastValid } =
      await connection.getLatestBlockhash();

    if (sendTx) {
      const msg = new TransactionMessage({
        payerKey,
        recentBlockhash: writeBlockhash,
        instructions: [writeIx],
      }).compileToV0Message();
      const vtx = new VersionedTransaction(msg);
      vtx.sign([user.wallet.payer]);
      const sig = await connection.sendTransaction(vtx, {
        maxRetries: 2,
      });
      await connection.confirmTransaction(
        {
          signature: sig,
          blockhash: writeBlockhash,
          lastValidBlockHeight: writeLastValid,
        },
        "confirmed",
      );
      console.log("  writeBankMetadata:", sig);
    } else {
      const tx = new Transaction().add(writeIx);
      tx.feePayer = config.MULTISIG_PAYER;
      tx.recentBlockhash = writeBlockhash;
      const serialized = tx.serialize({
        requireAllSignatures: false,
        verifySignatures: false,
      });
      console.log("  writeBankMetadata b58:", bs58.encode(serialized));
    }

    console.log("  Done.");
    console.log();
  }

  console.log("All banks processed.");
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
  });
}
