// Run deposit_single_pool first to convert to LST. In production, these will likely be atomic.
import {
  AccountMeta,
  ComputeBudgetProgram,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import {
  createAssociatedTokenAccountIdempotentInstruction,
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from "@mrgnlabs/mrgn-common";
import { commonSetup, registerKaminoProgram } from "../lib/common-setup";
import {
  BankAndOracles,
  composeRemainingAccounts,
  getOraclesAndCrankSwb,
} from "../lib/utils";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { KLEND_PROGRAM_ID } from "./kamino/kamino-types";
import {
  simpleRefreshObligation,
  simpleRefreshReserve,
} from "./kamino/ixes-common";
import { deriveLiquidityVaultAuthority } from "./common/pdas";
import { deriveBaseObligation } from "./kamino/pdas";

const sendTx = true;

type Config = {
  PROGRAM_ID: string;
  GROUP: PublicKey;
  ACCOUNT: PublicKey;
  BANK: PublicKey;
  MINT: PublicKey;
  /** In native decimals */
  AMOUNT: BN;
  /**
   * If this borrow is opening a NEW POSITION, add the bank and oracle here, in that order
   * */
  NEW_REMAINING: BankAndOracles;
  ADD_COMPUTE_UNITS: boolean;

  // Optional, omit if not using MS.
  MULTISIG?: PublicKey;
  KAMINO_RESERVE: PublicKey;
  KAMINO_MARKET: PublicKey;
  RESERVE_ORACLE: PublicKey;
  OBLIGATION: PublicKey;
};

const config: Config = {
  PROGRAM_ID: "MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA",
  GROUP: new PublicKey("8D7qgu5153s3dHCbnHviijJyJ3CcJAj1QRX46yW2eSu1"),
  ACCOUNT: new PublicKey("AP5izhPtwhdSayABT8MYMsKy492XzWit8hVFZQG5jk6n"),
  BANK: new PublicKey("89LuR6urx9wMxeJtf3LCdq84LsgM22Sp6fWqPbCuZtUr"),
  MINT: new PublicKey("DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263"),
  AMOUNT: new BN(50000 * 10 ** 5), // 50k BONK
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

    new PublicKey("8Xy8fFpN7GtMrQhPuExDFudFTRP6Zf1i9iRJszFpzBJ2"),
    new PublicKey("Dpw1EAVrSB1ibxiDQyTAW6Zip3J4Btk2x4SgApQCeFbX"),
    new PublicKey("D6q6wuQSrifJKZYpR1M8R4YawnLDtDsMmWM1NbBmgJ59"),

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
  KAMINO_RESERVE: new PublicKey("D6q6wuQSrifJKZYpR1M8R4YawnLDtDsMmWM1NbBmgJ59"),
  KAMINO_MARKET: new PublicKey("7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF"),
  RESERVE_ORACLE: new PublicKey("3NJYftD5sjVfxSnUdZ1wVML8f3aC6mp1CXCL6L7TnU8C"),
  OBLIGATION: new PublicKey("5HxomAyh1wDSqHp9Gg5n3aF4vLAKQL3WK3baYMZwK6Yd"),
};

async function main() {
  const user = commonSetup(
    sendTx,
    config.PROGRAM_ID,
    "/.config/arena/id.json",
    config.MULTISIG,
    "kamino"
  );
  registerKaminoProgram(user, KLEND_PROGRAM_ID.toString());
  const program = user.program;
  const connection = user.connection;

  const oracleMeta: AccountMeta[] = config.NEW_REMAINING.flat().map(
    (pubkey) => {
      return { pubkey, isSigner: false, isWritable: false };
    }
  );

  const ata = getAssociatedTokenAddressSync(config.MINT, user.wallet.publicKey);
  const transaction = new Transaction();

  if (config.ADD_COMPUTE_UNITS) {
    transaction.add(
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 100_000 })
    );
    transaction.add(
      ComputeBudgetProgram.setComputeUnitLimit({ units: 1_400_000 })
    );
  }

  transaction.add(
    // createAssociatedTokenAccountIdempotentInstruction(
    //   user.wallet.publicKey,
    //   ata,
    //   user.wallet.publicKey,
    //   config.MINT
    // ),
    await simpleRefreshReserve(
      user.kaminoProgram,
      config.KAMINO_RESERVE,
      config.KAMINO_MARKET,
      config.RESERVE_ORACLE
    ),
    // await simpleRefreshObligation(
    //   user.kaminoProgram,
    //   config.KAMINO_MARKET,
    //   config.OBLIGATION,
    //   [config.KAMINO_RESERVE]
    // ),
    await program.methods
      .lendingAccountBorrow(config.AMOUNT)
      .accounts({
        // marginfiGroup: config.GROUP,
        marginfiAccount: config.ACCOUNT,
        // signer: wallet.publicKey,
        bank: config.BANK,
        destinationTokenAccount: ata,
        // bankLiquidityVaultAuthority = deriveLiquidityVaultAuthority(id, bank);
        // bankLiquidityVault = deriveLiquidityVault(id, bank)
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .remainingAccounts(oracleMeta)
      .instruction()
  );

  console.log(
    "borrowing : " + config.AMOUNT.toString() + " from " + config.BANK
  );

  if (sendTx) {
    try {
      const signature = await sendAndConfirmTransaction(
        connection,
        transaction,
        [user.wallet.payer]
      );
      console.log("Transaction signature:", signature);
    } catch (error) {
      console.error("Transaction failed:", error);
    }
  } else {
    transaction.feePayer = config.MULTISIG; // Set the fee payer to Squads wallet
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    const serializedTransaction = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    });
    const base58Transaction = bs58.encode(serializedTransaction);
    console.log("Base58-encoded transaction:", base58Transaction);
  }
}

main().catch((err) => {
  console.error(err);
});
