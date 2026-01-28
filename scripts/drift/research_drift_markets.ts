import { Connection, PublicKey, Keypair } from "@solana/web3.js";
import { Program, AnchorProvider, Wallet } from "@coral-xyz/anchor";
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { readFileSync } from "fs";
import { join } from "path";
import * as dotenv from "dotenv";
const bs58 = require("bs58");

// Load environment variables
dotenv.config({ path: join(__dirname, "../../.env.api") });

const DRIFT_PROGRAM_ID = new PublicKey(
  "dRiftyHA39MWEi3m9aunc5MzRF1JYuBsbn6VPcn33UH",
);

interface SpotMarketInfo {
  marketIndex: number;
  name: string;
  mint: string;
  oracle: string;
  decimals: number;
  oracleSource: string;
  poolId?: number;
  tokenProgram: string;
  insuranceFundVault?: string;
  revenuePool?: string;
}

async function main() {
  const rpcUrl = process.env.API_URL;
  if (!rpcUrl) {
    throw new Error("API_URL not found in .env.api");
  }

  console.log("Connecting to RPC:", rpcUrl);
  const connection = new Connection(rpcUrl, "confirmed");

  // Load drift IDL
  const idlPath = join(__dirname, "../../idl/drift.json");
  const idl = JSON.parse(readFileSync(idlPath, "utf-8"));

  // Create a dummy wallet for the provider (we're only reading)
  const dummyKeypair = Keypair.generate();
  const wallet = new Wallet(dummyKeypair);
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });

  const program = new Program(idl, provider);

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
      // Decode the account data
      const decoded = program.coder.accounts.decode(
        "SpotMarket",
        account.account.data,
      );

      // Decode the name (it's a 32-byte array)
      const nameBytes = decoded.name;
      const nameStr = Buffer.from(nameBytes)
        .toString("utf-8")
        .replace(/\0/g, "")
        .trim();

      // Get oracle source enum
      let oracleSource = "Unknown";
      if (decoded.oracleSource) {
        if (decoded.oracleSource.pythPull) oracleSource = "PythPull";
        else if (decoded.oracleSource.pyth) oracleSource = "Pyth";
        else if (decoded.oracleSource.switchboard) oracleSource = "Switchboard";
        else if (decoded.oracleSource.switchboardOnDemand)
          oracleSource = "SwitchboardOnDemand";
        else if (decoded.oracleSource.prelaunch) oracleSource = "Prelaunch";
        else oracleSource = Object.keys(decoded.oracleSource)[0];
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

      const marketInfo: SpotMarketInfo = {
        marketIndex: decoded.marketIndex,
        name: nameStr,
        mint: decoded.mint.toString(),
        oracle: decoded.oracle.toString(),
        decimals: decoded.decimals,
        oracleSource: oracleSource,
        tokenProgram: tokenProgram,
      };

      // Add pool ID if present
      if (decoded.fuelBoostDeposits && decoded.fuelBoostDeposits.gt(0)) {
        // This market might have special pool features
        marketInfo.poolId = decoded.marketIndex; // Placeholder
      }

      // Add insurance fund vault if present
      if (decoded.insuranceFund && decoded.insuranceFund.vault) {
        marketInfo.insuranceFundVault = decoded.insuranceFund.vault.toString();
      }

      // Add revenue pool if present
      if (decoded.revenuePool && decoded.revenuePool.scaledBalance) {
        marketInfo.revenuePool = decoded.revenuePool.scaledBalance.toString();
      }

      markets.push(marketInfo);
    } catch (e) {
      console.error(`Error decoding account ${account.pubkey}:`, e);
    }
  }

  // Sort by market index
  markets.sort((a, b) => a.marketIndex - b.marketIndex);

  // Print summary table
  console.log("=== ALL DRIFT SPOT MARKETS ===\n");
  console.log(
    "Index | Name                  | Oracle Type        | Token Program | Decimals | Mint",
  );
  console.log(
    "------|-----------------------|--------------------|--------------|---------|---------",
  );
  markets.forEach((m) => {
    console.log(
      `${m.marketIndex.toString().padEnd(5)} | ${m.name.padEnd(21)} | ${m.oracleSource.padEnd(18)} | ${m.tokenProgram.padEnd(12)} | ${m.decimals.toString().padEnd(8)} | ${m.mint}`,
    );
  });

  console.log("\n\n=== DETAILED MARKET INFORMATION ===\n");

  // Print detailed info for each market
  markets.forEach((m) => {
    console.log(`Market Index: ${m.marketIndex}`);
    console.log(`Name: ${m.name}`);
    console.log(`Mint: ${m.mint}`);
    console.log(`Oracle: ${m.oracle}`);
    console.log(`Oracle Type: ${m.oracleSource}`);
    console.log(`Decimals: ${m.decimals}`);
    console.log(`Token Program: ${m.tokenProgram}`);
    if (m.insuranceFundVault) {
      console.log(`Insurance Fund Vault: ${m.insuranceFundVault}`);
    }
    if (m.revenuePool) {
      console.log(`Revenue Pool Balance: ${m.revenuePool}`);
    }
    console.log("-".repeat(80));
  });

  // Identify candidates for marginfi integration
  console.log("\n\n=== RECOMMENDED CANDIDATES FOR MARGINFI INTEGRATION ===\n");

  // Filter for Pyth Pull oracles (preferred)
  const pythPullMarkets = markets.filter((m) => m.oracleSource === "PythPull");

  // Filter for Token-2022 assets
  const token2022Markets = markets.filter(
    (m) => m.tokenProgram === "Token-2022",
  );

  // Popular assets
  const popularAssets = [
    "USDC",
    "SOL",
    "USDT",
    "JitoSOL",
    "mSOL",
    "bSOL",
    "JLP",
    "PYUSD",
  ];
  const popularMarkets = markets.filter((m) =>
    popularAssets.some((asset) => m.name.includes(asset)),
  );

  console.log("Pyth Pull Oracle Markets (Preferred):");
  pythPullMarkets.forEach((m) => {
    console.log(`  - ${m.name} (Index: ${m.marketIndex}, Mint: ${m.mint})`);
  });

  console.log("\n\nToken-2022 Assets:");
  token2022Markets.forEach((m) => {
    console.log(`  - ${m.name} (Index: ${m.marketIndex}, Mint: ${m.mint})`);
  });

  console.log("\n\nPopular Assets:");
  popularMarkets.forEach((m) => {
    console.log(
      `  - ${m.name} (Index: ${m.marketIndex}, Oracle: ${m.oracleSource}, Mint: ${m.mint})`,
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
  const jitoSol = markets.find(
    (m) => m.name === "jitoSOL" || m.name === "JitoSOL",
  );
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

  // Add some additional interesting assets
  const additional = markets.filter(
    (m) =>
      !candidates.includes(m) &&
      m.oracleSource === "PythPull" &&
      m.marketIndex < 50,
  );
  candidates.push(...additional.slice(0, 10 - candidates.length));

  candidates.forEach((m, idx) => {
    console.log(`\n${idx + 1}. ${m.name}`);
    console.log(`   Market Index: ${m.marketIndex}`);
    console.log(`   Mint: ${m.mint}`);
    console.log(`   Oracle: ${m.oracle}`);
    console.log(`   Oracle Type: ${m.oracleSource}`);
    console.log(`   Decimals: ${m.decimals}`);
    console.log(`   Token Program: ${m.tokenProgram}`);
  });

  console.log("\n\nDone!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
