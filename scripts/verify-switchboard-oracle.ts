// scripts/verify-switchboard-oracle.ts
import { Connection, PublicKey } from "@solana/web3.js";
import { verifySwitchboardMint } from "../lib/switchboard-verify";
import dotenv from "dotenv";

dotenv.config();

// Basic arg parsing
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.split("=");
    return [k.replace(/^--/, ""), v ?? true];
  })
);

async function main() {
  const rpc =
    (args.rpc as string) ??
    process.env.PRIVATE_RPC_ENDPOINT ??
    process.env.SOLANA_RPC ??
    "https://api.mainnet-beta.solana.com";

  const oraclePubkey = args.oracle as string;
  if (!oraclePubkey) {
    console.error(
      "Usage: tsx scripts/verify-switchboard-oracle.ts --oracle=<pubkey> [--mint=<mint>] [--crossbar=<url>] [--rpc=<url>]"
    );
    console.error("\nExamples:");
    console.error(
      "  # Verify dzSOL oracle"
    );
    console.error(
      "  tsx scripts/verify-switchboard-oracle.ts --oracle=8wRUjxh4uCdvQdqcWUMvBBTJa95vLuKrze7WLus5h6Gk --mint=Gekfj7SL2fVpTDxJZmeC46cTYxinjB6gkAnb6EGT6mnn"
    );
    console.error("\n  # Verify 2Z oracle");
    console.error(
      "  tsx scripts/verify-switchboard-oracle.ts --oracle=Ho9iLZ15SreUnzRpbMHLTzQfCQugmsNnUQ3rLB5V75Ng --mint=J6pQQ3FAcJQeWPPGppWRb4nM8jU3wLyYbRrLh7feMfvd"
    );
    process.exit(1);
  }

  console.log(`Connecting to RPC: ${rpc}`);
  console.log(`Verifying oracle: ${oraclePubkey}`);
  if (args.mint) {
    console.log(`Expected mint: ${args.mint}`);
  }
  console.log();

  const connection = new Connection(rpc, "confirmed");

  // Optionally load a canonical job spec per mint from your repo
  // Example:
  // import dzsolJobs from "../configs/jobs/dzsol.json";
  // const expectedJobs = args.mint === DZ_MINT ? dzsolJobs : undefined;

  const res = await verifySwitchboardMint({
    connection,
    oraclePubkey: new PublicKey(oraclePubkey),
    expectedMint: args.mint as string | undefined,
    // expectedJobsForMint, // if you wire in your canonical spec
    crossbarUrl: args.crossbar as string | undefined,
  });

  // Pretty print results
  console.log("=".repeat(80));
  console.log("VERIFICATION RESULTS");
  console.log("=".repeat(80));
  console.log();
  console.log(`Oracle Pubkey:     ${res.oraclePubkey}`);
  console.log(`Queue:             ${res.queue}`);
  console.log(`Feed Hash:         ${res.feedHashHex}`);
  if (res.name) {
    console.log(`Feed Name:         ${res.name}`);
  }
  console.log();

  if (res.candidateMintsFromJobs.length > 0) {
    console.log("Candidate Mints Found in Jobs:");
    res.candidateMintsFromJobs.forEach((mint, i) => {
      console.log(`  ${i + 1}. ${mint}`);
    });
  } else {
    console.log("⚠️  No candidate mints found in job specification");
    console.log("   This might indicate the oracle doesn't directly reference a mint,");
    console.log("   or uses indirect price feeds (e.g., SOL/USD for an LST).");
  }
  console.log();

  if (res.expectedMintFound !== undefined) {
    if (res.expectedMintFound) {
      console.log(`✅ Expected mint FOUND: ${args.mint}`);
    } else {
      console.log(`❌ Expected mint NOT FOUND: ${args.mint}`);
      console.log(`   The oracle may not be configured for this mint.`);
    }
    console.log();
  }

  if (res.expectedJobHashMatches !== undefined) {
    if (res.expectedJobHashMatches) {
      console.log("✅ Canonical job hash MATCHES on-chain feed hash");
    } else {
      console.log("❌ Canonical job hash DOES NOT MATCH on-chain feed hash");
      console.log("   The oracle configuration has changed from the canonical spec.");
    }
    console.log();
  }

  console.log("=".repeat(80));
  console.log();

  // Also output JSON for programmatic use
  console.log("JSON Output:");
  console.log(JSON.stringify(res, null, 2));
}

main().catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});
