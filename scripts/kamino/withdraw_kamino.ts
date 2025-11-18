// Call this once after each bank is made.
import {
  AccountMeta,
  AddressLookupTableAccount,
  ComputeBudgetProgram,
  PublicKey,
  Transaction,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
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
import { commonSetup, registerKaminoProgram } from "../../lib/common-setup";
import {
  makeInitObligationIx,
  makeKaminoDepositIx,
  makeKaminoWithdrawIx,
  simpleRefreshObligation,
  simpleRefreshReserve,
} from "./ixes-common";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { deriveBaseObligation, deriveUserState } from "./pdas";
import { deriveLiquidityVaultAuthority } from "../common/pdas";
import { BankAndOracles } from "../../lib/utils";

/**
 * If true, send the tx. If false, output the unsigned b58 tx to console.
 */
const sendTx = true;

type Config = {
  PROGRAM_ID: string;
  BANK: PublicKey;
  ACCOUNT: PublicKey;
  AMOUNT: BN;
  WITHDRAW_ALL: boolean;

  BANK_MINT: PublicKey;
  KAMINO_RESERVE: PublicKey;
  KAMINO_MARKET: PublicKey;
  /** Oracle address the Kamino Reserve uses. Typically read from reserve.config.tokenInfo.scope */
  RESERVE_ORACLE: PublicKey;
  /** Reserve Farm state. Can be read from reserve.farmCollateral. Technically optional, but almost
   * every (perhaps every?) Kamino reserve in prod has one. */
  FARM_STATE: PublicKey;
  TOKEN_PROGRAM: PublicKey;
  LUT: PublicKey;
  MULTISIG_PAYER?: PublicKey; // May be omitted if not using squads
  NEW_REMAINING: BankAndOracles;
  ADD_COMPUTE_UNITS: boolean;
};

const config: Config = {
  PROGRAM_ID: "MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA",
  BANK: new PublicKey("8Xy8fFpN7GtMrQhPuExDFudFTRP6Zf1i9iRJszFpzBJ2"),
  ACCOUNT: new PublicKey("SvABoHi4D71ZsYp4KtUoATz8jz5oaRSvtseWvMDHXJG"),
  AMOUNT: new BN(40 * 10 ** 6), // 40 USDC
  WITHDRAW_ALL: true,

  BANK_MINT: new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"),
  KAMINO_RESERVE: new PublicKey("D6q6wuQSrifJKZYpR1M8R4YawnLDtDsMmWM1NbBmgJ59"),
  KAMINO_MARKET: new PublicKey("7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF"),
  RESERVE_ORACLE: new PublicKey("3NJYftD5sjVfxSnUdZ1wVML8f3aC6mp1CXCL6L7TnU8C"),
  FARM_STATE: new PublicKey("JAvnB9AKtgPsTEoKmn24Bq64UMoYcrtWtq42HHBdsPkh"),
  TOKEN_PROGRAM: TOKEN_PROGRAM_ID,

  LUT: new PublicKey("CQ8omkUwDtsszuJLo9grtXCeEyDU4QqBLRv9AjRDaUZ3"),

  NEW_REMAINING: [
    new PublicKey("HY7cq1dZ3VqQXeVRdmXPhUhKGjBGGgPtAtxk7SKVGG1T"),
    new PublicKey("Dpw1EAVrSB1ibxiDQyTAW6Zip3J4Btk2x4SgApQCeFbX"),
    new PublicKey("D6q6wuQSrifJKZYpR1M8R4YawnLDtDsMmWM1NbBmgJ59"),

    new PublicKey("Fr2Qj2S4jKpeByEChXrHZxBrCoUoneFnMjJJXHUyS6V6"),
    new PublicKey("Dpw1EAVrSB1ibxiDQyTAW6Zip3J4Btk2x4SgApQCeFbX"),

    new PublicKey("EZeZK1GDLz3x3X1jR9zW5P8quY8cxMJRiNwPmrLj9zd8"),
    new PublicKey("Dpw1EAVrSB1ibxiDQyTAW6Zip3J4Btk2x4SgApQCeFbX"),
    new PublicKey("D6q6wuQSrifJKZYpR1M8R4YawnLDtDsMmWM1NbBmgJ59"),

    new PublicKey("EVdZczE3GvbB7wkTNzkCizvDC7X3VEPyaQUFa6ACv3pw"),
    new PublicKey("Dpw1EAVrSB1ibxiDQyTAW6Zip3J4Btk2x4SgApQCeFbX"),
    new PublicKey("D6q6wuQSrifJKZYpR1M8R4YawnLDtDsMmWM1NbBmgJ59"),

    new PublicKey("E7SUxSs1YFRUhSQmzFYyn9K46rpUPrfCFJQyrXKU23tT"),
    new PublicKey("Dpw1EAVrSB1ibxiDQyTAW6Zip3J4Btk2x4SgApQCeFbX"),

    new PublicKey("E1dNntvZo6pXmkZq43wommAdxe6qF1wcXkjz2M2QEb14"),
    new PublicKey("Dpw1EAVrSB1ibxiDQyTAW6Zip3J4Btk2x4SgApQCeFbX"),
    new PublicKey("D6q6wuQSrifJKZYpR1M8R4YawnLDtDsMmWM1NbBmgJ59"),

    new PublicKey("AHTqUF4LyDxCnpHWL89RjsJWGEGXKSYyQPWx3fUAcj1H"),
    new PublicKey("Dpw1EAVrSB1ibxiDQyTAW6Zip3J4Btk2x4SgApQCeFbX"),
    new PublicKey("D6q6wuQSrifJKZYpR1M8R4YawnLDtDsMmWM1NbBmgJ59"),

    new PublicKey("8nUGEsT5VJijkpnn6fJXWTyyZjExhwipFuDyotqwyzhz"),
    new PublicKey("Dpw1EAVrSB1ibxiDQyTAW6Zip3J4Btk2x4SgApQCeFbX"),

    new PublicKey("89LuR6urx9wMxeJtf3LCdq84LsgM22Sp6fWqPbCuZtUr"), // BONK
    new PublicKey("DBE3N8uNjhKPRHfANdwGvCZghWXyLPdqdSbEW2XFwBiX"),

    new PublicKey("74KM1fwNm9WP39UH7QsCs4dvkN6RaZT52U9f4tnkJtom"),
    new PublicKey("Dpw1EAVrSB1ibxiDQyTAW6Zip3J4Btk2x4SgApQCeFbX"),

    new PublicKey("5LTAowCUEK5rr2ALKtk6cTHhyaPTCbksV5C3pCqLKSVu"),
    new PublicKey("Dpw1EAVrSB1ibxiDQyTAW6Zip3J4Btk2x4SgApQCeFbX"),
    new PublicKey("D6q6wuQSrifJKZYpR1M8R4YawnLDtDsMmWM1NbBmgJ59"),

    new PublicKey("5HxHAW3BCYPB2uRMrjKpgA6mSpwHPK1JrntWZU4QZpZ1"),
    new PublicKey("Dpw1EAVrSB1ibxiDQyTAW6Zip3J4Btk2x4SgApQCeFbX"),
    new PublicKey("D6q6wuQSrifJKZYpR1M8R4YawnLDtDsMmWM1NbBmgJ59"),

    new PublicKey("52AJuRJJcejMYS9nNDCk1vYmyG1uHSsXoSPkctS3EfhA"),
    new PublicKey("Dpw1EAVrSB1ibxiDQyTAW6Zip3J4Btk2x4SgApQCeFbX"),

    new PublicKey("4eFzqYFZr2UnWQqSfwZxB4r1W1kSJ9XG6M6H17Eq4x2Z"),
    new PublicKey("Dpw1EAVrSB1ibxiDQyTAW6Zip3J4Btk2x4SgApQCeFbX"),

    new PublicKey("jLfQHXX6hNnGBECzDraZFZTtFYNXaYzw817eAzGMXUP"),
    new PublicKey("Dpw1EAVrSB1ibxiDQyTAW6Zip3J4Btk2x4SgApQCeFbX"),
  ],
  ADD_COMPUTE_UNITS: true,
};

async function main() {
  const user = commonSetup(
    sendTx,
    config.PROGRAM_ID,
    "/.config/stage/id.json",
    config.MULTISIG_PAYER,
    "kamino"
  );
  registerKaminoProgram(user, KLEND_PROGRAM_ID.toString());
  const program = user.program;
  const connection = user.connection;

  let luts: AddressLookupTableAccount[] = [];
  const lutLookup = await connection.getAddressLookupTable(config.LUT);
  if (!lutLookup || !lutLookup.value) {
    console.warn(
      `Warning: LUT ${config.LUT.toBase58()} not found on-chain. Proceeding without it.`
    );
    luts = [];
  } else {
    luts = [lutLookup.value];
  }

  const oracleMeta: AccountMeta[] = config.NEW_REMAINING.flat().map(
    (pubkey) => {
      return { pubkey, isSigner: false, isWritable: false };
    }
  );

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
    config.TOKEN_PROGRAM
  );

  const [userState] = deriveUserState(
    FARMS_PROGRAM_ID,
    config.FARM_STATE,
    baseObligation
  );

  let instructions: TransactionInstruction[] = [];
  if (config.ADD_COMPUTE_UNITS) {
    instructions.push(
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 100_000 })
    );
    instructions.push(
      ComputeBudgetProgram.setComputeUnitLimit({ units: 1_400_000 })
    );
  }

  instructions.push(
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
    await makeKaminoWithdrawIx(
      program,
      {
        marginfiAccount: config.ACCOUNT,
        bank: config.BANK,
        destinationTokenAccount: ata,
        lendingMarket: config.KAMINO_MARKET,
        reserveLiquidityMint: config.BANK_MINT,
        reserveFarmState: config.FARM_STATE,
        obligationFarmUserState: userState,
      },
      config.AMOUNT,
      config.WITHDRAW_ALL,
      oracleMeta
    )
  );
  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash();

  if (sendTx) {
    try {
      console.log("withdraw from: " + config.BANK);
      console.log("by account: " + config.ACCOUNT);

      const v0Message = new TransactionMessage({
        payerKey: user.wallet.publicKey,
        recentBlockhash: blockhash,
        instructions,
      }).compileToV0Message(luts);
      const v0Tx = new VersionedTransaction(v0Message);

      v0Tx.sign([user.wallet.payer]);
      const signature = await connection.sendTransaction(v0Tx, {
        maxRetries: 2,
      });
      await connection.confirmTransaction(
        { signature, blockhash, lastValidBlockHeight },
        "confirmed"
      );

      console.log("tx signature:", signature);
    } catch (error) {
      console.error("Transaction failed:", error);
    }
  } else {
    const v0Message = new TransactionMessage({
      payerKey: config.MULTISIG_PAYER,
      recentBlockhash: blockhash,
      instructions,
    }).compileToV0Message(luts);
    const v0Tx = new VersionedTransaction(v0Message);

    const serializedTransaction = v0Tx.serialize();
    const base58Transaction = bs58.encode(serializedTransaction);
    console.log("withdraw from: " + config.BANK);
    console.log("by account: " + config.ACCOUNT);
    console.log("Base58-encoded transaction:", base58Transaction);
  }
}

main().catch((err) => {
  console.error(err);
});
