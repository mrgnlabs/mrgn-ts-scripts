import {
  PublicKey,
  Transaction,
  VersionedTransaction,
  TransactionMessage,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { bs58 } from "@switchboard-xyz/common";
import { readFileSync } from "fs";
import { join } from "path";
import { commonSetup } from "../../lib/common-setup";
import { parseConfig, Config } from "./lib/utils";
import { deriveBankWithSeed } from "../common/pdas";

const sendTx = true;

function deriveBankMetadataPda(
  programId: PublicKey,
  bank: PublicKey,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("metadata", "utf-8"), bank.toBuffer()],
    programId,
  );
}

async function main() {
  const configFile = process.argv[2];
  if (!configFile) {
    console.error(
      "Usage: tsx scripts/juplend/bank_metadata.ts <config-file>",
    );
    console.error(
      "Example: tsx scripts/juplend/bank_metadata.ts configs/stage/usdc.json",
    );
    process.exit(1);
  }

  const configPath = join(__dirname, configFile);
  const rawConfig = readFileSync(configPath, "utf8");
  const config = parseConfig(rawConfig);

  if (!config.TICKER || !config.DESCRIPTION) {
    console.error(
      "Config must include 'ticker' and 'description' fields.",
    );
    process.exit(1);
  }

  await writeBankMetadata(
    sendTx,
    config,
    "/keys/staging-deploy.json",
  );
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

  const payerKey = sendTx
    ? user.wallet.publicKey
    : config.MULTISIG_PAYER;

  if (!payerKey) {
    throw new Error(
      "MULTISIG_PAYER must be set when sendTx = false",
    );
  }

  // Derive bank PDA from config
  const [bank] = deriveBankWithSeed(
    programId,
    config.GROUP_KEY,
    config.BANK_MINT,
    config.SEED,
  );

  const ticker = config.TICKER!;
  const description = config.DESCRIPTION!;

  console.log("=== JupLend Bank Metadata ===\n");
  console.log("Program:", config.PROGRAM_ID);
  console.log("Group:", config.GROUP_KEY.toString());
  console.log("Bank:", bank.toString());
  console.log("Mint:", config.BANK_MINT.toString());
  console.log("Ticker:", ticker);
  console.log("Description:", description);
  console.log();

  const [metadataPda] = deriveBankMetadataPda(
    programId,
    bank,
  );
  console.log("Metadata PDA:", metadataPda.toString());

  // Check if metadata account already exists
  const metadataInfo =
    await connection.getAccountInfo(metadataPda);

  if (!metadataInfo) {
    console.log("Initializing metadata account...");

    const initIx = await program.methods
      .initBankMetadata()
      .accounts({
        bank,
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
      console.log("initBankMetadata:", sig);
    } else {
      const tx = new Transaction().add(initIx);
      tx.feePayer = config.MULTISIG_PAYER;
      tx.recentBlockhash = blockhash;
      const serialized = tx.serialize({
        requireAllSignatures: false,
        verifySignatures: false,
      });
      console.log(
        "initBankMetadata b58:",
        bs58.encode(serialized),
      );
    }
  } else {
    console.log(
      "Metadata account exists, skipping init.",
    );
  }

  // Write metadata
  console.log("Writing metadata...");

  const tickerBytes = Buffer.from(ticker, "utf-8");
  const descriptionBytes = Buffer.from(
    description,
    "utf-8",
  );

  const writeIx = await program.methods
    .writeBankMetadata(tickerBytes, descriptionBytes)
    .accountsPartial({
      group: config.GROUP_KEY,
      bank,
      metadataAdmin: payerKey,
      metadata: metadataPda,
    })
    .instruction();

  const {
    blockhash: writeBlockhash,
    lastValidBlockHeight: writeLastValid,
  } = await connection.getLatestBlockhash();

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
    console.log("writeBankMetadata:", sig);
  } else {
    const tx = new Transaction().add(writeIx);
    tx.feePayer = config.MULTISIG_PAYER;
    tx.recentBlockhash = writeBlockhash;
    const serialized = tx.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    });
    console.log(
      "writeBankMetadata b58:",
      bs58.encode(serialized),
    );
  }

  console.log("\nDone.");
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
  });
}
