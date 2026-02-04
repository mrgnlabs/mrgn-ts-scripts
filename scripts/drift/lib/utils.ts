import { PublicKey, AccountMeta } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { bigNumberToWrappedI80F48, WrappedI80F48 } from "@mrgnlabs/mrgn-common";
import { OperationalStateRaw, RiskTierRaw } from "@mrgnlabs/marginfi-client-v2";

// Constants
export const DRIFT_PROGRAM_ID = new PublicKey("dRiftyHA39MWEi3m9aunc5MzRF1JYuBsbn6VPcn33UH");
export const I80F48_ONE = bigNumberToWrappedI80F48(1);
export const DRIFT_SCALED_BALANCE_DECIMALS = 9;
export const DRIFT_PRECISION_DECIMALS = 10;

// Drift config interface
export interface DriftConfigCompact {
  oracle: PublicKey;
  assetWeightInit: WrappedI80F48;
  assetWeightMaint: WrappedI80F48;
  depositLimit: BN;
  oracleSetup: { driftPythPull: {} } | { driftSwitchboardPull: {} };
  operationalState: OperationalStateRaw;
  riskTier: RiskTierRaw;
  configFlags: number;
  totalAssetValueInitLimit: BN;
  oracleMaxAge: number;
  oracleMaxConfidence: number;
}

export function deriveSpotMarketPDA(marketIndex: number): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("spot_market"),
      new BN(marketIndex).toArrayLike(Buffer, "le", 2),
    ],
    DRIFT_PROGRAM_ID
  );
}

export function deriveDriftStatePDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("drift_state")],
    DRIFT_PROGRAM_ID
  );
}

export function deriveSpotMarketVaultPDA(marketIndex: number): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("spot_market_vault"),
      new BN(marketIndex).toArrayLike(Buffer, "le", 2),
    ],
    DRIFT_PROGRAM_ID
  );
}

export function deriveDriftSignerPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("drift_signer")],
    DRIFT_PROGRAM_ID
  );
}

export function deriveDriftUserPDA(
  authority: PublicKey,
  subAccountId: number = 0
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("user"),
      authority.toBuffer(),
      new BN(subAccountId).toArrayLike(Buffer, "le", 2),
    ],
    DRIFT_PROGRAM_ID
  );
}

export function deriveDriftUserStatsPDA(authority: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("user_stats"), authority.toBuffer()],
    DRIFT_PROGRAM_ID
  );
}
