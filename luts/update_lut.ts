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
  LUT: new PublicKey("DP9JAbtatfCrSAJQiWZUmWTfgHCnuWsx1QBczi1mnuxW"),
  KEYS: [
    new PublicKey("4C9r6qeen5pbAC4ikJaQXBJmWg1LyYJAbUCnt1nkj6ry"),
    new PublicKey("9Soyj6oY8cZFJHYU8cmDhWgcwDbno3se4moGgMEhuZDg"),
    new PublicKey("7VqrFFXqxzBLpn6NzfnnpG8Kna7nz9KyXL2YQDL1zdnm"),
    new PublicKey("GnH7eBWuKTyDG9JW8fmR4Bk4ZV1m1HS4BXdTdZHd5bPv"),
    new PublicKey("GZCxKMwvXu4p13FC744qADcvfPxAJnBBJHjvaatEF8oT"),
    new PublicKey("9vdudXJYeMjfku4bFWP5JWfZV1mhjxFdeAhztyqvEQBH"),
    new PublicKey("AustgHiakLqDhC7NyrSrKEmYVL4MMf29heQMNaxa6fp2"),
    new PublicKey("Gwbzve6wx2E4iDSjigHcNpP1MvNED8Xh7m5DNmaUgS8H"),
    new PublicKey("8jcuMewhndxQ5XdUngaddSkJ4C9wE58gK1nsHZb9dDPb"),
    new PublicKey("BgfHEvVwMJfpXJ23XDAdmnbypeRCTy7SqfVfkp1wa6K8"),

        new PublicKey("9NwSk5T15JC2ktayeQgnXfVLVTbvDi3FpEGGghq1aSfd"),
    new PublicKey("29CH2F1wnbL6GZMXyjkCaMahUKWvaVP4xN117iYsZSgz"),
    new PublicKey("2keKRVdffHCVuPtKePvoFU1QpYtDpbxK18hoeF3tj5Wr"),
    new PublicKey("BebgJJZy4J89rwYoPxajBPXbAJXvR9XsW7UaNabQkwMm"),
    new PublicKey("2YxZEzrRqzgAGyeZ87UJmJMNALpm7jmFGJ2byHmQBg8E"),
    new PublicKey("6kK5HoQP5ioDCc1FpMmFws2wa92RxHmErxLnfTmEgQpm"),
    new PublicKey("5JgVnYSnuiSLaV6M6rgQCzV6bgBZyihTDwgTUBDuNBXQ"),
    new PublicKey("6JoJzUXZiuncwor1wGp6chE7SByLAxqyseDBcriRayha"),
    new PublicKey("4Dy49NyXrZG4F1i4sBz5Ypzq1qhWTHAjhHD52bAuBLAA"),
    new PublicKey("4G1KLGwZrTLT4DghhuGqUtv39qapprnuxDXaYJAfACat"),
  ],
};

async function main() {
  loadEnvFile(".env.api");
  const apiUrl = process.env.API_URL || DEFAULT_API_URL;
  console.log("api: " + apiUrl);
  const connection = new Connection(apiUrl, "confirmed");
  const wallet = loadKeypairFromFile(
    process.env.HOME + "/keys/staging-shared.json"
  );

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

main().catch((err) => {
  console.error(err);
});
