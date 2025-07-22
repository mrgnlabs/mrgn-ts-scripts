import { Connection, PublicKey, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import { bigNumberToWrappedI80F48, WrappedI80F48 } from "@mrgnlabs/mrgn-common";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { I80F48_ZERO, loadKeypairFromFile } from "./utils";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { Keypair } from "@solana/web3.js";
import { commonSetup } from "../lib/common-setup";

type Config = {
  PROGRAM_ID: string;
  ADMIN_PUBKEY: PublicKey;
  FLAT_SOL_FEE: number;
  PROGRAM_FEE_FIXED: WrappedI80F48;
  PROGRAM_FEE_RATE: WrappedI80F48;

  /// Required if using multisig only
  MULTISIG_PAYER: PublicKey;
};
const config: Config = {
  PROGRAM_ID: "5UDghkpgW1HfYSrmEj2iAApHShqU44H6PKTAar9LL9bY",
  ADMIN_PUBKEY: new PublicKey("FtG71Waj7zMDkJDJhLNmCDq9qtLJq1wy3TrzneXzBBQw"),
  FLAT_SOL_FEE: 1000,
  PROGRAM_FEE_FIXED: I80F48_ZERO,
  PROGRAM_FEE_RATE: I80F48_ZERO,

  MULTISIG_PAYER: new PublicKey("3HGdGLrnK9DsnHi1mCrUMLGfQHcu6xUrXhMY14GYjqvM"),
};

type InitGlobalFeeStateArgs = {
  payer: PublicKey;
  admin: PublicKey;
  wallet: PublicKey;
  bankInitFlatSolFee: number;
  programFeeFixed: WrappedI80F48;
  programFeeRate: WrappedI80F48;
};

async function main() {
  await initGlobalFeeState();
}

async function initGlobalFeeState() {
  const user = commonSetup(true, config.PROGRAM_ID, "/keys/zerotrade_admin.json");
  const program = user.program;
  const connection = user.connection;

  const transaction = new Transaction().add(
    await program.methods
      .initGlobalFeeState(
        config.ADMIN_PUBKEY,
        config.ADMIN_PUBKEY,
        config.FLAT_SOL_FEE,
        config.PROGRAM_FEE_FIXED,
        config.PROGRAM_FEE_RATE
      )
      .accounts({
        payer: user.wallet.publicKey,
        // feeState = deriveGlobalFeeState(id),
        // rent = SYSVAR_RENT_PUBKEY,
        // systemProgram: SystemProgram.programId,
      })
      .instruction()
  );

  try {
    const signature = await sendAndConfirmTransaction(connection, transaction, [user.wallet.payer]);
    console.log("Transaction signature:", signature);
  } catch (error) {
    console.error("Transaction failed:", error);
  }
}

main().catch((err) => {
  console.error(err);
});
