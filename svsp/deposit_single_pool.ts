import {
  Connection,
  PublicKey,
  StakeAuthorizationLayout,
  StakeProgram,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { Program, AnchorProvider, BN } from "@coral-xyz/anchor";
import { loadKeypairFromFile, SINGLE_POOL_PROGRAM_ID } from "../scripts/utils";
import {
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddressSync,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { SinglePoolInstruction } from "@solana/spl-single-pool-classic";
import { commonSetup } from "../lib/common-setup";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { createAssociatedTokenAccountIdempotentInstruction } from "@mrgnlabs/mrgn-common";

/**
 * If true, send the tx. If false, output the unsigned b58 tx to console.
 */
const sendTx = true;

type Config = {
  PROGRAM_ID: string;
  /** There's probably a way to derive this...
   *
   * Note that this must be INACTIVE if the stake pool is currently activating (like it was created
   * recently), otherwise it must ACTIVE (the vast majority of the time, this is the case)
   *
   * This must be a native stake account that's delegated to the validator that the STAKE_POOL is
   * created for.
   */
  NATIVE_STAKE_ACCOUNT: PublicKey;
  STAKE_POOL: PublicKey;

  MULTISIG: PublicKey;
};

const config: Config = {
  PROGRAM_ID: "stag8sTKds2h4KzjUw3zKTsxbqvT4XKHdaR9X9E6Rct",
  NATIVE_STAKE_ACCOUNT: new PublicKey(
    "5eTEB4HHhK9ECHTMS5kCqZw8ggiFma2DxHATppPXESma"
  ),
  STAKE_POOL: new PublicKey("AvS4oXtxWdrJGCJwDbcZ7DqpSqNQtKjyXnbkDbrSk6Fq"),

  // Not required if sending without multisig.
  MULTISIG: new PublicKey("CYXEgwbPHu2f9cY3mcUkinzDoDcsSan7myh1uBvYRbEw"),
};

async function main() {
  const user = commonSetup(
    sendTx,
    config.PROGRAM_ID,
    "/keys/phantom-wallet.json",
    config.MULTISIG,
    "current"
  );
  const connection = user.connection;
  const wallet = user.wallet;

  // Equivalent to findPoolMintAddress
  const [lstMint] = PublicKey.findProgramAddressSync(
    [Buffer.from("mint"), config.STAKE_POOL.toBuffer()],
    SINGLE_POOL_PROGRAM_ID
  );
  console.log("lst mint: " + lstMint);
  // Equivalent to findPoolStakeAuthorityAddress
  const [auth] = PublicKey.findProgramAddressSync(
    [Buffer.from("stake_authority"), config.STAKE_POOL.toBuffer()],
    SINGLE_POOL_PROGRAM_ID
  );
  const lstAta = getAssociatedTokenAddressSync(lstMint, wallet.publicKey);

  const ixes: TransactionInstruction[] = [];
  ixes.push(
    createAssociatedTokenAccountIdempotentInstruction(
      wallet.publicKey,
      lstAta,
      wallet.publicKey,
      lstMint
    )
  );

  const authorizeStakerIxes = StakeProgram.authorize({
    stakePubkey: config.NATIVE_STAKE_ACCOUNT,
    authorizedPubkey: wallet.publicKey,
    newAuthorizedPubkey: auth,
    stakeAuthorizationType: StakeAuthorizationLayout.Staker,
  }).instructions;

  ixes.push(...authorizeStakerIxes);

  const authorizeWithdrawIxes = StakeProgram.authorize({
    stakePubkey: config.NATIVE_STAKE_ACCOUNT,
    authorizedPubkey: wallet.publicKey,
    newAuthorizedPubkey: auth,
    stakeAuthorizationType: StakeAuthorizationLayout.Withdrawer,
  }).instructions;

  ixes.push(...authorizeWithdrawIxes);

  const depositIx = await SinglePoolInstruction.depositStake(
    config.STAKE_POOL,
    config.NATIVE_STAKE_ACCOUNT,
    lstAta,
    wallet.publicKey
  );

  ixes.push(depositIx);

  const transaction = new Transaction();
  transaction.add(...ixes);

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

  console.log(
    "svsp deposit of " +
      config.NATIVE_STAKE_ACCOUNT +
      " done, vouchers to go ATA: " +
      lstAta
  );
}

main().catch((err) => {
  console.error(err);
});
