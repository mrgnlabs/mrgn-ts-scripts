import { Connection, PublicKey, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import { Program, AnchorProvider } from "@coral-xyz/anchor";

import { loadKeypairFromFile } from "./utils";
import { assertI80F48Approx, assertKeysEqual } from "./softTests";

import { wrappedI80F48toBigNumber } from "@mrgnlabs/mrgn-common";
import { Marginfi } from "@mrgnlabs/marginfi-client-v2/src/idl/marginfi-types_0.1.2";
import marginfiIdl from "@mrgnlabs/marginfi-client-v2/src/idl/marginfi_0.1.2.json";

const verbose = true;

type Config = {
  PROGRAM_ID: string;
};

const config: Config = {
  PROGRAM_ID: "MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA",
};

async function main() {
  marginfiIdl.address = config.PROGRAM_ID;
  const connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed");
  const wallet = loadKeypairFromFile(process.env.HOME + "/.config/solana/id.json");

  // @ts-ignore
  const provider = new AnchorProvider(connection, wallet, {
    preflightCommitment: "confirmed",
  });

  const program = new Program<Marginfi>(marginfiIdl as Marginfi, provider);
  const [feeStateKey] = deriveGlobalFeeState(program.programId);
  const gfs = await program.account.feeState.fetch(feeStateKey);
  console.log("***Fee state***");
  console.log(" admin:     " + gfs.globalFeeAdmin);
  console.log(" wallet:    " + gfs.globalFeeWallet);
  console.log(" flat sol:  " + gfs.bankInitFlatSolFee);
  console.log(" fixed:     " + wrappedI80F48toBigNumber(gfs.programFeeFixed));
  console.log(" rate       " + wrappedI80F48toBigNumber(gfs.programFeeRate));
}

// TODO remove after package updates
const deriveGlobalFeeState = (programId: PublicKey) => {
  return PublicKey.findProgramAddressSync([Buffer.from("feestate", "utf-8")], programId);
};

main().catch((err) => {
  console.error(err);
});
