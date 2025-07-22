import { Connection, PublicKey, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import { Marginfi } from "../../marginfi-client-v2/src/idl/marginfi-types_0.1.2";
import marginfiIdl from "../../marginfi-client-v2/src/idl/marginfi_0.1.2.json";
import { bigNumberToWrappedI80F48, WrappedI80F48 } from "@mrgnlabs/mrgn-common";
import { AnchorProvider, BN, Program } from "@coral-xyz/anchor";
import { loadKeypairFromTxtFile } from "./utils";
import { assertBNEqual, assertI80F48Approx, assertKeysEqual } from "./softTests";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { wrappedI80F48toBigNumber } from "../../mrgn-common/dist";

/**
 * If true, send the tx. If false, output the b58 tx to console.
 */
const sendTx = false;

type Config = {
  PROGRAM_ID: string;
  ADMIN: PublicKey;

  /** Multisig if using a MS, otherwise any value */
  MULTISIG: PublicKey;

  NEW_WALLET: PublicKey;
  NEW_ADMIN: PublicKey;
  FLAT_SOL_FEE: number;
  FIXED_FEE: number;
  RATE_FEE: number;
};

const config: Config = {
  PROGRAM_ID: "MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA",
  ADMIN: new PublicKey("AZtUUe9GvTFq9kfseu9jxTioSgdSfjgmZfGQBmhVpTj1"),

  MULTISIG: new PublicKey("AZtUUe9GvTFq9kfseu9jxTioSgdSfjgmZfGQBmhVpTj1"),

  NEW_WALLET: new PublicKey("CYXEgwbPHu2f9cY3mcUkinzDoDcsSan7myh1uBvYRbEw"),
  NEW_ADMIN: new PublicKey("CYXEgwbPHu2f9cY3mcUkinzDoDcsSan7myh1uBvYRbEw"),
  FLAT_SOL_FEE: 150000000,
  FIXED_FEE: 0,
  RATE_FEE: 0.075,
};

async function main() {
  marginfiIdl.address = config.PROGRAM_ID;
  const connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed");
  const wallet = loadKeypairFromTxtFile(process.env.HOME + "/keys/staging-fee-admin.txt");

  // @ts-ignore
  const provider = new AnchorProvider(connection, wallet, {
    preflightCommitment: "confirmed",
  });
  const program: Program<Marginfi> = new Program(
    // @ts-ignore
    marginfiIdl as Marginfi,
    provider
  );

  const transaction = new Transaction().add(await editGlobalFeeState(program));

  if (sendTx) {
    try {
      const signature = await sendAndConfirmTransaction(connection, transaction, [wallet]);
      console.log("Transaction signature:", signature);
    } catch (error) {
      console.error("Transaction failed:", error);
    }

    const [feeStateKey] = deriveGlobalFeeState(program.programId);
    const gfs = await program.account.feeState.fetch(feeStateKey);
    console.log("***Fee state***");
    console.log(" admin:     " + gfs.globalFeeAdmin);
    console.log(" wallet:    " + gfs.globalFeeWallet);
    console.log(" flat sol:  " + gfs.bankInitFlatSolFee);
    console.log(" fixed:     " + wrappedI80F48toBigNumber(gfs.programFeeFixed));
    console.log(" rate       " + wrappedI80F48toBigNumber(gfs.programFeeRate));
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

// TODO remove after package updates
const deriveGlobalFeeState = (programId: PublicKey) => {
  return PublicKey.findProgramAddressSync([Buffer.from("feestate", "utf-8")], programId);
};

export const editGlobalFeeState = (program: Program<Marginfi>) => {
  const ix = program.methods
    .editGlobalFeeState(
      config.NEW_ADMIN,
      config.NEW_WALLET,
      config.FLAT_SOL_FEE,
      bigNumberToWrappedI80F48(config.FIXED_FEE),
      bigNumberToWrappedI80F48(config.RATE_FEE)
    )
    .accountsPartial({
      globalFeeAdmin: config.ADMIN,
      // feeState = deriveGlobalFeeState(id),
    })
    .instruction();

  return ix;
};

main().catch((err) => {
  console.error(err);
});

/*
 * Status 2/28/2025
Admin: AZtUUe9GvTFq9kfseu9jxTioSgdSfjgmZfGQBmhVpTj1 wallet JAnRanMrsn5vxWmSpU5ndvtvQLAyzGJEenNzgVC1vNMC
flat sol: 150000000 fixed: 0 rate 0.0075000000000002842171
 */
