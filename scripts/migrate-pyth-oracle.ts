import { PublicKey, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { commonSetup } from "../lib/common-setup";
import { loadSponsoredOracle } from "../lib/pyth-oracle-helpers";

type Config = {
  PROGRAM_ID: string;
  BANK: PublicKey;
};

const config: Config = {
  PROGRAM_ID: "stag8sTKds2h4KzjUw3zKTsxbqvT4XKHdaR9X9E6Rct",
  BANK: new PublicKey("DDLVJyj5sT3knnVDoTifrtQmroLnRCkBmGZ1QXCUDUUd"),
};

async function main() {
  const user = commonSetup(true, config.PROGRAM_ID, "/keys/staging-deploy.json");
  const program = user.program;
  const connection = user.connection;

  console.log("Bank: " + config.BANK);
  let bankBefore = await program.account.bank.fetch(config.BANK);
  const oracleBefore = bankBefore.config.oracleKeys[0];
  // e.g. 1 & 1 = 1
  const migrated = (bankBefore.config.configFlags & PYTH_PULL_MIGRATED) !== 0;
  // could use `parseOracleSetup` instead
  const isPyth = JSON.stringify(bankBefore.config.oracleSetup) === JSON.stringify({ pythPushOracle: {} });
  if (migrated) {
    console.log(" Already migrated, aborting!");
    return;
  }

  let tx = new Transaction();
  if (isPyth) {
    const feedId = bankBefore.config.oracleKeys[0];
    const feed = (await loadSponsoredOracle(feedId, connection)).address;
    console.log(" Moving from feed id: " + feedId + " to feed: " + feed);

    tx.add(
      await program.methods
        .migratePythPushOracle()
        .accounts({
          bank: config.BANK,
          oracle: feed,
        })
        .instruction()
    );
  } else {
    console.log(" Is not PYTH, will set flag and do nothing!");
    tx.add(
      await program.methods
        .migratePythPushOracle()
        .accounts({
          bank: config.BANK,
          oracle: PublicKey.default, // doesn't matter
        })
        .instruction()
    );
  }

  try {
    const signature = await sendAndConfirmTransaction(connection, tx, [user.wallet.payer]);
    console.log("Transaction signature:", signature);
  } catch (error) {
    console.error("Transaction failed:", error);
  }

  let bankAfter = await program.account.bank.fetch(config.BANK);
  console.log("oracle is now " + bankAfter.config.oracleKeys[0] + " was " + oracleBefore);
}

const PYTH_PULL_MIGRATED: number = 1;

main().catch((err) => {
  console.error(err);
});
