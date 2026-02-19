import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { bigNumberToWrappedI80F48, WrappedI80F48 } from "@mrgnlabs/mrgn-common";

// --- Program IDs ---

export const JUPLEND_LENDING_PROGRAM_ID = new PublicKey(
  "jup3YeL8QhtSx1e253b2FDvsMNC87fDrgQZivbrndc9",
);

export const JUPLEND_LIQUIDITY_PROGRAM_ID = new PublicKey(
  "jupeiUmn818Jg1ekPURTpr4mFo29p46vygyykFJ3wZC",
);

export const JUPLEND_EARN_REWARDS_PROGRAM_ID = new PublicKey(
  "jup7TthsMgcR9Y3L277b8Eo9uboVSmu1utkuXHNUKar",
);

export const I80F48_ONE = bigNumberToWrappedI80F48(1);

// --- Config type ---

export interface JuplendConfigCompact {
  oracle: PublicKey;
  assetWeightInit: WrappedI80F48;
  assetWeightMaint: WrappedI80F48;
  depositLimit: BN;
  oracleSetup: { juplendPythPull: {} } | { juplendSwitchboardPull: {} };
  riskTier: { collateral: {} } | { isolated: {} };
  configFlags: number;
  totalAssetValueInitLimit: BN;
  oracleMaxAge: number;
  oracleMaxConfidence: number;
}

// --- Lending-program PDAs ---

export function findJuplendLendingAdminPda(
  lendingProgramId: PublicKey = JUPLEND_LENDING_PROGRAM_ID,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("lending_admin")],
    lendingProgramId,
  );
}

export function findJuplendFTokenMintPda(
  underlyingMint: PublicKey,
  lendingProgramId: PublicKey = JUPLEND_LENDING_PROGRAM_ID,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("f_token_mint"), underlyingMint.toBuffer()],
    lendingProgramId,
  );
}

export function findJuplendLendingPda(
  underlyingMint: PublicKey,
  fTokenMint: PublicKey,
  lendingProgramId: PublicKey = JUPLEND_LENDING_PROGRAM_ID,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("lending"), underlyingMint.toBuffer(), fTokenMint.toBuffer()],
    lendingProgramId,
  );
}

// --- Liquidity-program PDAs ---

export function findJuplendLiquidityPda(
  liquidityProgramId: PublicKey = JUPLEND_LIQUIDITY_PROGRAM_ID,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("liquidity")],
    liquidityProgramId,
  );
}

export function findJuplendLiquidityTokenReservePda(
  underlyingMint: PublicKey,
  liquidityProgramId: PublicKey = JUPLEND_LIQUIDITY_PROGRAM_ID,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("reserve"), underlyingMint.toBuffer()],
    liquidityProgramId,
  );
}

export function findJuplendLiquidityRateModelPda(
  underlyingMint: PublicKey,
  liquidityProgramId: PublicKey = JUPLEND_LIQUIDITY_PROGRAM_ID,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("rate_model"), underlyingMint.toBuffer()],
    liquidityProgramId,
  );
}

export function findJuplendLiquiditySupplyPositionPda(
  underlyingMint: PublicKey,
  lendingPda: PublicKey,
  liquidityProgramId: PublicKey = JUPLEND_LIQUIDITY_PROGRAM_ID,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("user_supply_position"),
      underlyingMint.toBuffer(),
      lendingPda.toBuffer(),
    ],
    liquidityProgramId,
  );
}

export function deriveJuplendLiquidityVaultAta(
  underlyingMint: PublicKey,
  liquidityPda: PublicKey,
  tokenProgramId: PublicKey = TOKEN_PROGRAM_ID,
): PublicKey {
  return getAssociatedTokenAddressSync(
    underlyingMint,
    liquidityPda,
    true,
    tokenProgramId,
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );
}

// --- Rewards-program PDAs ---

export function findJuplendRewardsRateModelPda(
  underlyingMint: PublicKey,
  rewardsProgramId: PublicKey = JUPLEND_EARN_REWARDS_PROGRAM_ID,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("lending_rewards_rate_model"), underlyingMint.toBuffer()],
    rewardsProgramId,
  );
}

export function findJuplendClaimAccountPda(
  user: PublicKey,
  mint: PublicKey,
  liquidityProgramId: PublicKey = JUPLEND_LIQUIDITY_PROGRAM_ID,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("user_claim"), user.toBuffer(), mint.toBuffer()],
    liquidityProgramId,
  );
}

// --- Composite CPI account deriver ---

export type JuplendCpiAccounts = {
  lendingAdmin: PublicKey;
  fTokenMint: PublicKey;
  lending: PublicKey;
  liquidity: PublicKey;
  liquidityProgram: PublicKey;
  tokenReserve: PublicKey;
  rateModel: PublicKey;
  vault: PublicKey;
  supplyPosition: PublicKey;
  rewardsRateModel: PublicKey;
};

export function deriveJuplendCpiAccounts(
  underlyingMint: PublicKey,
  tokenProgramId: PublicKey = TOKEN_PROGRAM_ID,
): JuplendCpiAccounts {
  const [lendingAdmin] = findJuplendLendingAdminPda();
  const [fTokenMint] = findJuplendFTokenMintPda(underlyingMint);
  const [lending] = findJuplendLendingPda(underlyingMint, fTokenMint);
  const [liquidity] = findJuplendLiquidityPda();
  const [tokenReserve] = findJuplendLiquidityTokenReservePda(underlyingMint);
  const [rateModel] = findJuplendLiquidityRateModelPda(underlyingMint);
  const vault = deriveJuplendLiquidityVaultAta(
    underlyingMint,
    liquidity,
    tokenProgramId,
  );
  const [supplyPosition] = findJuplendLiquiditySupplyPositionPda(
    underlyingMint,
    lending,
  );
  const [rewardsRateModel] = findJuplendRewardsRateModelPda(underlyingMint);

  return {
    lendingAdmin,
    fTokenMint,
    lending,
    liquidity,
    liquidityProgram: JUPLEND_LIQUIDITY_PROGRAM_ID,
    tokenReserve,
    rateModel,
    vault,
    supplyPosition,
    rewardsRateModel,
  };
}

// --- Config parser ---

type Config = {
  PROGRAM_ID: string;
  GROUP_KEY: PublicKey;
  BANK_MINT: PublicKey;
  JUPLEND_LENDING: PublicKey;
  F_TOKEN_MINT: PublicKey;
  ORACLE: PublicKey;
  ORACLE_SETUP: { juplendPythPull: {} } | { juplendSwitchboardPull: {} };
  SEED: BN;
  ADMIN?: PublicKey;
  FEE_PAYER?: PublicKey;
  MULTISIG_PAYER?: PublicKey;

  ASSET_WEIGHT_INIT?: string;
  ASSET_WEIGHT_MAINT?: string;
  DEPOSIT_LIMIT?: string;
  TOTAL_ASSET_VALUE_INIT_LIMIT?: string;
  RISK_TIER?: string;
  ORACLE_MAX_AGE?: number;
  CONFIG_FLAGS?: number;
};

export { Config };

export function parseConfig(rawConfig: string): Config {
  const json = JSON.parse(rawConfig);

  let ORACLE_SETUP: Config["ORACLE_SETUP"];
  if (
    json.oracleSetup === "juplendSwitchboardPull" ||
    json.oracleSetup === "switchboardPull"
  ) {
    ORACLE_SETUP = { juplendSwitchboardPull: {} };
  } else {
    ORACLE_SETUP = { juplendPythPull: {} };
  }

  return {
    PROGRAM_ID: json.programId,
    GROUP_KEY: new PublicKey(json.group),
    BANK_MINT: new PublicKey(json.bankMint),
    JUPLEND_LENDING: new PublicKey(json.juplendLending),
    F_TOKEN_MINT: new PublicKey(json.fTokenMint),
    ORACLE: new PublicKey(json.oracle),
    ORACLE_SETUP,
    SEED: new BN(json.seed),
    ADMIN: json.admin ? new PublicKey(json.admin) : undefined,
    FEE_PAYER: json.feePayer ? new PublicKey(json.feePayer) : undefined,
    MULTISIG_PAYER: json.multisigPayer
      ? new PublicKey(json.multisigPayer)
      : undefined,
    ASSET_WEIGHT_INIT: json.assetWeightInit,
    ASSET_WEIGHT_MAINT: json.assetWeightMaint,
    DEPOSIT_LIMIT: json.depositLimit,
    TOTAL_ASSET_VALUE_INIT_LIMIT: json.totalAssetValueInitLimit,
    RISK_TIER: json.riskTier,
    ORACLE_MAX_AGE: json.oracleMaxAge,
    CONFIG_FLAGS: json.configFlags,
  };
}
