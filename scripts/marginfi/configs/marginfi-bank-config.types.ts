/**
 * Type definitions for Marginfi bank configuration files
 */

import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { WrappedI80F48 } from "@mrgnlabs/mrgn-common";

/**
 * Oracle types supported by Marginfi
 */
export type OracleType =
  | "pyth"           // Oracle type 3
  | "switchboard";   // Oracle type 4

/**
 * Token program types
 */
export type TokenProgramType = "spl-token" | "token-2022";

/**
 * Risk tier for the bank
 */
export type RiskTier = "collateral" | "isolated";

/**
 * Operational state for the bank
 */
export type OperationalState = "operational" | "paused" | "reduceOnly";

/**
 * Main configuration for a Marginfi bank
 */
export interface MarginfiBankConfig {
  // ============ Basic Info ============
  /** Short name for the asset (e.g., "dzSOL", "2Z") */
  assetName: string;
  /** Full description of the asset */
  assetDescription: string;

  // ============ Network Config ============
  /** Marginfi program ID (mainnet: MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA) */
  programId: string;
  /** Marginfi lending group address */
  groupKey: PublicKey;
  /** Group admin (usually multisig) */
  admin: PublicKey;
  /** Fee payer (usually multisig) */
  feePayer: PublicKey;
  /** Multisig payer for Squads (if applicable) */
  multisigPayer?: PublicKey;

  // ============ Token Config ============
  /** Token mint address */
  bankMint: PublicKey;
  /** Token decimals */
  decimals: number;
  /** Token program type */
  tokenProgram: TokenProgramType;
  /** Bank seed (usually 0 for primary banks) */
  seed: number;

  // ============ Oracle Config ============
  /** Oracle address (Pyth feed or Switchboard feed) */
  oracle: PublicKey;
  /** Oracle type */
  oracleType: OracleType;
  /** Oracle max age in seconds (usually 300) */
  oracleMaxAge: number;
  /** Oracle max confidence (0 = default 10%) */
  oracleMaxConfidence: number;

  // ============ Risk Parameters ============
  /** Initial asset weight (collateral value when opening positions) */
  assetWeightInit: number;
  /** Maintenance asset weight (collateral value for existing positions) */
  assetWeightMaint: number;
  /** Initial liability weight (borrow value when opening positions) */
  liabilityWeightInit: number;
  /** Maintenance liability weight (borrow value for existing positions) */
  liabilityWeightMaint: number;

  // ============ Limits ============
  /** Maximum deposit limit (in token units, will be multiplied by 10^decimals) */
  depositLimit: number;
  /** Maximum borrow limit (in token units, will be multiplied by 10^decimals) */
  borrowLimit: number;
  /** Total asset value init limit (in USD, no decimals) */
  totalAssetValueInitLimit: number;

  // ============ Interest Rate Config ============
  /** Optimal utilization rate (e.g., 0.85 = 85%) */
  optimalUtilizationRate: number;
  /** Interest rate at plateau (e.g., 0.1 = 10% APR) */
  plateauInterestRate: number;
  /** Maximum interest rate (e.g., 0.55 = 55% APR) */
  maxInterestRate: number;
  /** Insurance fee fixed APR */
  insuranceFeeFixedApr: number;
  /** Insurance IR fee */
  insuranceIrFee: number;
  /** Protocol fixed fee APR */
  protocolFixedFeeApr: number;
  /** Protocol IR fee */
  protocolIrFee: number;
  /** Protocol origination fee */
  protocolOriginationFee: number;

  // ============ Other Config ============
  /** Operational state */
  operationalState: OperationalState;
  /** Risk tier */
  riskTier: RiskTier;
  /** Asset tag (0 = default, 1 = SOL, etc.) */
  assetTag: number;
}

/**
 * Raw bank config with wrapped values (ready for on-chain submission)
 */
export interface BankConfigRaw {
  assetWeightInit: WrappedI80F48;
  assetWeightMaint: WrappedI80F48;
  liabilityWeightInit: WrappedI80F48;
  liabilityWeightMaint: WrappedI80F48;
  depositLimit: BN;
  borrowLimit: BN;
  riskTier: { collateral: {} } | { isolated: {} };
  assetTag: number;
  totalAssetValueInitLimit: BN;
  interestRateConfig: InterestRateConfigRaw;
  operationalState: { paused: {} } | { operational: {} } | { reduceOnly: {} };
  oracleMaxAge: number;
  oracleMaxConfidence: number;
}

/**
 * Raw interest rate config (ready for on-chain submission)
 */
export interface InterestRateConfigRaw {
  optimalUtilizationRate: WrappedI80F48;
  plateauInterestRate: WrappedI80F48;
  maxInterestRate: WrappedI80F48;
  insuranceFeeFixedApr: WrappedI80F48;
  insuranceIrFee: WrappedI80F48;
  protocolFixedFeeApr: WrappedI80F48;
  protocolIrFee: WrappedI80F48;
  protocolOriginationFee: WrappedI80F48;
}
