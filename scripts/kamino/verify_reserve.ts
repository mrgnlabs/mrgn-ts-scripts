/**
 * Verify a Kamino reserve matches config values
 * Usage: npx tsx scripts/kamino/verify_reserve.ts configs/<config>.json
 */

import { Connection, PublicKey } from "@solana/web3.js";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
import { Idl } from "@coral-xyz/anchor";
import * as path from "path";

import KaminoLendingIdl from "../../idl/kamino_lending.json";
import { KLEND_PROGRAM_ID } from "./kamino-types";
import {
  fetchAndValidateReserve,
  formatReserveValidation,
} from "./lib/reserve_utils";

async function main() {
  const configPath = process.argv[2];
  if (!configPath) {
    console.error("Usage: npx tsx scripts/kamino/verify_reserve.ts <config_path>");
    process.exit(1);
  }

  const resolvedPath = path.isAbsolute(configPath)
    ? configPath
    : path.join(__dirname, configPath);

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const config = require(resolvedPath);

  const connection = new Connection("https://api.mainnet-beta.solana.com");
  const provider = new AnchorProvider(connection, null as any, {});

  const kaminoIdl = {
    ...(KaminoLendingIdl as Idl),
    address: KLEND_PROGRAM_ID.toBase58(),
  };
  const kaminoProgram = new Program(kaminoIdl as any, provider);

  console.log("=== Reserve Verification ===");
  console.log(`Config: ${config.asset} on ${config.market} market`);
  console.log("");

  const result = await fetchAndValidateReserve(
    kaminoProgram as any,
    new PublicKey(config.kaminoReserve),
    new PublicKey(config.kaminoMarket),
    new PublicKey(config.bankMint)
  );

  console.log(formatReserveValidation(result, config.asset));
  console.log("");

  if (result.isValid) {
    console.log("=== VERIFICATION PASSED ===");
  } else {
    console.log("=== VERIFICATION FAILED ===");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
