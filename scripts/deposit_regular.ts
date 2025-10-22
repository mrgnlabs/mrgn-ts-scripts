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

const sendTx = true;

type Config = {
  PROGRAM_ID: string;
  GROUP: PublicKey;
  ACCOUNT: PublicKey;
  ACCOUNT_AUTHORITY: PublicKey;
  BANK: PublicKey;
  MINT: PublicKey;
  /** In native decimals */
  AMOUNT: BN;

  MULTISIG?: PublicKey;
};


const examples = {
  depositUSDCArena: {
    PROGRAM_ID: "stag8sTKds2h4KzjUw3zKTsxbqvT4XKHdaR9X9E6Rct",
    ACCOUNT: new PublicKey("N92TukzWFZ7GjM2iLbpPvGhS9rCWknMiDMMFx2AHAGh"),
    BANK: new PublicKey("FBhaEQmAj1YZrNh13esWYFEaMtthdB1E2fwPiUTjmahE"),
    MINT: new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"),
    AMOUNT: new BN(2 * 10 ** 6), // 2 USDC (** 6 decimals)
    REMAINING: [
      new PublicKey("FBhaEQmAj1YZrNh13esWYFEaMtthdB1E2fwPiUTjmahE"), // usdc bank
      new PublicKey("Dpw1EAVrSB1ibxiDQyTAW6Zip3J4Btk2x4SgApQCeFbX"), // usdc oracle
    ],
    MULTISIG: undefined,
  },
  depositBonkKamino: {
    PROGRAM_ID: "5UDghkpgW1HfYSrmEj2iAApHShqU44H6PKTAar9LL9bY",
    ACCOUNT: new PublicKey("Cw9meVno4B8Tyyg6kvLh8mogdCRj4JT2sSPVM8hbcVhK"),
    BANK: new PublicKey("5HFKjP8UafAM4uPohhm5nGqShaFTH2wtzdLPZ9vZgg8T"),
    MINT: new PublicKey("DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263"),
    AMOUNT: new BN(100000 * 10 ** 5), // 100'000 BONK (** 5 decimals)
    REMAINING: [
      new PublicKey("5HFKjP8UafAM4uPohhm5nGqShaFTH2wtzdLPZ9vZgg8T"), // bonk bank
      new PublicKey("DBE3N8uNjhKPRHfANdwGvCZghWXyLPdqdSbEW2XFwBiX"), // bonk oracle
    ],
    MULTISIG: undefined,
  },
  depositUXDProd: {
    PROGRAM_ID: "MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA",
    ACCOUNT: new PublicKey("AkRjbYJgrKXmdE9zizGWXcK4oecJfhuLxBuNrKsooAKK"),
    BANK: new PublicKey("BeNBJrAh1tZg5sqgt8D6AWKJLD5KkBrfZvtcgd7EuiAR"),
    MINT: new PublicKey("7kbnvuGBxxj8AG9qp8Scn56muWGaRaFqxg1FsRp3PaFT"),
    AMOUNT: new BN(29675 * 10 ** 6), // 29'675 UXD (** 6 decimals)
    REMAINING: [
      new PublicKey("BeNBJrAh1tZg5sqgt8D6AWKJLD5KkBrfZvtcgd7EuiAR"), // uxd bank
      new PublicKey("CoEDGeYda7Mi6c1BAsHE2LL6zEVcitX43wPABSLgQfpB"), // uxd oracle
    ],
    MULTISIG: undefined,
  }
};

const config = examples.depositBonkKamino;

// const config: Config = {
//   PROGRAM_ID: "stag8sTKds2h4KzjUw3zKTsxbqvT4XKHdaR9X9E6Rct",
//   GROUP: new PublicKey("CgAQhTn6c2XCeFigriP8aapiKn33R16cMKjgZTyjP3PA"),
//   ACCOUNT: new PublicKey("EtVhwiGacGjvZ48XvmYJebfxfWFxqhxHvSx9arsfFDCW"),
//   ACCOUNT_AUTHORITY: new PublicKey(
//     "6DdJqQYD8AizuXiCkbn19LiyWRwUsRMzy2Sgyoyasyj7"
//   ),
//   BANK: new PublicKey("64NtNrDgwY4U8ktazsPMNSBNdwjeFgxauqxi9f6u9ym8"),
//   MINT: new PublicKey("DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263"),
//   AMOUNT: new BN(100000 * 10 ** 5),
// };

async function main() {
  const user = commonSetup(
    sendTx,
    config.PROGRAM_ID,
    "/.config/stage/id.json",
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
      // .accountsPartial({
      //   group: config.GROUP,
      //   authority: config.ACCOUNT_AUTHORITY,
      // })
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
