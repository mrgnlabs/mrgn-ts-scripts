import { Connection, PublicKey, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import { Program, AnchorProvider, BN } from "@coral-xyz/anchor";
import { loadKeypairFromFile } from "./utils";
import { decodePriceUpdateV2, PriceUpdateV2 } from "./utils_oracle";

type Config = {
  ORACLE: PublicKey;
};

const config: Config = {
  ORACLE: new PublicKey("DBE3N8uNjhKPRHfANdwGvCZghWXyLPdqdSbEW2XFwBiX"),
};

async function main() {
  const connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed");

  const pyth_oracle = await connection.getAccountInfo(config.ORACLE);
  let data = pyth_oracle.data;
  console.log("data bytes: " + data.length);
  let priceUpdate = decodePriceUpdateV2(Buffer.from(data));

  console.log("");
  console.log("Full struct dump: ");
  prettyPrintPriceUpdate(priceUpdate);
  // console.log(JSON.stringify(priceUpdate));
}

function prettyPrintPriceUpdate(update: PriceUpdateV2) {
  const msg = update.price_message;

  // Convert raw BN to JS number (may overflow if extremely large)
  const rawPrice = msg.price.toNumber();
  const rawConf = msg.conf.toNumber();

  // Apply exponent to get actual price
  const factor = 10 ** msg.exponent;
  const price = rawPrice * factor;
  const conf = rawConf * factor;

  // Format publish times
  const publishTs = new Date(msg.publish_time.toNumber() * 1_000).toISOString();
  const prevPublishTs = new Date(msg.prev_publish_time.toNumber() * 1_000).toISOString();

  console.log("🔔 Price Update:");
  console.log("  • Feed ID:            ", msg.feed_id.toBase58());
  console.log("  • Write Authority:    ", update.write_authority.toBase58());
  console.log(
    "  • Verification Level: ",
    update.verification_level.kind === "Full" ? "Full" : `Partial (${update.verification_level.num_signatures} sigs)`
  );
  console.log("");
  console.log("  ─── Price Info ───");
  console.log(`  » Price:  ${price.toLocaleString(undefined, { maximumFractionDigits: 8 })}`);
  console.log(`  » Confidence: ±${conf.toLocaleString(undefined, { maximumFractionDigits: 8 })}`);
  console.log(`  » Exponent: ${msg.exponent}`);
  console.log("");
  console.log("  ─── Timing ───");
  console.log(`  » Published:       ${publishTs}`);
  console.log(`  » Previous Publish: ${prevPublishTs}`);
  console.log("");
  console.log(`  • EMA Price:       ${msg.ema_price.toString()} (raw)`);
  console.log(`  • EMA Confidence:  ${msg.ema_conf.toString()} (raw)`);
  console.log("");
  console.log(`  • Posted Slot:     ${update.posted_slot.toString()}`);
}

main().catch((err) => {
  console.error(err);
});
