import { Connection, PublicKey, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import { Program, AnchorProvider, Wallet } from "@coral-xyz/anchor";

import { loadKeypairFromFile } from "./utils";
import { assertI80F48Approx, assertKeysEqual } from "./softTests";

import { wrappedI80F48toBigNumber } from "@mrgnlabs/mrgn-common";
import { Marginfi } from "../idl/marginfi1.3";
import marginfiIdl from "../idl/marginfi.json";

const verbose = true;

type Config = {
  PROGRAM_ID: string;
  GROUP: PublicKey;
};

const config: Config = {
  PROGRAM_ID: "MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA",
  GROUP: new PublicKey("4qp6Fx6tnZkY5Wropq9wUYgtFxXKwE6viZxFHg3rdAG8"),
};

async function main() {
  marginfiIdl.address = config.PROGRAM_ID;
  const connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed");
  const wallet = new Wallet(loadKeypairFromFile(process.env.HOME + "/.config/solana/id.json"));

  const provider = new AnchorProvider(connection, wallet, {
    preflightCommitment: "confirmed",
  });

  const program = new Program<Marginfi>(marginfiIdl as Marginfi, provider);
  let group = await program.account.marginfiGroup.fetch(config.GROUP);

  console.log("admin: " + group.admin);
  console.log("emode admin: " + group.emodeAdmin);
  console.log("flags: " + group.groupFlags.toNumber());
  console.log("fee wallet: " + group.feeStateCache.globalFeeWallet);
  console.log("interest to program (fixed): " + wrappedI80F48toBigNumber(group.feeStateCache.programFeeFixed));
  console.log("interest to program (ir): " + wrappedI80F48toBigNumber(group.feeStateCache.programFeeRate));
}

main().catch((err) => {
  console.error(err);
});
