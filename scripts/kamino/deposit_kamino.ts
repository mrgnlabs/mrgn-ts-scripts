// Call this once after each bank is made.
import {
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { TOKEN_PROGRAM_ID } from "@mrgnlabs/mrgn-common";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import {
  FARMS_PROGRAM_ID,
  KLEND_PROGRAM_ID,
} from "./kamino-types";
import { commonSetup, registerKaminoProgram } from "../../lib/common-setup";
import {
  makeKaminoDepositIx,
  simpleRefreshObligation,
  simpleRefreshReserve,
} from "./ixes-common";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { deriveBaseObligation, deriveUserState } from "./pdas";
import { deriveLiquidityVaultAuthority } from "../common/pdas";

/**
 * If true, send the tx. If false, output the unsigned b58 tx to console.
 */
const sendTx = true;

type Config = {
  PROGRAM_ID: string;
  BANK: PublicKey;
  ACCOUNT: PublicKey;
  AMOUNT: BN;

  BANK_MINT: PublicKey;
  KAMINO_RESERVE: PublicKey;
  KAMINO_MARKET: PublicKey;
  /** Oracle address the Kamino Reserve uses. Typically read from reserve.config.tokenInfo.scope */
  RESERVE_ORACLE: PublicKey;
  /** Reserve Farm state. Can be read from reserve.farmCollateral. Technically optional, but almost
   * every (perhaps every?) Kamino reserve in prod has one. */
  FARM_STATE: PublicKey;
  TOKEN_PROGRAM?: PublicKey; // If omitted, defaults to TOKEN_PROGRAM_ID
  MULTISIG_PAYER?: PublicKey; // May be omitted if not using squads
};

const config: Config = {
  PROGRAM_ID: "stag8sTKds2h4KzjUw3zKTsxbqvT4XKHdaR9X9E6Rct",
  BANK: new PublicKey("8qPLKaKb4F5BC6mVncKAryMp78yp5ZRGYnPkQbt9ikKt"),
  ACCOUNT: new PublicKey("89ViS63BocuvZx5NE5oS9tBJ4ZbKZe3GkvurxHuSqFhz"),
  AMOUNT: new BN(1 * 10 ** 5), // 0.1 USDC

  BANK_MINT: new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"),
  KAMINO_RESERVE: new PublicKey("D6q6wuQSrifJKZYpR1M8R4YawnLDtDsMmWM1NbBmgJ59"),
  KAMINO_MARKET: new PublicKey("7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF"),
  RESERVE_ORACLE: new PublicKey("3t4JZcueEzTbVP6kLxXrL3VpWx45jDer4eqysweBchNH"),
  FARM_STATE: new PublicKey("JAvnB9AKtgPsTEoKmn24Bq64UMoYcrtWtq42HHBdsPkh"),
};

async function main() {
  await depositKamino(sendTx, config, "/.config/stage/id.json");
}

export async function depositKamino(sendTx: boolean, config: Config, walletPath: string, version?: "current") {
  const user = commonSetup(
    sendTx,
    config.PROGRAM_ID,
    walletPath,
    config.MULTISIG_PAYER,
    version
  );
  registerKaminoProgram(user, KLEND_PROGRAM_ID.toString());
  const program = user.program;
  const connection = user.connection;

  const [lendingVaultAuthority] = deriveLiquidityVaultAuthority(
    program.programId,
    config.BANK
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
    config.TOKEN_PROGRAM ?? TOKEN_PROGRAM_ID
  );

  const [userState] = deriveUserState(
    FARMS_PROGRAM_ID,
    config.FARM_STATE,
    baseObligation
  );

  let depositTx = new Transaction().add(
    await simpleRefreshReserve(
      user.kaminoProgram,
      config.KAMINO_RESERVE,
      config.KAMINO_MARKET,
      config.RESERVE_ORACLE
    ),
    await simpleRefreshObligation(
      user.kaminoProgram,
      config.KAMINO_MARKET,
      baseObligation,
      [config.KAMINO_RESERVE]
    ),
    await makeKaminoDepositIx(
      program,
      {
        marginfiAccount: config.ACCOUNT,
        bank: config.BANK,
        signerTokenAccount: ata,
        lendingMarket: config.KAMINO_MARKET,
        reserveLiquidityMint: config.BANK_MINT,
        reserveFarmState: config.FARM_STATE,
        obligationFarmUserState: userState,
      },
      config.AMOUNT
    )
  );

  if (sendTx) {
    try {
      const sigObligation = await sendAndConfirmTransaction(
        connection,
        depositTx,
        [user.wallet.payer]
      );
      console.log("deposit to: " + config.BANK);
      console.log("by account: " + config.ACCOUNT);
      console.log("Transaction signature:", sigObligation);
    } catch (error) {
      console.error("Transaction failed:", error);
    }
  } else {
    depositTx.feePayer = config.MULTISIG_PAYER; // Set the fee payer to Squads wallet
    const { blockhash } = await connection.getLatestBlockhash();
    depositTx.recentBlockhash = blockhash;
    const serializedTransaction = depositTx.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    });
    const base58Transaction = bs58.encode(serializedTransaction);
    console.log("deposit to: " + config.BANK);
    console.log("by account: " + config.ACCOUNT);
    console.log("Base58-encoded transaction:", base58Transaction);
  }
}

main().catch((err) => {
  console.error(err);
});
