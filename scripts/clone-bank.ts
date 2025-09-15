import {
  AccountMeta,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@mrgnlabs/mrgn-common";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { commonSetup } from "../lib/common-setup";

/**
 * If true, send the tx. If false, output the unsigned b58 tx to console.
 */
const sendTx = true;

type Config = {
  PROGRAM_ID: string;
  /** The group you are cloning INTO, not the group of the bank to be cloned */
  GROUP_KEY: PublicKey;
  /** Bank we're cloning on mainnet program (source of truth for all settings) */
  SOURCE_BANK: PublicKey;
  /** Group admin of GROUP_KEY */
  ADMIN: PublicKey;
  /** Pays rent, no flat sol fee to clone */
  FEE_PAYER: PublicKey;
  /** Chosen arbitrarily, does NOT have to match the seed of the SOURCE_BANK */
  SEED: number;

  MULTISIG_PAYER?: PublicKey; // optional if not using squads
};

const config: Config = {
  PROGRAM_ID: "stag8sTKds2h4KzjUw3zKTsxbqvT4XKHdaR9X9E6Rct",
  GROUP_KEY: new PublicKey("Diu1q9gniR1qR4Daaej3rcHd6949HMmxLGsnQ94Z3rLz"),
  SOURCE_BANK: new PublicKey("8g5qG6PVygcVSXV1cJnjXaD1yhrDwcWAMQCY2wR9VuAf"),
  ADMIN: new PublicKey("725Z4QQUVhRiXcCdf4cQTrxXYmQXyW9zgVkW5PDVSJz4"),
  FEE_PAYER: new PublicKey("725Z4QQUVhRiXcCdf4cQTrxXYmQXyW9zgVkW5PDVSJz4"),
  SEED: 0,

  MULTISIG_PAYER: new PublicKey("CYXEgwbPHu2f9cY3mcUkinzDoDcsSan7myh1uBvYRbEw"),
};

async function main() {
  console.log("cloning bank into group:", config.GROUP_KEY.toBase58());
  const user = commonSetup(
    sendTx,
    config.PROGRAM_ID,
    "/keys/zerotrade_admin.json",
    config.MULTISIG_PAYER,
    "current"
  );
  const program = user.program;
  const connection = user.connection;

  const sourceBankPk = config.SOURCE_BANK;
  const sourceBankAcc: any = await program.account.bank.fetch(sourceBankPk);
  const bankMint: PublicKey = sourceBankAcc.mint as PublicKey;

  // Copies T22 or Token classic from the bank to be cloned
  let tokenProgram: PublicKey;
  if (!tokenProgram) {
    const mintInfo = await connection.getAccountInfo(bankMint);
    if (!mintInfo) throw new Error("Mint account not found on chain");
    tokenProgram = mintInfo.owner;
  }

  const [bankKey] = deriveBankWithSeed(
    program.programId,
    config.GROUP_KEY,
    bankMint,
    new BN(config.SEED)
  );

  const ix = await program.methods
    .lendingPoolCloneBank(new BN(config.SEED))
    .accounts({
      marginfiGroup: config.GROUP_KEY,
      feePayer: config.FEE_PAYER,
      bankMint, // discovered from source bank
      sourceBank: sourceBankPk,
      tokenProgram,
    })
    .accountsPartial({ admin: config.ADMIN })
    .instruction();

  const tx = new Transaction().add(ix);

  if (sendTx) {
    try {
      const signature = await sendAndConfirmTransaction(connection, tx, [
        user.wallet.payer,
      ]);
      console.log("new bank:", bankKey.toString());
      console.log(" (a copy of bank):", config.SOURCE_BANK.toString());
      console.log("Transaction signature:", signature);
    } catch (error) {
      console.error("Transaction failed:", error);
    }
  } else {
    // Prepare an unsigned, base58-encoded transaction for multisig flow
    const payer = config.MULTISIG_PAYER ?? config.FEE_PAYER;
    tx.feePayer = payer;
    const { blockhash } = await connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;
    const serializedTransaction = tx.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    });
    const base58Transaction = bs58.encode(serializedTransaction);
    console.log("new bank:", bankKey.toString());
    console.log("Base58-encoded transaction:", base58Transaction);
  }
}

const deriveBankWithSeed = (
  programId: PublicKey,
  group: PublicKey,
  bankMint: PublicKey,
  seed: BN
) => {
  return PublicKey.findProgramAddressSync(
    [group.toBuffer(), bankMint.toBuffer(), seed.toArrayLike(Buffer, "le", 8)],
    programId
  );
};

main().catch((err) => {
  console.error(err);
});
