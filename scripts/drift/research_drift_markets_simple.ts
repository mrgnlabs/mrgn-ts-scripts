import { Connection, PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import * as dotenv from "dotenv";
import { join } from "path";
import { DRIFT_PROGRAM_ID } from "./lib/utils";

// Load environment variables
dotenv.config({ path: join(__dirname, "../../.env.api") });

const bs58 = require("bs58");

interface SpotMarketInfo {
  marketIndex: number;
  name: string;
  mint: string;
  oracle: string;
  decimals: number;
  tokenProgram: string;
  pubkey: string;
}

export function decodeSpotMarketV2(data: Buffer): Partial<SpotMarketInfo> {
  try {
    let offset = 8; // Anchor discriminator

    // 1) pubkey: Pubkey
    offset += 32;

    // 2) oracle: Pubkey
    const oracle = new PublicKey(data.slice(offset, offset + 32));
    offset += 32;

    // 3) mint: Pubkey
    const mint = new PublicKey(data.slice(offset, offset + 32));
    offset += 32;

    // 4) vault: Pubkey
    offset += 32;

    // 5) name: [u8; 32]
    const nameBytes = data.slice(offset, offset + 32);
    const name = Buffer.from(nameBytes)
      .toString("utf-8")
      .replace(/\0/g, "")
      .trim();
    offset += 32;

    // 6) historical_oracle_data: HistoricalOracleData = 48 bytes
    // i64 + u64 + i64 + i64 + i64 + i64 = 6 * 8
    offset += 48;

    // 7) historical_index_data: HistoricalIndexData = 40 bytes
    // u64 + u64 + u64 + u64 + i64 = 5 * 8
    offset += 40;

    // 8) revenue_pool: PoolBalance = 24 bytes
    // u128 (16) + u16 (2) + [u8;6] (6) = 24
    offset += 24;

    // 9) spot_fee_pool: PoolBalance = 24 bytes
    offset += 24;

    // 10) insurance_fund: InsuranceFund = 112 bytes
    // Pubkey (32)
    // + total_shares u128 (16)
    // + user_shares u128 (16)
    // + shares_base u128 (16)
    // + unstaking_period i64 (8)
    // + last_revenue_settle_ts i64 (8)
    // + revenue_settle_period i64 (8)
    // + total_factor u32 (4)
    // + user_factor u32 (4)
    // = 112
    offset += 112;

    // 11) total_spot_fee: u128
    offset += 16;

    // 12) deposit_balance: u128
    offset += 16;

    // 13) borrow_balance: u128
    offset += 16;

    // 14) cumulative_deposit_interest: u128
    offset += 16;

    // 15) cumulative_borrow_interest: u128
    offset += 16;

    // 16) total_social_loss: u128
    offset += 16;

    // 17) total_quote_social_loss: u128
    offset += 16;

    // 18) withdraw_guard_threshold: u64
    offset += 8;

    // 19) max_token_deposits: u64
    offset += 8;

    // 20) deposit_token_twap: u64
    offset += 8;

    // 21) borrow_token_twap: u64
    offset += 8;

    // 22) utilization_twap: u64
    offset += 8;

    // 23) last_interest_ts: u64
    offset += 8;

    // 24) last_twap_ts: u64
    offset += 8;

    // 25) expiry_ts: i64
    offset += 8;

    // 26) order_step_size: u64
    offset += 8;

    // 27) order_tick_size: u64
    offset += 8;

    // 28) min_order_size: u64
    offset += 8;

    // 29) max_position_size: u64
    offset += 8;

    // 30) next_fill_record_id: u64
    offset += 8;

    // 31) next_deposit_record_id: u64
    offset += 8;

    // 32-41) ten u32 fields
    // initial_asset_weight
    // maintenance_asset_weight
    // initial_liability_weight
    // maintenance_liability_weight
    // imf_factor
    // liquidator_fee
    // if_liquidation_fee
    // optimal_utilization
    // optimal_borrow_rate
    // max_borrow_rate
    offset += 10 * 4;

    // 42) decimals: u32
    const decimals = data.readUInt32LE(offset);
    offset += 4;

    // 43) market_index: u16
    const marketIndex = data.readUInt16LE(offset);
    offset += 2;

    return {
      oracle: oracle.toString(),
      mint: mint.toString(),
      name,
      decimals,
      marketIndex,
    };
  } catch (e) {
    console.error("Error decoding SpotMarket:", e);
    return {};
  }
}

async function main() {
  const rpcUrl = process.env.API_URL;
  if (!rpcUrl) {
    throw new Error("API_URL not found in .env.api");
  }

  console.log("Connecting to RPC:", rpcUrl);
  const connection = new Connection(rpcUrl, "confirmed");

  console.log("Fetching all Drift spot markets...\n");

  // The discriminator for SpotMarket accounts
  const spotMarketDiscriminator = Buffer.from([
    100, 177, 8, 107, 168, 65, 65, 39,
  ]);

  // Get all program accounts with SpotMarket discriminator
  const accounts = await connection.getProgramAccounts(DRIFT_PROGRAM_ID, {
    filters: [
      {
        memcmp: {
          offset: 0,
          bytes: bs58.encode(spotMarketDiscriminator),
        },
      },
    ],
  });

  console.log(`Found ${accounts.length} spot markets\n`);

  const markets: SpotMarketInfo[] = [];

  for (const account of accounts) {
    try {
      const decoded = decodeSpotMarketV2(account.account.data);

      if (!decoded.marketIndex || !decoded.name || !decoded.mint) {
        console.log(
          `Skipping account ${account.pubkey.toString()} - incomplete data`,
        );
        continue;
      }

      // Check if mint is Token-2022
      let tokenProgram = "Unknown";
      try {
        const mintAccount = await connection.getAccountInfo(
          new PublicKey(decoded.mint),
        );
        if (mintAccount) {
          if (mintAccount.owner.equals(TOKEN_2022_PROGRAM_ID)) {
            tokenProgram = "Token-2022";
          } else if (mintAccount.owner.equals(TOKEN_PROGRAM_ID)) {
            tokenProgram = "SPL Token";
          }
        }
      } catch (e) {
        // Ignore errors
      }

      markets.push({
        marketIndex: decoded.marketIndex!,
        name: decoded.name!,
        mint: decoded.mint!,
        oracle: decoded.oracle!,
        decimals: decoded.decimals!,
        tokenProgram,
        pubkey: account.pubkey.toString(),
      });
    } catch (e) {
      console.error(`Error processing account ${account.pubkey}:`, e);
    }
  }

  // Sort by market index
  markets.sort((a, b) => a.marketIndex - b.marketIndex);

  // Print summary table
  console.log("=== ALL DRIFT SPOT MARKETS ===\n");
  console.log(
    "Index | Name                  | Token Program | Decimals | Mint",
  );
  console.log(
    "------|-----------------------|--------------|----------|-------------",
  );
  markets.forEach((m) => {
    console.log(
      `${m.marketIndex.toString().padEnd(5)} | ${m.name.padEnd(21)} | ${m.tokenProgram.padEnd(12)} | ${m.decimals.toString().padEnd(8)} | ${m.mint}`,
    );
  });

  console.log("\n\n=== DETAILED MARKET INFORMATION ===\n");

  // Print detailed info for each market
  markets.forEach((m) => {
    console.log(`Market Index: ${m.marketIndex}`);
    console.log(`Name: ${m.name}`);
    console.log(`Mint: ${m.mint}`);
    console.log(`Oracle: ${m.oracle}`);
    console.log(`Decimals: ${m.decimals}`);
    console.log(`Token Program: ${m.tokenProgram}`);
    console.log(`Pubkey: ${m.pubkey}`);
    console.log("-".repeat(80));
  });

  // Identify candidates for marginfi integration
  console.log("\n\n=== RECOMMENDED CANDIDATES FOR MARGINFI INTEGRATION ===\n");

  // Filter for Token-2022 assets
  const token2022Markets = markets.filter(
    (m) => m.tokenProgram === "Token-2022",
  );

  // Popular assets
  const popularAssets = [
    "USDC",
    "SOL",
    "USDT",
    "jitoSOL",
    "mSOL",
    "bSOL",
    "JLP",
    "PYUSD",
  ];
  const popularMarkets = markets.filter((m) =>
    popularAssets.some((asset) =>
      m.name.toUpperCase().includes(asset.toUpperCase()),
    ),
  );

  console.log("Token-2022 Assets:");
  token2022Markets.forEach((m) => {
    console.log(`  - ${m.name} (Index: ${m.marketIndex}, Mint: ${m.mint})`);
  });

  console.log("\n\nPopular Assets:");
  popularMarkets.forEach((m) => {
    console.log(`  - ${m.name} (Index: ${m.marketIndex}, Mint: ${m.mint})`);
  });

  // Create a diverse candidate list
  console.log("\n\n=== TOP 10 DIVERSE CANDIDATES ===\n");

  const candidates: SpotMarketInfo[] = [];

  // Add USDC if available
  const usdc = markets.find((m) => m.name === "USDC");
  if (usdc) candidates.push(usdc);

  // Add SOL if available
  const sol = markets.find((m) => m.name === "SOL");
  if (sol) candidates.push(sol);

  // Add PYUSD (Token-2022)
  const pyusd = markets.find((m) => m.name === "PYUSD");
  if (pyusd) candidates.push(pyusd);

  // Add a few LSTs
  const jitoSol = markets.find((m) => m.name.toLowerCase().includes("jitosol"));
  if (jitoSol) candidates.push(jitoSol);

  const mSol = markets.find((m) => m.name === "mSOL");
  if (mSol) candidates.push(mSol);

  const bSol = markets.find((m) => m.name === "bSOL");
  if (bSol) candidates.push(bSol);

  // Add JLP if available
  const jlp = markets.find((m) => m.name === "JLP");
  if (jlp) candidates.push(jlp);

  // Add USDT
  const usdt = markets.find((m) => m.name === "USDT");
  if (usdt) candidates.push(usdt);

  // Add some additional interesting assets that are not already included
  const additionalCandidates = ["wBTC", "ETH", "WBTC", "wETH", "BONK", "WIF"];
  for (const candidate of additionalCandidates) {
    if (candidates.length >= 10) break;
    const market = markets.find(
      (m) =>
        m.name.toUpperCase().includes(candidate.toUpperCase()) &&
        !candidates.includes(m),
    );
    if (market) candidates.push(market);
  }

  candidates.forEach((m, idx) => {
    console.log(`\n${idx + 1}. ${m.name}`);
    console.log(`   Market Index: ${m.marketIndex}`);
    console.log(`   Mint: ${m.mint}`);
    console.log(`   Oracle: ${m.oracle}`);
    console.log(`   Decimals: ${m.decimals}`);
    console.log(`   Token Program: ${m.tokenProgram}`);
    console.log(`   Pubkey: ${m.pubkey}`);
  });

  console.log("\n\n=== ALL MARKETS SUMMARY (for config files) ===\n");
  markets.forEach((m) => {
    console.log(
      JSON.stringify(
        {
          name: m.name,
          marketIndex: m.marketIndex,
          mint: m.mint,
          oracle: m.oracle,
          decimals: m.decimals,
          tokenProgram: m.tokenProgram,
        },
        null,
        2,
      ),
    );
  });

  console.log("\n\nDone!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
