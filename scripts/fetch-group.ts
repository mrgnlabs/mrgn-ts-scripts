import { PublicKey } from "@solana/web3.js";

import { wrappedI80F48toBigNumber } from "@mrgnlabs/mrgn-common";
import { commonSetup } from "../lib/common-setup";

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
  const user = commonSetup(
    true,
    config.PROGRAM_ID,
    "/keys/staging-deploy.json",
    undefined,
    "current"
  );
  const program = user.program;

  let group = await program.account.marginfiGroup.fetch(config.GROUP);

  console.log("admin: " + group.admin);
  console.log("emode admin: " + group.emodeAdmin);
  console.log("curve admin: " + group.delegateCurveAdmin);
  console.log("limit admin: " + group.delegateLimitAdmin);
  console.log("emissions admin: " + group.delegateEmissionsAdmin);

  console.log("flags: " + group.groupFlags.toNumber());
  console.log("fee wallet: " + group.feeStateCache.globalFeeWallet);
  console.log(
    "interest to program (fixed): " +
      wrappedI80F48toBigNumber(group.feeStateCache.programFeeFixed)
  );
  console.log(
    "interest to program (ir): " +
      wrappedI80F48toBigNumber(group.feeStateCache.programFeeRate)
  );

  let cache = group.feeStateCache;
  console.log("cache values: ");
  console.log(" wallet:    " + cache.globalFeeWallet);
  console.log(" fixed:     " + wrappedI80F48toBigNumber(cache.programFeeFixed));
  console.log(" rate       " + wrappedI80F48toBigNumber(cache.programFeeRate));
  console.log(" last updated       " + cache.lastUpdate.toString());

  console.log("\nBank addresses:");

  // Fetch all banks that belong to this group
  const banks = await program.account.bank.all([
    {
      memcmp: {
        offset: 8 + 32 + 1, // Discriminator + Pubkey + u8 (matches Rust: 8 + size_of::<Pubkey>() + size_of::<u8>())
        bytes: config.GROUP.toBase58(),
      },
    },
  ]);

  banks.forEach((bank, index) => {
    console.log(`${index}: ${bank.publicKey.toString()}`);
  });
}

main().catch((err) => {
  console.error(err);
});
