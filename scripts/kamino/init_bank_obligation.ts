// Call this once after each bank is made.
import {
  ComputeBudgetProgram,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { TOKEN_PROGRAM_ID, WrappedI80F48 } from "@mrgnlabs/mrgn-common";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import {
  FARMS_PROGRAM_ID,
  KLEND_PROGRAM_ID,
  OracleSetupRawWithKamino,
} from "./kamino-types";
import { commonSetup } from "../../lib/common-setup";
import { makeInitObligationIx } from "./ixes-common";
import {
  getAssociatedTokenAddressSync,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import { deriveBaseObligation, deriveUserState } from "./pdas";
import {
  deriveBankWithSeed,
  deriveLiquidityVaultAuthority,
} from "../common/pdas";

/**
 * If true, send the tx. If false, output the unsigned b58 tx to console.
 */
const sendTx = true;

type Config = {
  PROGRAM_ID: string;
  GROUP_KEY: PublicKey;

  /** Group admin (generally the MS on mainnet) */
  ADMIN: PublicKey;
  /** Pays flat sol fee to init and rent (generally the MS on mainnet) */
  FEE_PAYER: PublicKey;
  BANK_MINT: PublicKey;
  KAMINO_RESERVE: PublicKey;
  KAMINO_MARKET: PublicKey;
  /** Oracle address the Kamino Reserve uses. Typically read from reserve.config.tokenInfo.scope */
  RESERVE_ORACLE: PublicKey;
  /** Reserve Farm state. Can be read from reserve.farmCollateral. Technically optional, but almost
   * every (perhaps every?) Kamino reserve in prod has one. */
  FARM_STATE: PublicKey;
  SEED: number;
  TOKEN_PROGRAM: PublicKey;
  MULTISIG_PAYER?: PublicKey; // May be omitted if not using squads
};

const config: Config = {
  PROGRAM_ID: "5UDghkpgW1HfYSrmEj2iAApHShqU44H6PKTAar9LL9bY",
  GROUP_KEY: new PublicKey("ERBiJdWtnVBBd4gFm7YVHT3a776x5NbGbJBR5BDvsxtj"),

  ADMIN: new PublicKey("725Z4QQUVhRiXcCdf4cQTrxXYmQXyW9zgVkW5PDVSJz4"),
  FEE_PAYER: new PublicKey("725Z4QQUVhRiXcCdf4cQTrxXYmQXyW9zgVkW5PDVSJz4"),
  BANK_MINT: new PublicKey("2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo"),
  KAMINO_RESERVE: new PublicKey("2gc9Dm1eB6UgVYFBUN9bWks6Kes9PbWSaPaa9DqyvEiN"),
  KAMINO_MARKET: new PublicKey("7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF"),
  RESERVE_ORACLE: new PublicKey("3NJYftD5sjVfxSnUdZ1wVML8f3aC6mp1CXCL6L7TnU8C"),
  FARM_STATE: new PublicKey("DEe2NZ5dAXGxC7M8Gs9Esd9wZRPdQzG8jNamXqhL5yku"),
  SEED: 0,
  TOKEN_PROGRAM: TOKEN_2022_PROGRAM_ID,

  MULTISIG_PAYER: new PublicKey("CYXEgwbPHu2f9cY3mcUkinzDoDcsSan7myh1uBvYRbEw"),
};

async function main() {
  const user = commonSetup(
    sendTx,
    config.PROGRAM_ID,
    "/keys/zerotrade_admin.json",
    config.MULTISIG_PAYER,
    "kamino"
  );
  const program = user.program;
  const connection = user.connection;

  const [bankKey] = deriveBankWithSeed(
    program.programId,
    config.GROUP_KEY,
    config.BANK_MINT,
    new BN(config.SEED)
  );
  console.log("init obligation for bank: " + bankKey);
  const [lendingVaultAuthority] = deriveLiquidityVaultAuthority(
    program.programId,
    bankKey
  );
  const [baseObligation] = deriveBaseObligation(
    lendingVaultAuthority,
    config.KAMINO_MARKET,
    KLEND_PROGRAM_ID
  );

  const ata = getAssociatedTokenAddressSync(
    config.BANK_MINT,
    user.wallet.publicKey,
    true,
    config.TOKEN_PROGRAM
  );

  const [userState] = deriveUserState(
    FARMS_PROGRAM_ID,
    config.FARM_STATE,
    baseObligation
  );

  let initObligationTx = new Transaction().add(
    ComputeBudgetProgram.setComputeUnitLimit({ units: 1_400_000 }),
    await makeInitObligationIx(
      program,
      {
        feePayer: config.FEE_PAYER,
        bank: bankKey,
        signerTokenAccount: ata,
        lendingMarket: config.KAMINO_MARKET,
        reserveLiquidityMint: config.BANK_MINT,
        reserve: config.KAMINO_RESERVE,
        scopePrices: config.RESERVE_ORACLE,
        reserveFarmState: config.FARM_STATE,
        obligationFarmUserState: userState,
        liquidityTokenProgram: config.TOKEN_PROGRAM,
      },
      new BN(100)
    )
  );

  if (sendTx) {
    try {
      const sigObligation = await sendAndConfirmTransaction(
        connection,
        initObligationTx,
        [user.wallet.payer]
      );
      console.log("obligation key: " + baseObligation);
      console.log("Transaction signature:", sigObligation);
    } catch (error) {
      console.error("Transaction failed:", error);
    }
  } else {
    initObligationTx.feePayer = config.MULTISIG_PAYER; // Set the fee payer to Squads wallet
    const { blockhash } = await connection.getLatestBlockhash();
    initObligationTx.recentBlockhash = blockhash;
    const serializedTransaction = initObligationTx.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    });
    const base58Transaction = bs58.encode(serializedTransaction);
    console.log("bank key: " + bankKey);
    console.log("Base58-encoded transaction:", base58Transaction);
  }
}

main().catch((err) => {
  console.error(err);
});
