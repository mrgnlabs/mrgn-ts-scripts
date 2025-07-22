import {
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
  createAssociatedTokenAccountIdempotentInstruction,
  createSyncNativeInstruction,
  getAssociatedTokenAddressSync,
} from "@mrgnlabs/mrgn-common";
import { commonSetup } from "../lib/common-setup";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";

const sendTx = false;

type Config = {
  PROGRAM_ID: string;
  GROUP: PublicKey;
  ACCOUNT: PublicKey;
  ACCOUNT_AUTHORITY: PublicKey;
  BANK: PublicKey;
  MINT: PublicKey;
  /** In native decimals */
  AMOUNT: BN;

  MULTISIG: PublicKey;
};

const config: Config = {
  PROGRAM_ID: "stag8sTKds2h4KzjUw3zKTsxbqvT4XKHdaR9X9E6Rct",
  GROUP: new PublicKey("FCPfpHA69EbS8f9KKSreTRkXbzFpunsKuYf5qNmnJjpo"),
  ACCOUNT: new PublicKey("8P6JTEqUW8RWopp1RU4jfbiVbnb9Dzuvtk3Kj6oa3tci"),
  ACCOUNT_AUTHORITY: new PublicKey(
    "CYXEgwbPHu2f9cY3mcUkinzDoDcsSan7myh1uBvYRbEw"
  ),
  BANK: new PublicKey("Ek5JSFJFD8QgXM6rPDCzf31XhDp1q3xezaWYSkJWqbqc"),
  MINT: new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"),
  AMOUNT: new BN(0.0001 * 10 ** 6),

  // Not required if sending without multisig.
  MULTISIG: new PublicKey("CYXEgwbPHu2f9cY3mcUkinzDoDcsSan7myh1uBvYRbEw"),
};

async function main() {
  const user = commonSetup(
    sendTx,
    config.PROGRAM_ID,
    "/keys/staging-deploy.json",
    config.MULTISIG,
    "current"
  );
  const program = user.program;
  const connection = user.connection;

  const ata = getAssociatedTokenAddressSync(
    config.MINT,
    user.wallet.publicKey,
    true
  );

  const transaction = new Transaction();
  transaction.add(
    createAssociatedTokenAccountIdempotentInstruction(
      user.wallet.publicKey,
      ata,
      user.wallet.publicKey,
      config.MINT
    )
  );
  if (config.MINT.toString() == "So11111111111111111111111111111111111111112") {
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: user.wallet.publicKey,
        toPubkey: ata,
        lamports: config.AMOUNT.toNumber(),
      })
    );
    transaction.add(createSyncNativeInstruction(ata));
  }
  transaction.add(
    await program.methods
      .lendingAccountDeposit(config.AMOUNT, false)
      .accounts({
        marginfiAccount: config.ACCOUNT,
        bank: config.BANK,
        signerTokenAccount: ata,
        // bankLiquidityVault = deriveLiquidityVault(id, bank)
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      // To handle the case where the account doesn't exist yet.
      .accountsPartial({
        group: config.GROUP,
        authority: config.ACCOUNT_AUTHORITY,
      })
      .instruction()
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

  console.log("deposit: " + config.AMOUNT.toString() + " to " + config.BANK);
}

main().catch((err) => {
  console.error(err);
});
