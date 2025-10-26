/**
 * Marginfi Bank Configuration: dzSOL (DoubleZero Staked SOL)
 *
 * Asset Type: Liquid Staking Token (LST)
 * Similar to: mSOL, jitoSOL, bSOL
 */

import { PublicKey } from "@solana/web3.js";
import { MarginfiBankConfig } from "./marginfi-bank-config.types";

export const dzsolConfig: MarginfiBankConfig = {
  // ============ Basic Info ============
  assetName: "dzSOL",
  assetDescription: "DoubleZero Staked SOL - Liquid staking token",

  // ============ Network Config ============
  programId: "MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA", // Mainnet
  groupKey: new PublicKey("4qp6Fx6tnZkY5Wropq9wUYgtFxXKwE6viZxFHg3rdAG8"), // Mainnet group
  admin: new PublicKey("CYXEgwbPHu2f9cY3mcUkinzDoDcsSan7myh1uBvYRbEw"), // Multisig
  feePayer: new PublicKey("CYXEgwbPHu2f9cY3mcUkinzDoDcsSan7myh1uBvYRbEw"), // Multisig
  multisigPayer: new PublicKey("CYXEgwbPHu2f9cY3mcUkinzDoDcsSan7myh1uBvYRbEw"),

  // ============ Token Config ============
  bankMint: new PublicKey("Gekfj7SL2fVpTDxJZmeC46cTYxinjB6gkAnb6EGT6mnn"), // dzSOL mint
  decimals: 9,
  tokenProgram: "spl-token",
  seed: 0,

  // ============ Oracle Config ============
  oracle: new PublicKey("Ho9iLZ15SreUnzRpbMHLTzQfCQugmsNnUQ3rLB5V75Ng"), // Switchboard Pull (dzSOL/USD)
  oracleType: "switchboard",
  oracleMaxAge: 70,
  oracleMaxConfidence: 0,

  // ============ Risk Parameters ============
  // Two patterns observed for LSTs:

  // OPTION 1: Standard LST weights (most established tokens)
  assetWeightInit: 0.65,        // 65% collateral value when opening positions
  assetWeightMaint: 0.80,       // 80% collateral value for existing positions
  liabilityWeightInit: 1.30,    // 130% borrow value when opening positions
  liabilityWeightMaint: 1.20,   // 120% borrow value for existing positions

  // OPTION 2: Conservative weights (compassSol, LainSol, stSol - newer/less established)
  // assetWeightInit: 0.00,        // Cannot be used as collateral
  // assetWeightMaint: 0.00,       // Cannot be used as collateral
  // liabilityWeightInit: 2.50,    // Very expensive to borrow (250%)
  // liabilityWeightMaint: 1.50,   // Expensive to maintain borrows (150%)

  // Current choice: OPTION 1 (Standard LST) - Change if dzSOL should start more conservatively

  // ============ Limits ============
  // Standard second-tier LST limits
  depositLimit: 25_000,                // 25K dzSOL deposit cap (~$5M at $200/SOL)
  borrowLimit: 5_000,                  // 5K dzSOL borrow cap (20% of deposits)
  totalAssetValueInitLimit: 8_750_000, // $8.75M total value cap (25K × $350 for SOL growth room)

  // ============ Interest Rate Config ============
  optimalUtilizationRate: 0.80,    // 80% optimal utilization
  plateauInterestRate: 0.10,       // 10% APR at plateau
  maxInterestRate: 1.25,           // 125% APR max
  insuranceFeeFixedApr: 0,
  insuranceIrFee: 0,
  protocolFixedFeeApr: 0.01,       // 1% fixed fee APR (standard)
  protocolIrFee: 0.135,            // 13.5% of interest (standard)
  protocolOriginationFee: 0,

  // ============ Other Config ============
  operationalState: "operational",
  riskTier: "collateral",
  assetTag: 0, // Default asset tag
};