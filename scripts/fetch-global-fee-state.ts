import { PublicKey } from "@solana/web3.js";


import { wrappedI80F48toBigNumber } from "@mrgnlabs/mrgn-common";
import { commonSetup } from "../lib/common-setup";

const verbose = true;

type Config = {
  PROGRAM_ID: string;
};

const config: Config = {
  PROGRAM_ID: "MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA",
};

async function main() {
  const user = commonSetup(true, config.PROGRAM_ID, "/.config/solana/id.json");
  const program = user.program;
  
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
