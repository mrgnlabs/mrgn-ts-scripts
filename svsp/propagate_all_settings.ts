// This propagates the fee state to all active staked collateral banks.

// TODO add a LUT and send these all in one tx to avoid burning so many tx fees.
import {
  AccountMeta,
  PublicKey,
  sendAndConfirmTransaction,
  Transaction,
} from "@solana/web3.js";
import { commonSetup } from "../lib/common-setup";
import { deriveStakedSettings } from "../scripts/common/pdas";

type Config = {
  PROGRAM_ID: string;
  GROUP: PublicKey;

  ORACLE?: PublicKey;
};

const config: Config = {
  PROGRAM_ID: "MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA",
  GROUP: new PublicKey("4qp6Fx6tnZkY5Wropq9wUYgtFxXKwE6viZxFHg3rdAG8"),

  // only required if changing the oracle, otherwise leave as undefined...
  ORACLE: new PublicKey("7UVimffxr9ow1uXYxsr4LHAcV58mLzhmwaeKvJ1pjLiE"),
};

async function main() {
  const user = commonSetup(
    true,
    config.PROGRAM_ID,
    "/keys/staging-deploy.json",
    undefined
  );
  const program = user.program;
  const connection = user.connection;

  const jsonUrl =
    "https://storage.googleapis.com/mrgn-public/mrgn-staked-bank-metadata-cache.json";
  const response = await fetch(jsonUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch JSON: ${response.statusText}`);
  }
  const pools: PoolEntry[] = (await response.json()) as PoolEntry[];
  // Or read it locally....
  //   const poolsJson = fs.readFileSync(path.join(__dirname, "svsp_pools.json"), "utf8");
  //   const pools: PoolEntry[] = JSON.parse(poolsJson);
  console.log("read " + pools.length + " pools");
  console.log("");

  for (let i = 0; i < pools.length; i++) {
    const bank = new PublicKey(pools[i].bankAddress);

    let [stakedSettingsKey] = deriveStakedSettings(
      program.programId,
      config.GROUP
    );
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
    let tx = new Transaction();
    const ix = await program.methods
      .propagateStakedSettings()
      .accounts({
        // feeState: derived automatically from static PDA
        stakedSettings: stakedSettingsKey,
        bank: bank,
      })
      .remainingAccounts(remainingAccounts)
      .instruction();

    tx.add(ix);

    try {
      const signature = await sendAndConfirmTransaction(connection, tx, [
        user.wallet.payer,
      ]);
      console.log("Transaction signature:", signature);
    } catch (error) {
      console.error("Transaction failed:", error);
    }

    console.log("Cranked settings for: " + bank);
    console.log("");
  }
}

main().catch((err) => {
  console.error(err);
});

/**
 * JSON file format of our staked banks endpoint
 * (https://storage.googleapis.com/mrgn-public/mrgn-staked-bank-metadata-cache.json)
 */
type PoolEntry = {
  bankAddress: string;
  validatorVoteAccount: string;
  tokenAddress: string;
  tokenName: string;
  tokenSymbol: string;
};
