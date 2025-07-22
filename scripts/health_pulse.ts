import {
  AccountMeta,
  Commitment,
  ComputeBudgetProgram,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { BankAndOracles, bytesToF64, dumpAccBalances } from "../lib/utils";
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
  ACCOUNT: new PublicKey("BT6jXNSmxHPjE3TgNfSiG6NnqASpbvATnwFKLrLVt9Kz"),
};

async function main() {
  const user = commonSetup(
    true,
    config.PROGRAM_ID,
    "/keys/staging-deploy.json",
    undefined,
    "1.3"
  );
  const program = user.program;
  const connection = user.connection;

  let swbPullFeeds: PublicKey[] = [];

  let acc = await program.account.marginfiAccount.fetch(config.ACCOUNT);
  dumpAccBalances(acc);
  let balances = acc.lendingAccount.balances;
  let activeBalances: BankAndOracles[] = [];
  for (let i = 0; i < balances.length; i++) {
    let bal = balances[i];
    if (bal.active == 1) {
      let bankAcc = await program.account.bank.fetch(bal.bankPk);
      if ("switchboardPull" in bankAcc.config.oracleSetup) {
        const oracle = bankAcc.config.oracleKeys[0];
        console.log("[" + i + "] swb oracle: " + oracle);
        swbPullFeeds.push(oracle);
        activeBalances.push([bal.bankPk, oracle]);
      } else if ("pythPushOracle" in bankAcc.config.oracleSetup) {
        const oracle = bankAcc.config.oracleKeys[0];
        console.log("[" + i + "] pyth oracle: " + oracle);
        let feed = PublicKey.default;
        try {
          feed = (await loadSponsoredOracle(oracle, user.provider.connection))
            .address;
        } catch (err) {
          console.error(
            "bank: " +
              bal.bankPk +
              " has no pyth feed, falling back to mrgn feed"
          );
          feed = (
            await loadSponsoredOracle(
              oracle,
              user.provider.connection,
              MARGINFI_SPONSORED_SHARD_ID
            )
          ).address;
        }
        console.log(" feed: " + feed);
        activeBalances.push([bal.bankPk, feed]);
      } else if (
        "[" + i + "] stakedWithPythPush" in
        bankAcc.config.oracleSetup
      ) {
        const oracle = bankAcc.config.oracleKeys[0];
        console.log("pyth oracle: " + oracle);
        console.log(
          "lst pool/mint: " +
            bankAcc.config.oracleKeys[1] +
            " " +
            bankAcc.config.oracleKeys[2]
        );
        activeBalances.push([
          bal.bankPk,
          oracle,
          bankAcc.config.oracleKeys[1],
          bankAcc.config.oracleKeys[2],
        ]);
      } else {
        const oracle = bankAcc.config.oracleKeys[0];
        console.log("[" + i + "] other oracle: " + oracle);
        activeBalances.push([bal.bankPk, oracle]);
      }
    }
  }

  if (swbPullFeeds.length > 0) {
    try {
      const swbProgram = await sb.AnchorUtils.loadProgramFromConnection(
        connection
      );
      const [pullIx, _luts] = await sb.PullFeed.fetchUpdateManyIx(swbProgram, {
        feeds: swbPullFeeds,
        numSignatures: 1,
      });
      const crankTx = new Transaction();
      crankTx.add(...pullIx);
      const signature = await sendAndConfirmTransaction(connection, crankTx, [
        user.wallet.payer,
      ]);
      console.log("Swb crank tx signature:", signature);
    } catch (err) {
      console.log("swb crank failed");
    }
  }

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
      console.log("price of balance " + i + ": " + price);
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
