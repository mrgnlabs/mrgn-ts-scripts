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
    // new PublicKey("Dso1bDeDjCQxTrWHqUUi63oBvV7Mdm6WaobLbQ7gnPQ"),
    // new PublicKey("AEq1mcpesN4u9CSd8uUQbQar6qLghNQx7rnhdQhAnUyn"),

    new PublicKey("4qp6Fx6tnZkY5Wropq9wUYgtFxXKwE6viZxFHg3rdAG8"),
    new PublicKey("CwbdVVmGfR4H9bQ39vmeKjt9Gd128iFGrc9Jvht2oPx6"),
    new PublicKey("3x85u7SWkmmr7YQGYhtjARgxwegTLJgkSLRprfXod6rh"),
    new PublicKey("5kLrcBhm66VLvGKT4my82uSKG5vQyAcyQADgnQ4rinLi"),
    new PublicKey("7RiMUsA8KaSkq2KzZPSKAsSyXZ38PCXbVrWgh468dcsd"),
    new PublicKey("CtFbocisXmWnTvCUEqZHGwW4MwyAsZxLZGrhLhn9BpK2"),
    new PublicKey("Fx2zxMQsL3Dck7j8GAG4397Rc7woRezJPAhHumphP1e"),
    new PublicKey("W1Hja1hhpzFy16WUCcQcnCZxuo5xThNex9c41vXM2DF"),
    new PublicKey("EADW8iFEsyfuXuBjETVE27kK5yrpfJNqJ5usgm3ehinH"),
    new PublicKey("5pBHde9B7n8dZoLTGB4N9WWBawJ8BeQdj17QkrqXXtrr"),
    new PublicKey("GZ8GGS89K6XUDTRESNjWvgRkvsMui6TZn689c6E28Fe4"),
    new PublicKey("4Hmd6PdjVA9auCoScE12iaBogfwS4ZXQ6VZoBeqanwWW"),
  ],
};

async function main() {
  await updateLut(sendTx, config, "/.keys/staging-lut-admin.json");
}

export async function updateLut(
  sendTx: boolean,
  config: Config,
  walletPath: string,
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
    existingAddresses.map((addr: PublicKey) => addr.toBase58()),
  );

  // Filter out keys that are already in the lookup table
  const keysToAdd = config.KEYS.filter(
    (key) => !existingSet.has(key.toBase58()),
  );
  if (keysToAdd.length === 0) {
    console.log(
      "No new keys to add, lookup table is already up to date, aborting.",
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
        [wallet],
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
