import { Connection, PublicKey } from "@solana/web3.js";
import { Program } from "@coral-xyz/anchor";
import { KaminoLending } from "../../../idl/kamino_lending";

/**
 * Data extracted from a Kamino reserve
 */
export interface ReserveData {
  lendingMarket: PublicKey;
  mint: PublicKey;
  scopeOracle: PublicKey;
  farmCollateral: PublicKey;
  supplyVault: PublicKey;
  feeVault: PublicKey;
}

/**
 * Result of reserve validation
 */
export interface ReserveValidationResult {
  isValid: boolean;
  reserveData: ReserveData;
  errors: string[];
}

/**
 * Fetch and validate a Kamino reserve
 *
 * Checks:
 * 1. Reserve exists and can be deserialized
 * 2. Reserve's lendingMarket matches expected market
 * 3. Reserve's liquidity mint matches expected mint
 */
export async function fetchAndValidateReserve(
  kaminoProgram: Program<KaminoLending>,
  reserveAddress: PublicKey,
  expectedMarket: PublicKey,
  expectedMint: PublicKey
): Promise<ReserveValidationResult> {
  const errors: string[] = [];

  // Fetch reserve
  let reserveAccount;
  try {
    reserveAccount = await kaminoProgram.account.reserve.fetch(reserveAddress);
  } catch (error) {
    return {
      isValid: false,
      reserveData: null as any,
      errors: [`Failed to fetch/deserialize reserve: ${error}`],
    };
  }

  // Extract fields
  const lendingMarket = reserveAccount.lendingMarket as PublicKey;
  // @ts-expect-error - liquidity.mintPubkey exists on reserve
  const mint = reserveAccount.liquidity.mintPubkey as PublicKey;
  // @ts-expect-error - config.tokenInfo exists on reserve
  const scopeOracle = reserveAccount.config.tokenInfo.scopeConfiguration
    .priceFeed as PublicKey;
  const farmCollateral = reserveAccount.farmCollateral as PublicKey;
  // @ts-expect-error - liquidity.supplyVault exists on reserve
  const supplyVault = reserveAccount.liquidity.supplyVault as PublicKey;
  // @ts-expect-error - liquidity.feeVault exists on reserve
  const feeVault = reserveAccount.liquidity.feeVault as PublicKey;

  const reserveData: ReserveData = {
    lendingMarket,
    mint,
    scopeOracle,
    farmCollateral,
    supplyVault,
    feeVault,
  };

  // Validate market
  if (!lendingMarket.equals(expectedMarket)) {
    errors.push(
      `Reserve lending market mismatch: expected ${expectedMarket.toBase58()}, got ${lendingMarket.toBase58()}`
    );
  }

  // Validate mint
  if (!mint.equals(expectedMint)) {
    errors.push(
      `Reserve mint mismatch: expected ${expectedMint.toBase58()}, got ${mint.toBase58()}`
    );
  }

  return {
    isValid: errors.length === 0,
    reserveData,
    errors,
  };
}

/**
 * Format reserve validation result for console output
 */
export function formatReserveValidation(
  result: ReserveValidationResult,
  assetName: string
): string {
  const lines: string[] = [];

  lines.push(`--- Reserve Validation for ${assetName} ---`);

  if (result.isValid) {
    lines.push("Reserve market verification: PASSED");
    lines.push("Reserve mint verification: PASSED");
  } else {
    for (const error of result.errors) {
      lines.push(`ERROR: ${error}`);
    }
  }

  if (result.reserveData) {
    lines.push("");
    lines.push(
      `Scope Oracle: ${result.reserveData.scopeOracle.toBase58()}`
    );
    const hasFarm = !result.reserveData.farmCollateral.equals(PublicKey.default);
    lines.push(
      `Farm State: ${hasFarm ? result.reserveData.farmCollateral.toBase58() : "None"}`
    );
  }

  return lines.join("\n");
}
