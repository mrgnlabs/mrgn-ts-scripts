/**
 * Marginfi Bank Configuration: 2Z (DoubleZero)
 *
 * Asset Type: Volatile Ecosystem Token
 * Similar to: JTO, other governance/ecosystem tokens
 */

import { PublicKey } from "@solana/web3.js";
import { MarginfiBankConfig } from "./marginfi-bank-config.types";

export const twoZConfig: MarginfiBankConfig = {
  // ============ Basic Info ============
  assetName: "2Z",
  assetDescription: "DoubleZero - Volatile ecosystem token",

  // ============ Network Config ============
  programId: "MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA", // Mainnet
  groupKey: new PublicKey("4qp6Fx6tnZkY5Wropq9wUYgtFxXKwE6viZxFHg3rdAG8"), // Mainnet group
  admin: new PublicKey("CYXEgwbPHu2f9cY3mcUkinzDoDcsSan7myh1uBvYRbEw"), // Multisig
  feePayer: new PublicKey("CYXEgwbPHu2f9cY3mcUkinzDoDcsSan7myh1uBvYRbEw"), // Multisig
  multisigPayer: new PublicKey("CYXEgwbPHu2f9cY3mcUkinzDoDcsSan7myh1uBvYRbEw"),

  // ============ Token Config ============
  bankMint: new PublicKey("J6pQQ3FAcJQeWPPGppWRb4nM8jU3wLyYbRrLh7feMfvd"), // 2Z mint
  decimals: 8,
  tokenProgram: "spl-token",
  seed: 0,

  // ============ Oracle Config ============
  oracle: new PublicKey("Ho9iLZ15SreUnzRpbMHLTzQfCQugmsNnUQ3rLB5V75Ng"), // Switchboard Pull
  oracleType: "switchboard",
  oracleMaxAge: 70,
  oracleMaxConfidence: 0,

  // ============ Risk Parameters ============
  // Aligned with PUMP - more conservative collateral, less punishing borrows
  assetWeightInit: 0.40,        // 40% collateral value when opening positions
  assetWeightMaint: 0.50,       // 50% collateral value for existing positions
  liabilityWeightInit: 1.60,    // 160% borrow value when opening positions
  liabilityWeightMaint: 1.42,   // 142% borrow value for existing positions

  // ============ Limits ============
  // Based on $2.5M total value at $0.20/token
  depositLimit: 12_500_000,            // 12.5M 2Z ($2.5M at $0.20/token)
  borrowLimit: 1_250_000,              // 1.25M 2Z (10% of deposits, aligned with PUMP)
  totalAssetValueInitLimit: 2_500_000, // $2.5M total value cap

  // ============ Interest Rate Config ============
  optimalUtilizationRate: 0.50,    // 50% optimal utilization (aligned with PUMP, lower than standard 80%)
  plateauInterestRate: 0.10,       // 10% APR at plateau
  maxInterestRate: 3.00,           // 300% APR max (high to discourage borrowing)
  insuranceFeeFixedApr: 0,
  insuranceIrFee: 0,
  protocolFixedFeeApr: 0.01,       // 1% fixed fee APR
  protocolIrFee: 0.05,             // 5% of interest
  protocolOriginationFee: 0,

  // ============ Other Config ============
  operationalState: "operational",
  riskTier: "collateral",
  assetTag: 0, // Default asset tag for non-SOL assets
};