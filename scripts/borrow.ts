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
import { commonSetup } from "../lib/common-setup";
import {
  BankAndOracles,
  composeRemainingAccounts,
  getOraclesAndCrankSwb,
} from "../lib/utils";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";

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
};

const config: Config = {
  PROGRAM_ID: "MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA",
  GROUP: new PublicKey("4qp6Fx6tnZkY5Wropq9wUYgtFxXKwE6viZxFHg3rdAG8"),
  ACCOUNT: new PublicKey("7qEL6Gb8jNWRGRLKU3G6fvWZkWMs5hVkpKKNeWdaJAE4"),
  BANK: new PublicKey("DMoqjmsuoru986HgfjqrKEvPv8YBufvBGADHUonkadC5"),
  MINT: new PublicKey("LSTxxxnJzKDFSLr4dUkPcmCf5VyryEqzPLz5j4bpxFp"),
  AMOUNT: new BN(.00001 * 10 ** 9),
  NEW_REMAINING: [
    // new PublicKey("2s37akK2eyBbp8DZgCm7RtsaEz8eJP3Nxd4urLHQv7yB"),
    // new PublicKey("Dpw1EAVrSB1ibxiDQyTAW6Zip3J4Btk2x4SgApQCeFbX"),
  ],
  ADD_COMPUTE_UNITS: false,
  MULTISIG: PublicKey.default,
};

// const examples = {
//   borrowJupSOLAgainstUSDC: {
//     PROGRAM_ID: "stag8sTKds2h4KzjUw3zKTsxbqvT4XKHdaR9X9E6Rct",
//     GROUP: new PublicKey("FCPfpHA69EbS8f9KKSreTRkXbzFpunsKuYf5qNmnJjpo"),
//     ACCOUNT: new PublicKey("2GMbwepeyW5xzgm3cQLivdPWLydrFevLy2iBbZab3pd6"),
//     BANK: new PublicKey("EJuhmswifV6wumS28Sfr5W8B18CJ29m1ZNKkhbhbYDCA"),
//     MINT: new PublicKey("jupSoLaHXQiZZTSfEWMTRRgpnyFm8f6sZdosWBjx93v"),
//     AMOUNT: new BN(0.0005 * 10 ** 9), // jupsol has 9 decimals
//     REMAINING: [
//       [
//         new PublicKey("Ek5JSFJFD8QgXM6rPDCzf31XhDp1q3xezaWYSkJWqbqc"), // usdc bank
//         new PublicKey("Dpw1EAVrSB1ibxiDQyTAW6Zip3J4Btk2x4SgApQCeFbX"),
//       ], // usdc oracle
//       [
//         new PublicKey("EJuhmswifV6wumS28Sfr5W8B18CJ29m1ZNKkhbhbYDCA"), // jupsol bank
//         new PublicKey("HX5WM3qzogAfRCjBUWwnniLByMfFrjm1b5yo4KoWGR27"),
//       ], // jupsol oracle
//     ],
//     ADD_COMPUTE_UNITS: false,
//   },
//   borrowSOLAgainstUSDC: {
//     PROGRAM_ID: "stag8sTKds2h4KzjUw3zKTsxbqvT4XKHdaR9X9E6Rct",
//     GROUP: new PublicKey("FCPfpHA69EbS8f9KKSreTRkXbzFpunsKuYf5qNmnJjpo"),
//     ACCOUNT: new PublicKey("2GMbwepeyW5xzgm3cQLivdPWLydrFevLy2iBbZab3pd6"),
//     BANK: new PublicKey("3evdJSa25nsUiZzEUzd92UNa13TPRJrje1dRyiQP5Lhp"),
//     MINT: new PublicKey("So11111111111111111111111111111111111111112"),
//     AMOUNT: new BN(0.0005 * 10 ** 9), // sol has 9 decimals
//     REMAINING: [
//       [
//         new PublicKey("Ek5JSFJFD8QgXM6rPDCzf31XhDp1q3xezaWYSkJWqbqc"), // usdc bank
//         new PublicKey("Dpw1EAVrSB1ibxiDQyTAW6Zip3J4Btk2x4SgApQCeFbX"),
//       ], // usdc oracle
//       // [new PublicKey("EJuhmswifV6wumS28Sfr5W8B18CJ29m1ZNKkhbhbYDCA"), // jupsol bank
//       // new PublicKey("HX5WM3qzogAfRCjBUWwnniLByMfFrjm1b5yo4KoWGR27")], // jupsol oracle
//       [
//         new PublicKey("3evdJSa25nsUiZzEUzd92UNa13TPRJrje1dRyiQP5Lhp"), // sol bank
//         new PublicKey("7UVimffxr9ow1uXYxsr4LHAcV58mLzhmwaeKvJ1pjLiE"),
//       ], // sol oracle
//     ],
//     ADD_COMPUTE_UNITS: false,
//   },
//   borrowSOLAgainstStakedSOL: {
//     PROGRAM_ID: "stag8sTKds2h4KzjUw3zKTsxbqvT4XKHdaR9X9E6Rct",
//     GROUP: new PublicKey("FCPfpHA69EbS8f9KKSreTRkXbzFpunsKuYf5qNmnJjpo"),
//     ACCOUNT: new PublicKey("7SBEjeEjhzRvWsrTq7UiNWBLjcYwE1hdbmMK5wUaeVhU"),
//     BANK: new PublicKey("3evdJSa25nsUiZzEUzd92UNa13TPRJrje1dRyiQP5Lhp"),
//     STAKE_POOL: new PublicKey("AvS4oXtxWdrJGCJwDbcZ7DqpSqNQtKjyXnbkDbrSk6Fq"),
//     MINT: new PublicKey("So11111111111111111111111111111111111111112"),
//     AMOUNT: new BN(0.00002 * 10 ** 6), // usdc has 6 decimals
//     REMAINING: [
//       [
//         new PublicKey("3jt43usVm7qL1N5qPvbzYHWQRxamPCRhri4CxwDrf6aL"), // staked sol bank
//         new PublicKey("7UVimffxr9ow1uXYxsr4LHAcV58mLzhmwaeKvJ1pjLiE"), // staked sol oracle
//         new PublicKey("BADo3D6nMtGnsAaTv3iEes8mMcq92TuFoBWebFe8kzeA"), // lst mint
//         new PublicKey("3e8RuaQMCPASZSMJAskHX6ZfuTtQ3JvoNPFoEvaVRn78"),
//       ], // lst pool
//       [
//         new PublicKey("3evdJSa25nsUiZzEUzd92UNa13TPRJrje1dRyiQP5Lhp"), // usdc bank
//         new PublicKey("7UVimffxr9ow1uXYxsr4LHAcV58mLzhmwaeKvJ1pjLiE"),
//       ], // usdc oracle
//     ],
//     ADD_COMPUTE_UNITS: false,
//   },
// };

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

  let activeBalances = await getOraclesAndCrankSwb(
    program,
    config.ACCOUNT,
    connection,
    user.wallet.payer
  );
  activeBalances.push(config.NEW_REMAINING);

  const oracleMeta: AccountMeta[] = activeBalances.flat().map((pubkey) => {
    return { pubkey, isSigner: false, isWritable: false };
  });

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
    createAssociatedTokenAccountIdempotentInstruction(
      user.wallet.publicKey,
      ata,
      user.wallet.publicKey,
      config.MINT
    ),
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
