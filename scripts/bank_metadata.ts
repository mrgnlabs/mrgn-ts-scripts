import {
  PublicKey,
  SystemProgram,
  Transaction,
  VersionedTransaction,
  TransactionMessage,
} from "@solana/web3.js";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { commonSetup } from "../lib/common-setup";

const sendTx = true;

export type BankMetadataEntry = {
  bank: PublicKey;
  ticker: string;
  /**
   * For staked collateral banks, include validator vote account here.
   * Example: "validatorVoteAccount:5ZWgXcyqrrNpQHCme5SdC5hCeYb2o3fEJhF7Gok3bTVN"
   */
  description: string;
};

export type Config = {
  PROGRAM_ID: string;
  GROUP: PublicKey;

  /**
   * Exclude if not using MS
   */
  MULTISIG_PAYER?: PublicKey;

  /**
   * Array of banks and their corresponding metadata.
   */
  BANKS: BankMetadataEntry[];
};

const config: Config = {
  PROGRAM_ID: "stag8sTKds2h4KzjUw3zKTsxbqvT4XKHdaR9X9E6Rct",
  GROUP: new PublicKey("Diu1q9gniR1qR4Daaej3rcHd6949HMmxLGsnQ94Z3rLz"),
  // GROUP: new PublicKey("Diu1q9gniR1qR4Daaej3rcHd6949HMmxLGsnQ94Z3rLz"),

  BANKS: [
    {
      bank: new PublicKey("4VruFgvunJcU1C23tAXWQbfuXT4P97vDm9fXzTvMrFLG"),
      ticker: "TEST",
      description: "Test Bank - Staging",
    },
  ],
};

/**
 * Derives the metadata PDA for a given bank.
 * Seeds: ["metadata", bank_pubkey]
 */
function deriveBankMetadataPda(
  programId: PublicKey,
  bank: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("metadata", "utf-8"), bank.toBuffer()],
    programId
  );
}

async function main() {
  await writeBankMetadata(sendTx, config, "/.config/stage/id.json");
}

export async function writeBankMetadata(
  sendTx: boolean,
  config: Config,
  walletPath: string
) {
  if (config.BANKS.length === 0) {
    throw new Error("Config.BANKS is empty - nothing to do.");
  }

  const user = commonSetup(sendTx, config.PROGRAM_ID, walletPath, config.MULTISIG_PAYER, "current");
  const program = user.program;
  const connection = user.connection;
  const programId = new PublicKey(config.PROGRAM_ID);

  console.log(`Processing ${config.BANKS.length} banks...`);
  console.log(`Group: ${config.GROUP.toBase58()}`);
  console.log(`Wallet: ${user.wallet.publicKey.toBase58()}`);
  console.log("");

  for (let i = 0; i < config.BANKS.length; i++) {
    const entry = config.BANKS[i];
    console.log(`\n[${i + 1}/${config.BANKS.length}] Bank: ${entry.bank.toBase58()}`);
    console.log(`  Ticker: ${entry.ticker}`);
    console.log(`  Description: ${entry.description}`);

    const payerKey = sendTx
      ? user.wallet.publicKey
      : config.MULTISIG_PAYER ??
      (() => {
        throw new Error("MULTISIG_PAYER must be set when sendTx = false");
      })();

    const [metadataPda] = deriveBankMetadataPda(programId, entry.bank);
    console.log(`  Metadata PDA: ${metadataPda.toBase58()}`);

    // Check if metadata account exists
    const metadataAccountInfo = await connection.getAccountInfo(metadataPda);
    const needsInit = metadataAccountInfo === null;

    if (needsInit) {
      console.log("  Metadata account does not exist. Initializing...");

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
        const v0Message = new TransactionMessage({
          payerKey,
          recentBlockhash: blockhash,
          instructions: [initIx],
        }).compileToV0Message();
        const v0Tx = new VersionedTransaction(v0Message);

        v0Tx.sign([user.wallet.payer]);
        const signature = await connection.sendTransaction(v0Tx, {
          maxRetries: 2,
        });
        await connection.confirmTransaction(
          { signature, blockhash, lastValidBlockHeight },
          "confirmed"
        );
        console.log(`  initBankMetadata tx: ${signature}`);
      } else {
        let transaction = new Transaction().add(initIx);
        transaction.feePayer = config.MULTISIG_PAYER;
        transaction.recentBlockhash = blockhash;
        const serializedTransaction = transaction.serialize({
          requireAllSignatures: false,
          verifySignatures: false,
        });
        const base58Transaction = bs58.encode(serializedTransaction);
        console.log("  initBankMetadata Base58 tx:", base58Transaction);
      }
    } else {
      console.log("  Metadata account already exists. Skipping init.");
    }

    // Now write the metadata
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

    const { blockhash: writeBlockhash, lastValidBlockHeight: writeLastValidBlockHeight } =
      await connection.getLatestBlockhash();

    if (sendTx) {
      const v0Message = new TransactionMessage({
        payerKey,
        recentBlockhash: writeBlockhash,
        instructions: [writeIx],
      }).compileToV0Message();
      const v0Tx = new VersionedTransaction(v0Message);

      v0Tx.sign([user.wallet.payer]);
      const signature = await connection.sendTransaction(v0Tx, {
        maxRetries: 2,
      });
      await connection.confirmTransaction(
        { signature, blockhash: writeBlockhash, lastValidBlockHeight: writeLastValidBlockHeight },
        "confirmed"
      );
      console.log(`  writeBankMetadata tx: ${signature}`);
    } else {
      let transaction = new Transaction().add(writeIx);
      transaction.feePayer = config.MULTISIG_PAYER;
      transaction.recentBlockhash = writeBlockhash;
      const serializedTransaction = transaction.serialize({
        requireAllSignatures: false,
        verifySignatures: false,
      });
      const base58Transaction = bs58.encode(serializedTransaction);
      console.log("  writeBankMetadata Base58 tx:", base58Transaction);
    }

    console.log(`  Done with bank ${entry.bank.toBase58()}`);
  }

  console.log("\nAll banks processed.");
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
  });
}
