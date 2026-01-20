import { Connection, PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import * as dotenv from "dotenv";
import { join } from "path";

// Load environment variables
dotenv.config({ path: join(__dirname, "../../.env.api") });

const DRIFT_PROGRAM_ID = new PublicKey("dRiftyHA39MWEi3m9aunc5MzRF1JYuBsbn6VPcn33UH");
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

// Manual deserialization of SpotMarket fields we care about
function decodeSpotMarket(data: Buffer): Partial<SpotMarketInfo> {
  try {
    // Skip discriminator (8 bytes)
    let offset = 8;

    // pubkey: PublicKey (32 bytes)
    const pubkey = new PublicKey(data.slice(offset, offset + 32));
    offset += 32;

    // oracle: PublicKey (32 bytes)
    const oracle = new PublicKey(data.slice(offset, offset + 32));
    offset += 32;

    // mint: PublicKey (32 bytes)
    const mint = new PublicKey(data.slice(offset, offset + 32));
    offset += 32;

    // vault: PublicKey (32 bytes) - skip
    offset += 32;

    // name: [u8; 32]
    const nameBytes = data.slice(offset, offset + 32);
    const name = Buffer.from(nameBytes)
      .toString("utf-8")
      .replace(/\0/g, "")
      .trim();
    offset += 32;

    // Skip historical_oracle_data, historical_index_data (large structs)
    // These are complex, so we'll skip to revenue pool which is further down

    // Try to find market_index and decimals
    // market_index is a u16 somewhere in the struct
    // decimals is a u32

    // Let's search for them in a reasonable range
    // Based on Drift's SpotMarket struct, market_index should be near the beginning after some fields
    //  and decimals shortly after

    // Actually, let's just scan the whole account data for patterns
    // Market index is usually < 100, so we can search for it
    // Decimals are usually 6 or 9 for common tokens

    // For now, return what we have
    return {
      pubkey: pubkey.toString(),
      oracle: oracle.toString(),
      mint: mint.toString(),
      name,
    };
  } catch (e) {
    console.error("Error decoding:", e);
    return {};
  }
}

// Better manual deserialization based on the actual Drift IDL structure
function decodeSpotMarketV2(data: Buffer): Partial<SpotMarketInfo> {
  try {
    let offset = 8; // Skip discriminator

    // Read fields in order from IDL:
    // 1. pubkey: PublicKey
    offset += 32;

    // 2. oracle: PublicKey
    const oracle = new PublicKey(data.slice(offset, offset + 32));
    offset += 32;

    // 3. mint: PublicKey
    const mint = new PublicKey(data.slice(offset, offset + 32));
    offset += 32;

    // 4. vault: PublicKey
    offset += 32;

    // 5. name: [u8; 32]
    const nameBytes = data.slice(offset, offset + 32);
    const name = Buffer.from(nameBytes)
      .toString("utf-8")
      .replace(/\0/g, "")
      .trim();
    offset += 32;

    // 6. historical_oracle_data: HistoricalOracleData (40 bytes based on typical size)
    offset += 40;

    // 7. historical_index_data: HistoricalIndexData (40 bytes)
    offset += 40;

    // 8. revenue_pool: PoolBalance
    // This has scaled_balance (u128 = 16 bytes) and market_index (u16 = 2 bytes)
    offset += 18; // Skip revenue_pool

    // 9. spot_fee_pool: PoolBalance
    offset += 18;

    // 10. insurance_fund: InsuranceFund (complex, skip ~100 bytes)
    offset += 100;

    // 11. total_spot_fee: u128
    offset += 16;

    // 12. deposit_balance: u128
    offset += 16;

    // 13. borrow_balance: u128
    offset += 16;

    // 14. cumulative_deposit_interest: u128
    offset += 16;

    // 15. cumulative_borrow_interest: u128
    offset += 16;

    // 16. total_social_loss: u128
    offset += 16;

    // 17. total_quote_social_loss: u128
    offset += 16;

    // 18. withdraw_guard_threshold: u64
    offset += 8;

    // 19. max_token_deposits: u64
    offset += 8;

    // 20. deposit_token_twap: u64
    offset += 8;

    // 21. borrow_token_twap: u64
    offset += 8;

    // 22. utilization_twap: u64
    offset += 8;

    // 23. last_interest_ts: u64
    offset += 8;

    // 24. last_twap_ts: u64
    offset += 8;

    // 25. expiry_ts: i64
    offset += 8;

    // 26. order_step_size: u64
    offset += 8;

    // 27. order_tick_size: u64
    offset += 8;

    // 28. min_order_size: u64
    offset += 8;

    // 29. max_position_size: u64
    offset += 8;

    // 30. next_fill_record_id: u64
    offset += 8;

    // 31. next_deposit_record_id: u64
    offset += 8;

    // 32. initial_asset_weight: u32
    offset += 4;

    // 33. maintenance_asset_weight: u32
    offset += 4;

    // 34. initial_liability_weight: u32
    offset += 4;

    // 35. maintenance_liability_weight: u32
    offset += 4;

    // 36. imf_factor: u32
    offset += 4;

    // 37. liquidator_fee: u32
    offset += 4;

    // 38. if_liquidation_fee: u32
    offset += 4;

    // 39. optimal_utilization: u32
    offset += 4;

    // 40. optimal_borrow_rate: u32
    offset += 4;

    // 41. max_borrow_rate: u32
    offset += 4;

    // 42. decimals: u32
    const decimals = data.readUInt32LE(offset);
    offset += 4;

    // 43. market_index: u16
    const marketIndex = data.readUInt16LE(offset);
    offset += 2;

    return {
      pubkey: "",
      oracle: oracle.toString(),
      mint: mint.toString(),
      name,
      decimals,
      marketIndex,
    };
  } catch (e) {
    console.error("Error decoding V2:", e);
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
  const spotMarketDiscriminator = Buffer.from([100, 177, 8, 107, 168, 65, 65, 39]);

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
        console.log(`Skipping account ${account.pubkey.toString()} - incomplete data`);
        continue;
      }

      // Check if mint is Token-2022
      let tokenProgram = "Unknown";
      try {
        const mintAccount = await connection.getAccountInfo(
          new PublicKey(decoded.mint)
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
    "Index | Name                  | Token Program | Decimals | Mint"
  );
  console.log(
    "------|-----------------------|--------------|----------|-------------"
  );
  markets.forEach((m) => {
    console.log(
      `${m.marketIndex.toString().padEnd(5)} | ${m.name.padEnd(21)} | ${m.tokenProgram.padEnd(12)} | ${m.decimals.toString().padEnd(8)} | ${m.mint}`
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
    (m) => m.tokenProgram === "Token-2022"
  );

  // Popular assets
  const popularAssets = ["USDC", "SOL", "USDT", "jitoSOL", "mSOL", "bSOL", "JLP", "PYUSD"];
  const popularMarkets = markets.filter((m) =>
    popularAssets.some((asset) => m.name.toUpperCase().includes(asset.toUpperCase()))
  );

  console.log("Token-2022 Assets:");
  token2022Markets.forEach((m) => {
    console.log(`  - ${m.name} (Index: ${m.marketIndex}, Mint: ${m.mint})`);
  });

  console.log("\n\nPopular Assets:");
  popularMarkets.forEach((m) => {
    console.log(
      `  - ${m.name} (Index: ${m.marketIndex}, Mint: ${m.mint})`
    );
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
        !candidates.includes(m)
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
        2
      )
    );
  });

  console.log("\n\nDone!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
