import {
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import fetch from "node-fetch";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { commonSetup } from "../lib/common-setup";
import {
  findPythPushOracleAddress,
  loadSponsoredOracle,
} from "../lib/pyth-oracle-helpers";
import {
  PYTH_PUSH_ORACLE_ID,
  PYTH_SPONSORED_SHARD_ID,
} from "@mrgnlabs/marginfi-client-v2";

/**
 * This script fetches all banks from a JSON cache and for each bank that
 * has not yet been migrated, it sends a migratePythPushOracle instruction.
 * Banks are processed in chunks of CHUNK_SIZE per transaction.
 */

// Maximum number of banks per transaction
const CHUNK_SIZE = 10;
const JSON_URL =
  "https://storage.googleapis.com/mrgn-public/mrgn-bank-metadata-cache.json";
const PROGRAM_ID = "MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA";
const DEPLOY_KEYPAIR_PATH = "/keys/staging-deploy.json";

const PYTH_PULL_MIGRATED = 1;

type PoolEntry = {
  bankAddress: string;
  // other fields omitted for brevity
};

async function main() {
  const user = commonSetup(
    true,
    PROGRAM_ID,
    DEPLOY_KEYPAIR_PATH,
    undefined,
    "current"
  );
  const { program, connection, wallet } = user;

  console.log("Fetching bank list from JSON...");
  const response = await fetch(JSON_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch JSON: ${response.statusText}`);
  }
  const pools: PoolEntry[] = await response.json();
  console.log(`Loaded ${pools.length} pools from JSON.`);

  // Convert to PublicKey array
  const allBanks = pools.map((p) => new PublicKey(p.bankAddress));
  console.log(`Total banks to evaluate: ${allBanks.length}`);

  // Process in chunks
  for (let i = 0; i < allBanks.length; i += CHUNK_SIZE) {
    const chunk = allBanks.slice(i, i + CHUNK_SIZE);
    const tx = new Transaction();

    let k = 0;
    for (const bankPubkey of chunk) {
      console.log(`\n [${k}] Processing bank: ${bankPubkey.toString()}`);
      k++;
      const bankAcc = await program.account.bank.fetch(bankPubkey);
      const migrated = (bankAcc.config.configFlags & PYTH_PULL_MIGRATED) !== 0;
      if (migrated) {
        console.log("  • Already migrated, skipping");
        continue;
      }

      // Determine oracle to use
      const oracleKeys = bankAcc.config.oracleKeys;
      const feedId = oracleKeys[0];
      const isPyth =
        JSON.stringify(bankAcc.config.oracleSetup) ===
        JSON.stringify({ pythPushOracle: {} });
      let oraclePubkey = PublicKey.default;

      if (isPyth) {
        oraclePubkey = findPythPushOracleAddress(
          feedId.toBuffer(),
          PYTH_PUSH_ORACLE_ID,
          PYTH_SPONSORED_SHARD_ID
        );
        console.log(
          `  • Migrating Pyth feed from ${feedId} to ${oraclePubkey}`
        );
      } else {
        console.log("  • Not a Pyth push oracle, setting flag only");
      }

      // Add instruction
      const ix = await program.methods
        .migratePythPushOracle()
        .accounts({ bank: bankPubkey, oracle: oraclePubkey })
        .instruction();
      tx.add(ix);
    }

    console.log("  Sending the TX for chunk: " + i);
    try {
      const signature = await sendAndConfirmTransaction(connection, tx, [
        wallet.payer,
      ]);
      console.log(`Transaction signature: ${signature}`);
    } catch (error) {
      console.error("Transaction failed:", error);
    }

    console.log();
  }
}

main().catch((err) => {
  console.error("Fatal error in multi-bank migrate script:", err);
  process.exit(1);
});
