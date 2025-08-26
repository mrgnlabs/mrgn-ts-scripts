import {
  AccountMeta,
  Commitment,
  ComputeBudgetProgram,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  BankAndOracles,
  bytesToF64,
  getOraclesAndCrankSwb,
  dumpAccBalances,
} from "../lib/utils";
import { commonSetup } from "../lib/common-setup";
import { loadSponsoredOracle } from "../lib/pyth-oracle-helpers";
import { wrappedI80F48toBigNumber } from "@mrgnlabs/mrgn-common";
import * as sb from "@switchboard-xyz/on-demand";
import { MARGINFI_SPONSORED_SHARD_ID } from "../lib/constants";

export type Config = {
  PROGRAM_ID: string;
  ACCOUNT: PublicKey;
};

const config: Config = {
  PROGRAM_ID: "MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA",
  ACCOUNT: new PublicKey("4cjMrLqbmM1BWnWGYb1tbqpLN6UJnnbiVQsri32GoYpm"),
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
  const connection = user.connection;

  let activeBalances = await getOraclesAndCrankSwb(
    program,
    config.ACCOUNT,
    connection,
    user.wallet.payer
  );

  const oracleMeta: AccountMeta[] = activeBalances.flat().map((pubkey) => {
    return { pubkey, isSigner: false, isWritable: false };
  });
  const transaction = new Transaction();
  transaction.add(
    ComputeBudgetProgram.setComputeUnitLimit({ units: 2_000_000 }),
    await program.methods
      .lendingAccountPulseHealth()
      .accounts({
        marginfiAccount: config.ACCOUNT,
      })
      .remainingAccounts(oracleMeta)
      .instruction()
  );

  try {
    const commitment: Commitment = "finalized";
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [user.wallet.payer],
      {
        preflightCommitment: commitment,
        commitment: commitment,
      }
    );
    console.log("Transaction signature:", signature);
  } catch (error) {
    console.error("Transaction failed:", error);
  }
  let accAfter = await program.account.marginfiAccount.fetch(config.ACCOUNT);
  let cache = accAfter.healthCache;

  console.log("err: " + cache.mrgnErr);
  console.log("internal err: " + cache.internalErr);
  console.log("err index: " + cache.errIndex);
  console.log("liq err: " + cache.internalLiqErr);
  console.log("bankrupt err: " + cache.internalBankruptcyErr);
  console.log("flags: " + cache.flags);
  console.log("");
  console.log(
    "asset value: " + wrappedI80F48toBigNumber(cache.assetValue).toNumber()
  );
  console.log(
    "liab value: " + wrappedI80F48toBigNumber(cache.liabilityValue).toNumber()
  );
  console.log(
    "asset value (maint): " +
      wrappedI80F48toBigNumber(cache.assetValueMaint).toNumber()
  );
  console.log(
    "liab value (maint): " +
      wrappedI80F48toBigNumber(cache.liabilityValueMaint).toNumber()
  );
  console.log(
    "asset value (equity): " +
      wrappedI80F48toBigNumber(cache.assetValueEquity).toNumber()
  );
  console.log(
    "liab value (equity): " +
      wrappedI80F48toBigNumber(cache.liabilityValueEquity).toNumber()
  );
  console.log("");
  for (let i = 0; i < cache.prices.length; i++) {
    const price = bytesToF64(cache.prices[i]);
    if (price != 0) {
      console.log("price of balance " + i + ": " + price.toFixed(10));
    }
  }
}

main().catch((err) => {
  console.error(err);
});

export type HealthPulseArgs = {
  marginfiAccount: PublicKey;
  remaining: PublicKey[];
};
