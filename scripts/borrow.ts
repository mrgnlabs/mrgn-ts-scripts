// Run deposit_single_pool first to convert to LST. In production, these will likely be atomic.
import {
  AccountMeta,
  ComputeBudgetProgram,
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { Program, AnchorProvider, BN } from "@coral-xyz/anchor";
import { Marginfi } from "../../marginfi-client-v2/src/idl/marginfi-types_0.1.2";
import marginfiIdl from "../../marginfi-client-v2/src/idl/marginfi_0.1.2.json";
import { DEFAULT_API_URL, loadEnvFile, loadKeypairFromFile, SINGLE_POOL_PROGRAM_ID } from "./utils";
import {
  createAssociatedTokenAccountIdempotentInstruction,
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from "@mrgnlabs/mrgn-common";
import { commonSetup } from "../lib/common-setup";
import { composeRemainingAccounts } from "../lib/utils";

type Config = {
  PROGRAM_ID: string;
  GROUP: PublicKey;
  ACCOUNT: PublicKey;
  BANK: PublicKey;
  MINT: PublicKey;
  /** In native decimals */
  AMOUNT: BN;
  /** For each balance the user has, in order, pass
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
};

const config: Config = {
  PROGRAM_ID: "stag8sTKds2h4KzjUw3zKTsxbqvT4XKHdaR9X9E6Rct",
  GROUP: new PublicKey("FCPfpHA69EbS8f9KKSreTRkXbzFpunsKuYf5qNmnJjpo"),
  ACCOUNT: new PublicKey("A2cNgW5o66rquaiWjnAKkbdimU3x82exrqCvKzzrP1Wy"),
  BANK: new PublicKey("FNEoFRVnmBF5KpRtghHJrJPbdbMjry1E33dNzzHY9UGC"),
  MINT: new PublicKey("7kbnvuGBxxj8AG9qp8Scn56muWGaRaFqxg1FsRp3PaFT"),
  AMOUNT: new BN(0.005 * 10 ** 6), // UXD has 6 decimals
  REMAINING: [
    // UXD
    [
      new PublicKey("FNEoFRVnmBF5KpRtghHJrJPbdbMjry1E33dNzzHY9UGC"),
      new PublicKey("CoEDGeYda7Mi6c1BAsHE2LL6zEVcitX43wPABSLgQfpB"),
    ],
    // PyUSD
    [
      new PublicKey("Fe5QkKPVAh629UPP5aJ8sDZu8HTfe6M26jDQkKyXVhoA"),
      new PublicKey("9zXQxpYH3kYhtoybmZfUNNCRVuud7fY9jswTg1hLyT8k"),
    ],
    // USDC
    [
      new PublicKey("Ek5JSFJFD8QgXM6rPDCzf31XhDp1q3xezaWYSkJWqbqc"),
      new PublicKey("Dpw1EAVrSB1ibxiDQyTAW6Zip3J4Btk2x4SgApQCeFbX"),
    ],
    // DUST
    [
      new PublicKey("GNw2sfgnFX4vermA94de6tgTyftpQHMvWLqFEceVZ1ad"),
      new PublicKey("EmCZsrNqQEqsfafK4j4uRFjGvpUeMS5B2uDR9uc3wBMY"),
    ],
    // WIF
    [
      new PublicKey("DDLVJyj5sT3knnVDoTifrtQmroLnRCkBmGZ1QXCUDUUd"),
      new PublicKey("HHNwxYniGWKaSgfMPu2QRoX8XrBHXUiUMMhYK62bLBB9"),
    ],
  ],
  ADD_COMPUTE_UNITS: false,
};

const examples = {
  borrowJupSOLAgainstUSDC: {
    PROGRAM_ID: "stag8sTKds2h4KzjUw3zKTsxbqvT4XKHdaR9X9E6Rct",
    GROUP: new PublicKey("FCPfpHA69EbS8f9KKSreTRkXbzFpunsKuYf5qNmnJjpo"),
    ACCOUNT: new PublicKey("2GMbwepeyW5xzgm3cQLivdPWLydrFevLy2iBbZab3pd6"),
    BANK: new PublicKey("EJuhmswifV6wumS28Sfr5W8B18CJ29m1ZNKkhbhbYDCA"),
    MINT: new PublicKey("jupSoLaHXQiZZTSfEWMTRRgpnyFm8f6sZdosWBjx93v"),
    AMOUNT: new BN(0.0005 * 10 ** 9), // jupsol has 9 decimals
    REMAINING: [
      [
        new PublicKey("Ek5JSFJFD8QgXM6rPDCzf31XhDp1q3xezaWYSkJWqbqc"), // usdc bank
        new PublicKey("Dpw1EAVrSB1ibxiDQyTAW6Zip3J4Btk2x4SgApQCeFbX"),
      ], // usdc oracle
      [
        new PublicKey("EJuhmswifV6wumS28Sfr5W8B18CJ29m1ZNKkhbhbYDCA"), // jupsol bank
        new PublicKey("HX5WM3qzogAfRCjBUWwnniLByMfFrjm1b5yo4KoWGR27"),
      ], // jupsol oracle
    ],
    ADD_COMPUTE_UNITS: false,
  },
  borrowSOLAgainstUSDC: {
    PROGRAM_ID: "stag8sTKds2h4KzjUw3zKTsxbqvT4XKHdaR9X9E6Rct",
    GROUP: new PublicKey("FCPfpHA69EbS8f9KKSreTRkXbzFpunsKuYf5qNmnJjpo"),
    ACCOUNT: new PublicKey("2GMbwepeyW5xzgm3cQLivdPWLydrFevLy2iBbZab3pd6"),
    BANK: new PublicKey("3evdJSa25nsUiZzEUzd92UNa13TPRJrje1dRyiQP5Lhp"),
    MINT: new PublicKey("So11111111111111111111111111111111111111112"),
    AMOUNT: new BN(0.0005 * 10 ** 9), // sol has 9 decimals
    REMAINING: [
      [
        new PublicKey("Ek5JSFJFD8QgXM6rPDCzf31XhDp1q3xezaWYSkJWqbqc"), // usdc bank
        new PublicKey("Dpw1EAVrSB1ibxiDQyTAW6Zip3J4Btk2x4SgApQCeFbX"),
      ], // usdc oracle
      // [new PublicKey("EJuhmswifV6wumS28Sfr5W8B18CJ29m1ZNKkhbhbYDCA"), // jupsol bank
      // new PublicKey("HX5WM3qzogAfRCjBUWwnniLByMfFrjm1b5yo4KoWGR27")], // jupsol oracle
      [
        new PublicKey("3evdJSa25nsUiZzEUzd92UNa13TPRJrje1dRyiQP5Lhp"), // sol bank
        new PublicKey("7UVimffxr9ow1uXYxsr4LHAcV58mLzhmwaeKvJ1pjLiE"),
      ], // sol oracle
    ],
    ADD_COMPUTE_UNITS: false,
  },
  borrowSOLAgainstStakedSOL: {
    PROGRAM_ID: "stag8sTKds2h4KzjUw3zKTsxbqvT4XKHdaR9X9E6Rct",
    GROUP: new PublicKey("FCPfpHA69EbS8f9KKSreTRkXbzFpunsKuYf5qNmnJjpo"),
    ACCOUNT: new PublicKey("7SBEjeEjhzRvWsrTq7UiNWBLjcYwE1hdbmMK5wUaeVhU"),
    BANK: new PublicKey("3evdJSa25nsUiZzEUzd92UNa13TPRJrje1dRyiQP5Lhp"),
    STAKE_POOL: new PublicKey("AvS4oXtxWdrJGCJwDbcZ7DqpSqNQtKjyXnbkDbrSk6Fq"),
    MINT: new PublicKey("So11111111111111111111111111111111111111112"),
    AMOUNT: new BN(0.00002 * 10 ** 6), // usdc has 6 decimals
    REMAINING: [
      [
        new PublicKey("3jt43usVm7qL1N5qPvbzYHWQRxamPCRhri4CxwDrf6aL"), // staked sol bank
        new PublicKey("7UVimffxr9ow1uXYxsr4LHAcV58mLzhmwaeKvJ1pjLiE"), // staked sol oracle
        new PublicKey("BADo3D6nMtGnsAaTv3iEes8mMcq92TuFoBWebFe8kzeA"), // lst mint
        new PublicKey("3e8RuaQMCPASZSMJAskHX6ZfuTtQ3JvoNPFoEvaVRn78"),
      ], // lst pool
      [
        new PublicKey("3evdJSa25nsUiZzEUzd92UNa13TPRJrje1dRyiQP5Lhp"), // usdc bank
        new PublicKey("7UVimffxr9ow1uXYxsr4LHAcV58mLzhmwaeKvJ1pjLiE"),
      ], // usdc oracle
    ],
    ADD_COMPUTE_UNITS: false,
  },
};

async function main() {
  const user = commonSetup(true, config.PROGRAM_ID, "/keys/phantom-wallet.json");
  const program = user.program;
  const connection = user.connection;

  const remaining = composeRemainingAccounts(config.REMAINING);
  const meta: AccountMeta[] = remaining.map((pubkey) => ({
    pubkey,
    isSigner: false,
    isWritable: false,
  }));

  const ata = getAssociatedTokenAddressSync(config.MINT, user.wallet.publicKey);
  const transaction = new Transaction();

  if (config.ADD_COMPUTE_UNITS) {
    transaction.add(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 100_000 }));
    transaction.add(ComputeBudgetProgram.setComputeUnitLimit({ units: 1_400_000 }));
  }

  transaction.add(
    createAssociatedTokenAccountIdempotentInstruction(user.wallet.publicKey, ata, user.wallet.publicKey, config.MINT),
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
      .remainingAccounts(meta)
      .instruction()
  );

  try {
    const signature = await sendAndConfirmTransaction(connection, transaction, [user.wallet.payer]);
    console.log("Transaction signature:", signature);
  } catch (error) {
    console.error("Transaction failed:", error);
  }

  console.log("borrow: " + config.AMOUNT.toString() + " from " + config.BANK);
}

main().catch((err) => {
  console.error(err);
});
