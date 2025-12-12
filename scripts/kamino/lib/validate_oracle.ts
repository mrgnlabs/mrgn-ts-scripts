import { Connection, PublicKey } from "@solana/web3.js";
import { scrapeSwitchboardFeed, closeBrowser } from "../../../lib/web-scraper";

/**
 * Expected Switchboard authority for marginfi oracles
 */
export const SWITCHBOARD_EXPECTED_AUTHORITY =
  "69fYfCVsBvV5CJQeiALyZZ5Auuh1GtqY8f8NnhMt39na";

/**
 * Jupiter Price API base URL (V3 - current as of 2025)
 */
const JUPITER_PRICE_API = "https://lite-api.jup.ag/price/v3";

/**
 * Default price deviation tolerance (1%)
 */
const DEFAULT_PRICE_TOLERANCE_PERCENT = 1;

/**
 * Result of Switchboard oracle validation
 */
export interface SwitchboardValidationResult {
  isValid: boolean;
  feedAddress: string;
  authority?: string;
  authorityValid?: boolean;
  name?: string;
  description?: string;
  queue?: string;
  error?: string;
  apiUrl: string;
  uiUrl: string;
}

/**
 * Result of price comparison
 */
export interface PriceComparisonResult {
  oraclePrice: number;
  jupiterPrice: number | null;
  deviationPercent: number | null;
  isWithinTolerance: boolean;
  tolerancePercent: number;
  error?: string;
}

/**
 * Result of ticker validation
 */
export interface TickerValidationResult {
  isValid: boolean;
  expectedAsset: string;
  actualTicker: string | null;
  error?: string;
}

/**
 * Combined oracle validation result
 */
export interface OracleValidationReport {
  switchboard: SwitchboardValidationResult;
  tickerValidation?: TickerValidationResult;
  priceComparison?: PriceComparisonResult;
  overallValid: boolean;
  errors: string[];
}

/**
 * Jupiter price API V3 response
 */
interface JupiterPriceV3Response {
  [mint: string]: {
    usdPrice: number;
    blockId: number;
    decimals: number;
    priceChange24h: number;
  } | null;
}

/**
 * Validate a Switchboard oracle feed
 *
 * Checks:
 * 1. Feed exists and is accessible (via web scraping)
 * 2. Authority matches expected value (69fYfCVsBvV5CJQeiALyZZ5Auuh1GtqY8f8NnhMt39na)
 * 3. Returns feed metadata for verification
 */
export async function validateSwitchboardOracle(
  feedAddress: string
): Promise<SwitchboardValidationResult> {
  const uiUrl = `https://ondemand.switchboard.xyz/solana/mainnet/feed/${feedAddress}`;

  try {
    // Use puppeteer to scrape the rendered page
    const scrapeResult = await scrapeSwitchboardFeed(feedAddress);

    if (!scrapeResult.success) {
      return {
        isValid: false,
        feedAddress,
        error: scrapeResult.error || "Failed to scrape Switchboard page",
        apiUrl: uiUrl,
        uiUrl,
      };
    }

    const authorityValid = scrapeResult.authority === SWITCHBOARD_EXPECTED_AUTHORITY;

    return {
      isValid: authorityValid,
      feedAddress,
      authority: scrapeResult.authority,
      authorityValid,
      name: scrapeResult.name,
      queue: scrapeResult.queue,
      apiUrl: uiUrl,
      uiUrl,
    };
  } catch (error) {
    return {
      isValid: false,
      feedAddress,
      error: `Failed to validate oracle: ${error}`,
      apiUrl: uiUrl,
      uiUrl,
    };
  }
}

/**
 * Get price from Switchboard oracle via web scraping
 */
export async function getSwitchboardPrice(
  connection: Connection,
  feedAddress: PublicKey
): Promise<number | null> {
  try {
    const scrapeResult = await scrapeSwitchboardFeed(feedAddress.toBase58());

    if (scrapeResult.success && scrapeResult.value) {
      // Parse the value (remove commas, etc.)
      const cleanValue = scrapeResult.value.replace(/,/g, "");
      return parseFloat(cleanValue);
    }

    console.warn("Could not get Switchboard price from page");
    return null;
  } catch (error) {
    console.warn(`Failed to get Switchboard price: ${error}`);
    return null;
  }
}

/**
 * Get price from Jupiter Price API V3
 */
export async function getJupiterPrice(mint: string): Promise<number | null> {
  try {
    const url = `${JUPITER_PRICE_API}?ids=${mint}`;
    const response = await fetch(url);

    if (!response.ok) {
      console.warn(`Jupiter API returned ${response.status}`);
      return null;
    }

    const data: JupiterPriceV3Response = await response.json();
    const priceData = data[mint];

    if (priceData && priceData.usdPrice !== undefined) {
      return priceData.usdPrice;
    }

    return null;
  } catch (error) {
    console.warn(`Failed to get Jupiter price: ${error}`);
    return null;
  }
}

/**
 * Compare oracle price with Jupiter price
 *
 * @param oraclePrice Price from the oracle
 * @param jupiterPrice Price from Jupiter
 * @param tolerancePercent Maximum allowed deviation (default 1%)
 */
export function comparePrices(
  oraclePrice: number,
  jupiterPrice: number | null,
  tolerancePercent: number = DEFAULT_PRICE_TOLERANCE_PERCENT
): PriceComparisonResult {
  if (jupiterPrice === null) {
    return {
      oraclePrice,
      jupiterPrice: null,
      deviationPercent: null,
      isWithinTolerance: false,
      tolerancePercent,
      error: "Could not fetch Jupiter price for comparison",
    };
  }

  const deviation = Math.abs(oraclePrice - jupiterPrice) / jupiterPrice;
  const deviationPercent = deviation * 100;
  const isWithinTolerance = deviationPercent <= tolerancePercent;

  const result: PriceComparisonResult = {
    oraclePrice,
    jupiterPrice,
    deviationPercent,
    isWithinTolerance,
    tolerancePercent,
  };

  if (!isWithinTolerance) {
    result.error = `Price deviation ${deviationPercent.toFixed(2)}% exceeds ${tolerancePercent}% tolerance`;
  }

  return result;
}

/**
 * Validate that the oracle ticker matches the expected asset
 *
 * @param oracleName Name/ticker from the oracle (e.g., "SOL/USD")
 * @param expectedAsset Expected asset symbol (e.g., "SOL")
 */
export function validateTicker(
  oracleName: string | undefined,
  expectedAsset: string
): TickerValidationResult {
  if (!oracleName) {
    return {
      isValid: false,
      expectedAsset,
      actualTicker: null,
      error: "Oracle name/ticker not found",
    };
  }

  // Extract the base asset from ticker (e.g., "SOL/USD" -> "SOL")
  const tickerBase = oracleName.split("/")[0]?.trim().toUpperCase();
  const expectedUpper = expectedAsset.toUpperCase();

  // Check if ticker contains the expected asset
  const isValid = tickerBase === expectedUpper;

  return {
    isValid,
    expectedAsset,
    actualTicker: oracleName,
    error: isValid ? undefined : `Ticker mismatch: expected ${expectedAsset}, got ${tickerBase} (from "${oracleName}")`,
  };
}

/**
 * Full oracle validation including ticker and price sanity check
 *
 * @param connection Solana connection
 * @param oracleAddress Oracle feed address
 * @param mint Token mint for Jupiter price comparison
 * @param oracleType Type of oracle (only validates Switchboard)
 * @param expectedAsset Expected asset symbol for ticker validation (e.g., "SOL")
 */
export async function validateOracle(
  connection: Connection,
  oracleAddress: string,
  mint: string,
  oracleType: "kaminoPythPush" | "kaminoSwitchboardPull",
  expectedAsset: string
): Promise<OracleValidationReport> {
  const errors: string[] = [];

  // Only validate Switchboard oracles
  if (oracleType !== "kaminoSwitchboardPull") {
    return {
      switchboard: {
        isValid: true,
        feedAddress: oracleAddress,
        apiUrl: "",
        uiUrl: "",
        error: "Skipped - not a Switchboard oracle",
      },
      overallValid: true,
      errors: ["Oracle validation skipped for non-Switchboard oracle type"],
    };
  }

  // Validate Switchboard oracle
  const switchboard = await validateSwitchboardOracle(oracleAddress);

  if (!switchboard.isValid) {
    if (!switchboard.authorityValid && switchboard.authority) {
      errors.push(
        `Switchboard authority mismatch: expected ${SWITCHBOARD_EXPECTED_AUTHORITY}, got ${switchboard.authority}`
      );
    }
    if (switchboard.error) {
      errors.push(`Switchboard validation error: ${switchboard.error}`);
    }
  }

  // Ticker validation
  const tickerValidation = validateTicker(switchboard.name, expectedAsset);
  if (!tickerValidation.isValid && tickerValidation.error) {
    errors.push(tickerValidation.error);
  }

  // Price comparison
  let priceComparison: PriceComparisonResult | undefined;

  const oraclePrice = await getSwitchboardPrice(
    connection,
    new PublicKey(oracleAddress)
  );

  if (oraclePrice !== null) {
    const jupiterPrice = await getJupiterPrice(mint);
    priceComparison = comparePrices(oraclePrice, jupiterPrice);

    if (priceComparison.error) {
      errors.push(priceComparison.error);
    }
  } else {
    errors.push("Could not fetch oracle price for sanity check");
  }

  // Overall validity - all checks must pass
  const overallValid =
    switchboard.isValid &&
    tickerValidation.isValid &&
    (priceComparison?.isWithinTolerance ?? false);

  // Close the browser to free resources
  await closeBrowser();

  return {
    switchboard,
    tickerValidation,
    priceComparison,
    overallValid,
    errors,
  };
}

/**
 * Format oracle validation result for console/markdown output
 */
export function formatOracleValidation(
  report: OracleValidationReport,
  assetName: string
): string {
  const lines: string[] = [];

  lines.push(`=== Oracle Validation for ${assetName} ===`);
  lines.push("");

  // Switchboard validation
  lines.push("**Switchboard Oracle:**");
  if (report.switchboard.error && !report.switchboard.authority) {
    lines.push(`  Status: Error - ${report.switchboard.error}`);
  } else {
    lines.push(
      `  Feed: ${report.switchboard.feedAddress}`
    );
    if (report.switchboard.name) {
      lines.push(`  Name: ${report.switchboard.name}`);
    }
    lines.push(
      `  Authority: ${report.switchboard.authority || "unknown"}`
    );
    lines.push(
      `  Authority Valid: ${report.switchboard.authorityValid ? "Yes" : "NO - MISMATCH"}`
    );
    lines.push(`  UI: ${report.switchboard.uiUrl}`);
  }
  lines.push("");

  // Ticker validation
  if (report.tickerValidation) {
    lines.push("**Ticker Validation:**");
    lines.push(`  Expected: ${report.tickerValidation.expectedAsset}/USD`);
    lines.push(`  Actual: ${report.tickerValidation.actualTicker || "Not found"}`);
    lines.push(`  Valid: ${report.tickerValidation.isValid ? "Yes" : "NO - MISMATCH"}`);
    lines.push("");
  }

  // Price comparison
  if (report.priceComparison) {
    lines.push("**Price Sanity Check:**");
    lines.push(
      `  Oracle Price: $${report.priceComparison.oraclePrice.toFixed(6)}`
    );
    if (report.priceComparison.jupiterPrice !== null) {
      lines.push(
        `  Jupiter Price: $${report.priceComparison.jupiterPrice.toFixed(6)}`
      );
      lines.push(
        `  Deviation: ${report.priceComparison.deviationPercent?.toFixed(2)}%`
      );
      lines.push(
        `  Tolerance: ${report.priceComparison.tolerancePercent}%`
      );
      lines.push(
        `  Within Tolerance: ${report.priceComparison.isWithinTolerance ? "Yes" : "NO - EXCEEDS TOLERANCE"}`
      );
    } else {
      lines.push(`  Jupiter Price: Not available`);
    }
    lines.push("");
  }

  // Errors
  if (report.errors.length > 0) {
    lines.push("**Errors:**");
    for (const error of report.errors) {
      lines.push(`  - ${error}`);
    }
    lines.push("");
  }

  // Overall status
  lines.push(
    `**Overall Status:** ${report.overallValid ? "VALID" : "FAILED"}`
  );

  return lines.join("\n");
}
