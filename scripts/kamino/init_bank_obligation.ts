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
  FEE_PAYER?: PublicKey; // If omitted, defaults to ADMIN
  BANK_MINT: PublicKey;
  KAMINO_RESERVE: PublicKey;
  KAMINO_MARKET: PublicKey;
  /** Oracle address the Kamino Reserve uses. Typically read from reserve.config.tokenInfo.scope */
  RESERVE_ORACLE: PublicKey;
  /** Reserve Farm state. Can be read from reserve.farmCollateral. Technically optional, but almost
   * every (perhaps every?) Kamino reserve in prod has one. */
  FARM_STATE: PublicKey;
  SEED: number;
  TOKEN_PROGRAM?: PublicKey; // If omitted, defaults to TOKEN_PROGRAM_ID
  MULTISIG_PAYER?: PublicKey; // May be omitted if not using squads
};

const config: Config = {
  PROGRAM_ID: "stag8sTKds2h4KzjUw3zKTsxbqvT4XKHdaR9X9E6Rct",
  GROUP_KEY: new PublicKey("DnzhBmNmXgwoUSsKxs5LkMmArf95DmgeZQA1G4xuDSQB"),

  ADMIN: new PublicKey("6DdJqQYD8AizuXiCkbn19LiyWRwUsRMzy2Sgyoyasyj7"),
  BANK_MINT: new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"),
  KAMINO_RESERVE: new PublicKey("D6q6wuQSrifJKZYpR1M8R4YawnLDtDsMmWM1NbBmgJ59"),
  KAMINO_MARKET: new PublicKey("7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF"),
  
  RESERVE_ORACLE: new PublicKey("3t4JZcueEzTbVP6kLxXrL3VpWx45jDer4eqysweBchNH"), 
  FARM_STATE: new PublicKey("JAvnB9AKtgPsTEoKmn24Bq64UMoYcrtWtq42HHBdsPkh"),
  SEED: 7,
};


async function main() {
  await initKaminoObligation(sendTx, config, "/.config/stage/id.json");
}

export async function initKaminoObligation(sendTx: boolean, config: Config, walletPath: string, version?: "current"): Promise<PublicKey> {
  const user = commonSetup(
    sendTx,
    config.PROGRAM_ID,
    walletPath,
    config.MULTISIG_PAYER,
    version
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
        feePayer: config.FEE_PAYER ?? config.ADMIN,
        bank: bankKey,
        signerTokenAccount: ata,
        lendingMarket: config.KAMINO_MARKET,
        reserveLiquidityMint: config.BANK_MINT,
        reserve: config.KAMINO_RESERVE,
        scopePrices: config.RESERVE_ORACLE,
        // TODO support edge cases where no farm state is active
        reserveFarmState: config.FARM_STATE,
        obligationFarmUserState: userState,
        liquidityTokenProgram: config.TOKEN_PROGRAM ?? TOKEN_PROGRAM_ID,
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
