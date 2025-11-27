import {
  AddressLookupTableProgram,
  Connection,
  PublicKey,
  SYSVAR_RENT_PUBKEY,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";

import {
  DEFAULT_API_URL,
  loadEnvFile,
  loadKeypairFromFile,
} from "../scripts/utils";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";

/**
 * If true, send the tx. If false, output the unsigned b58 tx to console.
 */
const sendTx = true;

// TODO support deduping accross multiple LUTs and add the first non-full LUT

type Config = {
  LUT: PublicKey;
  KEYS: PublicKey[];
};

const config: Config = {
  LUT: new PublicKey("FtQ5uKQvFoKQ27SWY15tgBeJQnGKmKGzWqDz7kGUbeiq"),
  KEYS: [
    new PublicKey("52AJuRJJcejMYS9nNDCk1vYmyG1uHSsXoSPkctS3EfhA"),
    new PublicKey("4eFzqYFZr2UnWQqSfwZxB4r1W1kSJ9XG6M6H17Eq4x2Z"),
    new PublicKey("jLfQHXX6hNnGBECzDraZFZTtFYNXaYzw817eAzGMXUP"),
    // new PublicKey("E1dNntvZo6pXmkZq43wommAdxe6qF1wcXkjz2M2QEb14"),
    // new PublicKey("AHTqUF4LyDxCnpHWL89RjsJWGEGXKSYyQPWx3fUAcj1H"),
    // new PublicKey("8nUGEsT5VJijkpnn6fJXWTyyZjExhwipFuDyotqwyzhz"),
    // new PublicKey("89LuR6urx9wMxeJtf3LCdq84LsgM22Sp6fWqPbCuZtUr"),
    // new PublicKey("74KM1fwNm9WP39UH7QsCs4dvkN6RaZT52U9f4tnkJtom"),
    // new PublicKey("5LTAowCUEK5rr2ALKtk6cTHhyaPTCbksV5C3pCqLKSVu"),
    // new PublicKey("5HxHAW3BCYPB2uRMrjKpgA6mSpwHPK1JrntWZU4QZpZ1"),
  ],
};

async function main() {
  await updateLut(sendTx, config, "/.config/stage/id.json");
}

export async function updateLut(
  sendTx: boolean,
  config: Config,
  walletPath: string
) {
  loadEnvFile(".env.api");
  const apiUrl = process.env.API_URL || DEFAULT_API_URL;
  console.log("api: " + apiUrl);
  const connection = new Connection(apiUrl, "confirmed");
  const wallet = loadKeypairFromFile(process.env.HOME + walletPath);

  const transaction = new Transaction();

  const lutAccount = await connection.getAddressLookupTable(config.LUT);
  if (!lutAccount.value) {
    throw new Error("Failed to fetch the lookup table account");
  }

  // Extract the existing addresses from the lookup table
  const existingAddresses = lutAccount.value.state.addresses;
  const existingSet = new Set(
    existingAddresses.map((addr: PublicKey) => addr.toBase58())
  );

  // Filter out keys that are already in the lookup table
  const keysToAdd = config.KEYS.filter(
    (key) => !existingSet.has(key.toBase58())
  );
  if (keysToAdd.length === 0) {
    console.log(
      "No new keys to add, lookup table is already up to date, aborting."
    );
    return;
  } else {
    console.log("Adding the following new keys, others already in the LUT");
    for (let i = 0; i < keysToAdd.length; i++) {
      console.log("[" + i + "] " + keysToAdd[i]);
    }
    console.log("");
  }

  // Create the instruction to extend the lookup table with the deduped keys
  const extendIx = AddressLookupTableProgram.extendLookupTable({
    authority: wallet.publicKey,
    lookupTable: config.LUT,
    payer: wallet.publicKey,
    addresses: keysToAdd,
  });
  transaction.add(extendIx);

  if (sendTx) {
    try {
      const signature = await sendAndConfirmTransaction(
        connection,
        transaction,
        [wallet]
      );
      console.log("Transaction signature:", signature);
    } catch (error) {
      console.error("Transaction failed:", error);
    }
  } else {
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    const serializedTransaction = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: true,
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
