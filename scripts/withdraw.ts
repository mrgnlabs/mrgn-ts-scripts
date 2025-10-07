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
} from "@mrgnlabs/mrgn-common";
import { commonSetup } from "../lib/common-setup";
import {
  BankAndOracles,
  composeRemainingAccounts,
  getOraclesAndCrankSwb,
} from "../lib/utils";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";

const sendTx = false;

type Config = {
  PROGRAM_ID: string;
  GROUP: PublicKey;
  ACCOUNT: PublicKey;
  BANK: PublicKey;
  MINT: PublicKey;
  /** In native decimals */
  AMOUNT: BN;
  WITHDRAW_ALL: boolean;
  /**
   * ONLY NEEDED IF USING THE MULTISIG, OTHERWISE FETCHED FROM THE ACCOUNT. Set sendTx = true and
   * this script will print these for you to copy and paste!
   * 
   * MAKE SURE YOU REMOVE THE ONE YOU ARE WITHDRAWING IF WITHDRAWING ALL
   *
   * For each balance the user has, in order, pass
   * * bank0, oracle0, bank1, oracle1, etc
   *
   * in any order
   *
   * if a bank is a STAKED COLLATERAL bank, also pass the LST mint and SOL pool, like:
   * * bank0, oracle0, lstMint0, solPool0, bank1, oracle1
   *
   * You can derive these with:
    ```
    const [lstMint] = PublicKey.findProgramAddressSync(
        [Buffer.from("mint"), config.STAKE_POOL.toBuffer()],
        SINGLE_POOL_PROGRAM_ID
    );
    ```
     and
    ```
    const [pool] = PublicKey.findProgramAddressSync(
        [Buffer.from("stake"), config.STAKE_POOL.toBuffer()],
        SINGLE_POOL_PROGRAM_ID
    );
    ```
   * or read them from the bank directly (oracles[1] and oracles[2])
   * */
  REMAINING: PublicKey[][];
  ADD_COMPUTE_UNITS: boolean;

  // Optional, omit if not using MS.
  MULTISIG: PublicKey;
};

const config: Config = {
  PROGRAM_ID: "MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA",
  GROUP: new PublicKey("4qp6Fx6tnZkY5Wropq9wUYgtFxXKwE6viZxFHg3rdAG8"),
  ACCOUNT: new PublicKey("GZxaVQQMp7Vv6rF4jYn3FBJwyNujVYibm6TM4ouRp5gR"),
  BANK: new PublicKey("2s37akK2eyBbp8DZgCm7RtsaEz8eJP3Nxd4urLHQv7yB"),
  MINT: new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"),
  AMOUNT: new BN(664_000 * 10 ** 6),
  WITHDRAW_ALL: false,
  REMAINING: [
    [
      new PublicKey("HmpMfL8942u22htC4EMiWgLX931g3sacXFR6KjuLgKLV"),
      new PublicKey("HT2PLQBcG5EiCcNSaMHAjSgd9F98ecpATbk4Sk5oYuM"),
    ],
    [
      new PublicKey("FDsf8sj6SoV313qrA91yms3u5b3P4hBxEPvanVs8LtJV"),
      new PublicKey("DyYBBWEi9xZvgNAeMDCiFnmC1U9gqgVsJDXkL5WETpoX"),
    ],
    [
      new PublicKey("2s37akK2eyBbp8DZgCm7RtsaEz8eJP3Nxd4urLHQv7yB"),
      new PublicKey("Dpw1EAVrSB1ibxiDQyTAW6Zip3J4Btk2x4SgApQCeFbX"),
    ],
  ],
  ADD_COMPUTE_UNITS: false,
  MULTISIG: new PublicKey("CYXEgwbPHu2f9cY3mcUkinzDoDcsSan7myh1uBvYRbEw"),
};

/** Helper: pretty-print PublicKey[][] exactly like Config.REMAINING expects */
function printRemainingForPaste(groups: BankAndOracles[]) {
  const body = groups
    .map(
      (g) =>
        `  [\n` +
        g.map((pk) => `    new PublicKey("${pk.toBase58()}"),`).join("\n") +
        `\n  ],`
    )
    .join("\n");

  const out = `[\n${body}\n]`;
  console.log("\n=== Copy/Paste for config.REMAINING ===\n" + out + "\n");
}

async function main() {
  const user = commonSetup(
    sendTx,
    config.PROGRAM_ID,
    "/keys/phantom-wallet.json",
    config.MULTISIG,
    "current"
  );
  const program = user.program;
  const connection = user.connection;

  let mintAccInfo = await connection.getAccountInfo(config.MINT);
  const tokenProgram = mintAccInfo.owner;
  let isT22 = tokenProgram.toString() == TOKEN_2022_PROGRAM_ID.toString();

  let meta: AccountMeta[] = [];
  if (sendTx) {
    let activeBalances = await getOraclesAndCrankSwb(
      program,
      config.ACCOUNT,
      connection,
      user.wallet.payer
    );
    meta = activeBalances.flat().map((pubkey) => {
      return { pubkey, isSigner: false, isWritable: false };
    });
    // TODO remove the one we are withdrawing from if withdrawing all
    printRemainingForPaste(activeBalances);
  } else {
    const remaining = composeRemainingAccounts(config.REMAINING);
    meta = remaining.map((pubkey) => ({
      pubkey,
      isSigner: false,
      isWritable: false,
    }));
  }

  if (isT22) {
    const m: AccountMeta = {
      pubkey: config.MINT,
      isSigner: false,
      isWritable: false,
    };
    // must be pushed first in the array
    meta.unshift(m);
  }

  const ata = getAssociatedTokenAddressSync(
    config.MINT,
    user.wallet.publicKey,
    true,
    tokenProgram
  );
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
    createAssociatedTokenAccountIdempotentInstruction(
      user.wallet.publicKey,
      ata,
      user.wallet.publicKey,
      config.MINT,
      tokenProgram
    ),
    await program.methods
      .lendingAccountWithdraw(config.AMOUNT, config.WITHDRAW_ALL)
      .accounts({
        // marginfiGroup: config.GROUP,
        marginfiAccount: config.ACCOUNT,
        // signer: wallet.publicKey,
        bank: config.BANK,
        destinationTokenAccount: ata,
        // bankLiquidityVaultAuthority = deriveLiquidityVaultAuthority(id, bank);
        // bankLiquidityVault = deriveLiquidityVault(id, bank)
        tokenProgram: tokenProgram,
      })
      .remainingAccounts(meta)
      .instruction()
  );

  console.log(
    "withdrawing : " + config.AMOUNT.toString() + " from " + config.BANK
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
