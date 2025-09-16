import { BN, Program } from "@coral-xyz/anchor";
import { TOKEN_PROGRAM_ID } from "@mrgnlabs/mrgn-common";
import {
  TransactionInstruction,
  AccountMeta,
  PublicKey,
} from "@solana/web3.js";
import { Marginfi } from "../../idl/marginfi_kamino";
import { KaminoConfigCompact, KLEND_PROGRAM_ID } from "./kamino-types";
import {
  deriveBankWithSeed,
  deriveLiquidityVault,
  deriveLiquidityVaultAuthority,
} from "../common/pdas";
import {
  deriveBaseObligation,
  deriveLendingMarketAuthority,
  deriveReserveCollateralMint,
  deriveReserveCollateralSupply,
  deriveReserveLiquiditySupply,
  deriveUserMetadata,
} from "./pdas";

export interface AddKaminoBankArgs {
  seed: BN;
  config: KaminoConfigCompact;
}

export interface AddKaminoBankAccounts {
  group: PublicKey;
  feePayer: PublicKey;
  bankMint: PublicKey;
  kaminoReserve: PublicKey;
  kaminoMarket: PublicKey;
  oracle: PublicKey;
  tokenProgram?: PublicKey;
  admin?: PublicKey;
}

export const makeAddKaminoBankIx = (
  program: Program<Marginfi>,
  accounts: AddKaminoBankAccounts,
  args: AddKaminoBankArgs
): Promise<TransactionInstruction> => {
  const oracleMeta: AccountMeta = {
    pubkey: accounts.oracle,
    isSigner: false,
    isWritable: false,
  };
  const reserveMeta: AccountMeta = {
    pubkey: accounts.kaminoReserve,
    isSigner: false,
    isWritable: false,
  };

  const [bankKey] = deriveBankWithSeed(
    program.programId,
    accounts.group,
    accounts.bankMint,
    args.seed
  );
  console.log("key to be init: " + bankKey);
  const [liquidityVaultAuthority] = deriveLiquidityVaultAuthority(
    program.programId,
    bankKey
  );
  const [kaminoObligation] = deriveBaseObligation(
    liquidityVaultAuthority,
    accounts.kaminoMarket
  );

  const ix = program.methods
    .lendingPoolAddBankKamino(args.config, args.seed)
    .accounts({
      kaminoObligation,
      tokenProgram: accounts.tokenProgram || TOKEN_PROGRAM_ID,
      ...accounts,
    })
    .accountsPartial({
      bank: bankKey,
      admin: accounts.admin,
    })
    .remainingAccounts([oracleMeta, reserveMeta])
    .instruction();

  return ix;
};

const DEFAULT_INIT_OBLIGATION_OPTIONAL_ACCOUNTS = {
  obligationFarmUserState: null,
  reserveFarmState: null,
  referrerUserMetadata: null,
  pythOracle: null,
  switchboardPriceOracle: null,
  switchboardTwapOracle: null,
  scopePrices: null,
} as const;

export interface InitObligationAccounts {
  feePayer: PublicKey;
  bank: PublicKey;
  signerTokenAccount: PublicKey;
  lendingMarket: PublicKey;
  reserveLiquidityMint: PublicKey;
  reserve?: PublicKey;

  obligationFarmUserState?: PublicKey | null;
  reserveFarmState?: PublicKey | null;
  referrerUserMetadata?: PublicKey | null;
  // Oracle accounts for refreshing the reserve, pick just one.
  pythOracle?: PublicKey | null;
  switchboardPriceOracle?: PublicKey | null;
  switchboardTwapOracle?: PublicKey | null;
  scopePrices?: PublicKey | null;
}

/**
 * Initialize a Kamino obligation for a marginfi account
 *
 * This instruction creates the user metadata and obligation accounts in the Kamino program. It
 * requires:
 * - feePayer: The account that will pay for the transaction, and owns `signerTokenAccount` doesn't
 *   have to be the admin
 * - bank: The bank account that the obligation is for
 * - lendingMarket: The Kamino lending market the bank's reserve falls under.
 *
 * @param program The marginfi program
 * @param accounts
 * @param amount - Any nominal amount is fine. Default 100 (NO DECIMALS, just 100 exactly)
 * @returns The instruction to initialize a Kamino obligation
 */
export const makeInitObligationIx = async (
  program: Program<Marginfi>,
  accounts: InitObligationAccounts,
  amount?: BN
): Promise<TransactionInstruction> => {
  // Merge with defaults...
  const accs = {
    ...DEFAULT_INIT_OBLIGATION_OPTIONAL_ACCOUNTS,
    ...accounts,
  };

  const [liquidityVault] = deriveLiquidityVault(
    program.programId,
    accounts.bank
  );
  const [liquidityVaultAuthority] = deriveLiquidityVaultAuthority(
    program.programId,
    accounts.bank
  );
  const [userMetadata] = deriveUserMetadata(
    KLEND_PROGRAM_ID,
    liquidityVaultAuthority
  );
  const [lendingMarketAuthority] = deriveLendingMarketAuthority(
    KLEND_PROGRAM_ID,
    accounts.lendingMarket
  );
  const [reserveLiquiditySupply] = deriveReserveLiquiditySupply(
    KLEND_PROGRAM_ID,
    accounts.lendingMarket,
    accounts.reserveLiquidityMint
  );
  const [reserveCollateralMint] = deriveReserveCollateralMint(
    KLEND_PROGRAM_ID,
    accounts.lendingMarket,
    accounts.reserveLiquidityMint
  );
  const [reserveCollateralSupply] = deriveReserveCollateralSupply(
    KLEND_PROGRAM_ID,
    accounts.lendingMarket,
    accounts.reserveLiquidityMint
  );
  const [baseObligation] = deriveBaseObligation(
    accounts.bank,
    accounts.lendingMarket,
    KLEND_PROGRAM_ID
  );

  const ix = await program.methods
    .kaminoInitObligation(amount ?? new BN(100))
    .accounts({
      // Derived
      userMetadata,
      lendingMarketAuthority,
      reserveLiquiditySupply,
      reserveCollateralMint,
      reserveDestinationDepositCollateral: reserveCollateralSupply,
      liquidityTokenProgram: TOKEN_PROGRAM_ID,
      ...accs,
    })
    .accountsPartial({
      // TODO fix this IX running when the bank does not yet exist using partial here..
      // liquidityVault: liquidityVault,
      // bank: accounts.bank,
      // kaminoReserve: accounts.reserve,
      // kaminoObligation: baseObligation,
      // mint: accounts.reserveLiquidityMint,
    })
    .instruction();

  return ix;
};
