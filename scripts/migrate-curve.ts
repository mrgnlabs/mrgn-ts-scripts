import {
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { commonSetup } from "../lib/common-setup";
import { loadSponsoredOracle } from "../lib/pyth-oracle-helpers";
import { INTEREST_CURVE_SEVEN_POINT } from "../lib/constants";

type Config = {
  PROGRAM_ID: string;
  BANK: PublicKey;
};

const config: Config = {
  PROGRAM_ID: "stag8sTKds2h4KzjUw3zKTsxbqvT4XKHdaR9X9E6Rct",
  BANK: new PublicKey("4Gg6pW1U8W6ZQ22TbUWYRetx2nxjhUAydfKoCTSHhkkG"),
};

async function main() {
  const user = commonSetup(
    true,
    config.PROGRAM_ID,
    "/keys/staging-deploy.json",
    undefined,
    "1.6"
  );
  const program = user.program;
  const connection = user.connection;

  let bankBefore = await program.account.bank.fetch(config.BANK);
  const migrated =
    bankBefore.config.interestRateConfig.curveType ==
    INTEREST_CURVE_SEVEN_POINT;

  let tx = new Transaction();

  if (!migrated) {
    tx.add(
      await program.methods
        .migrateCurve()
        .accounts({
          bank: config.BANK,
        })
        .instruction()
    );
    console.log(" Migrating curve for bank: " + config.BANK);
  } else {
    console.log(" Skipped bank (already migrated): " + config.BANK);
  }

  try {
    const signature = await sendAndConfirmTransaction(connection, tx, [
      user.wallet.payer,
    ]);
    console.log("Transaction signature:", signature);
  } catch (error) {
    console.error("Transaction failed:", error);
  }
}

main().catch((err) => {
  console.error(err);
});
