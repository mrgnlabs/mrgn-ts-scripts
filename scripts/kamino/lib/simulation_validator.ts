import { KaminoBankConfig } from "./config_types";

/**
 * Parsed values from simulation logs
 */
export interface ParsedSimulationParams {
  assetWeightInit?: number;
  assetWeightMaint?: number;
  depositLimit?: string;
  totalAssetValueInitLimit?: string;
  operationalState?: number; // 1 = operational
  riskTier?: number; // 0 = collateral
  assetTag?: number; // 3 = kamino
  oracleMaxConfidence?: number;
  oracleMaxAge?: number;
}

/**
 * Validation result for a single parameter
 */
export interface ParamValidation {
  param: string;
  expected: string;
  actual: string;
  match: boolean;
}

/**
 * Overall simulation validation result
 */
export interface SimulationValidationResult {
  success: boolean;
  instructionFound: boolean;
  programSucceeded: boolean;
  parsedParams: ParsedSimulationParams;
  validations: ParamValidation[];
  allParamsMatch: boolean;
}

/**
 * Parse simulation logs to extract bank parameters
 */
export function parseSimulationLogs(logs: string[]): ParsedSimulationParams {
  const params: ParsedSimulationParams = {};

  for (const log of logs) {
    // Asset weight init: 0.8000000000000007 maint: 0.8999999999999986
    const assetWeightMatch = log.match(/Asset weight init: ([\d.]+) maint: ([\d.]+)/);
    if (assetWeightMatch) {
      params.assetWeightInit = parseFloat(assetWeightMatch[1]);
      params.assetWeightMaint = parseFloat(assetWeightMatch[2]);
    }

    // deposit limit: 800000000000000 borrow limit: 0 init val limit: 160000000
    const limitsMatch = log.match(/deposit limit: (\d+) borrow limit: \d+ init val limit: (\d+)/);
    if (limitsMatch) {
      params.depositLimit = limitsMatch[1];
      params.totalAssetValueInitLimit = limitsMatch[2];
    }

    // op state: 1 risk tier: 0 asset tag: 3
    const stateMatch = log.match(/op state: (\d+) risk tier: (\d+) asset tag: (\d+)/);
    if (stateMatch) {
      params.operationalState = parseInt(stateMatch[1]);
      params.riskTier = parseInt(stateMatch[2]);
      params.assetTag = parseInt(stateMatch[3]);
    }

    // oracle conf 0 age: 300 flags: 16
    const oracleMatch = log.match(/oracle conf (\d+) age: (\d+)/);
    if (oracleMatch) {
      params.oracleMaxConfidence = parseInt(oracleMatch[1]);
      params.oracleMaxAge = parseInt(oracleMatch[2]);
    }
  }

  return params;
}

/**
 * Validate parsed simulation params against config
 */
export function validateSimulationParams(
  logs: string[],
  config: KaminoBankConfig
): SimulationValidationResult {
  const instructionFound = logs.some((log) =>
    log.includes("Instruction: LendingPoolAddBankKamino")
  );
  const programSucceeded = logs.some(
    (log) =>
      log.includes("MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA success")
  );

  const parsedParams = parseSimulationLogs(logs);
  const validations: ParamValidation[] = [];

  // Validate asset weight init (allow small floating point variance)
  if (parsedParams.assetWeightInit !== undefined) {
    const match = Math.abs(parsedParams.assetWeightInit - config.assetWeightInit) < 0.001;
    validations.push({
      param: "assetWeightInit",
      expected: config.assetWeightInit.toString(),
      actual: parsedParams.assetWeightInit.toFixed(4),
      match,
    });
  }

  // Validate asset weight maint
  if (parsedParams.assetWeightMaint !== undefined) {
    const match = Math.abs(parsedParams.assetWeightMaint - config.assetWeightMaint) < 0.001;
    validations.push({
      param: "assetWeightMaint",
      expected: config.assetWeightMaint.toString(),
      actual: parsedParams.assetWeightMaint.toFixed(4),
      match,
    });
  }

  // Validate deposit limit
  if (parsedParams.depositLimit !== undefined) {
    const match = parsedParams.depositLimit === config.depositLimit;
    validations.push({
      param: "depositLimit",
      expected: config.depositLimit,
      actual: parsedParams.depositLimit,
      match,
    });
  }

  // Validate total asset value init limit
  if (parsedParams.totalAssetValueInitLimit !== undefined) {
    const match = parsedParams.totalAssetValueInitLimit === config.totalAssetValueInitLimit;
    validations.push({
      param: "totalAssetValueInitLimit",
      expected: config.totalAssetValueInitLimit,
      actual: parsedParams.totalAssetValueInitLimit,
      match,
    });
  }

  // Validate operational state (1 = operational)
  if (parsedParams.operationalState !== undefined) {
    const match = parsedParams.operationalState === 1;
    validations.push({
      param: "operationalState",
      expected: "1 (operational)",
      actual: parsedParams.operationalState.toString(),
      match,
    });
  }

  // Validate risk tier (0 = collateral)
  if (parsedParams.riskTier !== undefined) {
    const match = parsedParams.riskTier === 0;
    validations.push({
      param: "riskTier",
      expected: "0 (collateral)",
      actual: parsedParams.riskTier.toString(),
      match,
    });
  }

  // Validate asset tag (3 = kamino)
  if (parsedParams.assetTag !== undefined) {
    const match = parsedParams.assetTag === 3;
    validations.push({
      param: "assetTag",
      expected: "3 (kamino)",
      actual: parsedParams.assetTag.toString(),
      match,
    });
  }

  // Validate oracle max confidence
  if (parsedParams.oracleMaxConfidence !== undefined && config.oracleMaxConfidence !== undefined) {
    const match = parsedParams.oracleMaxConfidence === config.oracleMaxConfidence;
    validations.push({
      param: "oracleMaxConfidence",
      expected: config.oracleMaxConfidence.toString(),
      actual: parsedParams.oracleMaxConfidence.toString(),
      match,
    });
  }

  // Validate oracle max age (logs as u8, so values > 255 wrap around)
  if (parsedParams.oracleMaxAge !== undefined && config.oracleMaxAge !== undefined) {
    const expectedLogged = config.oracleMaxAge % 256;
    const match = parsedParams.oracleMaxAge === expectedLogged;
    validations.push({
      param: "oracleMaxAge",
      expected: `${config.oracleMaxAge} (logs as ${expectedLogged})`,
      actual: parsedParams.oracleMaxAge.toString(),
      match,
    });
  }

  const allParamsMatch = validations.every((v) => v.match);

  return {
    success: instructionFound && programSucceeded && allParamsMatch,
    instructionFound,
    programSucceeded,
    parsedParams,
    validations,
    allParamsMatch,
  };
}

/**
 * Format simulation validation for console output
 */
export function formatSimulationValidation(result: SimulationValidationResult): string {
  const lines: string[] = [];

  lines.push(`Instruction found: ${result.instructionFound ? "YES" : "NO"}`);
  lines.push(`Program succeeded: ${result.programSucceeded ? "YES" : "NO"}`);

  if (result.validations.length > 0) {
    lines.push(`Parameter validation:`);
    for (const v of result.validations) {
      const status = v.match ? "OK" : "MISMATCH";
      lines.push(`  ${v.param}: ${v.actual} (expected ${v.expected}) [${status}]`);
    }
  }

  return lines.join("\n");
}
