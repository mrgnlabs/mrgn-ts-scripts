import {
  AccountMeta,
  Commitment,
  ComputeBudgetProgram,
  PublicKey,
  Transaction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { bytesToF64, getOraclesAndCrankSwb } from "../lib/utils";
import { commonSetup, User } from "../lib/common-setup";
import { wrappedI80F48toBigNumber } from "@mrgnlabs/mrgn-common";
import { MarginfiAccount } from "@mrgnlabs/marginfi-client-v2";
import { Marginfi } from "../idl/marginfi";
import { chunk } from "./utils";
import { createHash } from "crypto";
import { promises as fs } from "fs";
import * as path from "path";

const CSV_PATH = path.resolve("health_pulse.csv");

const HEADERS = [
  "account",
  "mrgn_err",
  "internal_err",
  "err_index",
  "liq_err",
  "bankrupt_err",
  "flags",
  "asset",
  "liab",
  "asset_maint",
  "liab_maint",
  "asset_equity",
  "liab_equity",
  "cache_unix_ts",
  "price_count",
  "prices_json",
];

async function ensureCsvHeader() {
  try {
    await fs.access(CSV_PATH);
  } catch {
    await fs.writeFile(CSV_PATH, HEADERS.join(",") + "\n");
  }
}

function csvEscape(v: unknown): string {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

async function appendCsvRow(row: Record<string, any>) {
  await ensureCsvHeader();
  const line = HEADERS.map((h) => csvEscape(row[h])).join(",") + "\n";
  await fs.appendFile(CSV_PATH, line);
}

export type Config = {
  PROGRAM_ID: string;
  ACCOUNT: PublicKey;

  /** Optional */
  LUT: PublicKey | undefined;
};

const config: Config = {
  PROGRAM_ID: "MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA",
  ACCOUNT: new PublicKey("Azp49yTY4gxHbW1aNGq4mzWLmLhgakdo1snuzScTd1GK"),

  LUT: new PublicKey("CQ8omkUwDtsszuJLo9grtXCeEyDU4QqBLRv9AjRDaUZ3"),
};

async function main() {
  const user = commonSetup(
    true,
    config.PROGRAM_ID,
    "/.config/arena/id.json",
    undefined,
    "current"
  );
  await massive_pulse(user);
  //await health_pulse(config, user);
}

async function massive_pulse(user: User<Marginfi>) {
  let crankedSwbOracles: Set<PublicKey> = new Set();
  const groupKey = new PublicKey(
    "4qp6Fx6tnZkY5Wropq9wUYgtFxXKwE6viZxFHg3rdAG8"
  );

  const GROUP_OFFSET = 8;
  const DATA_SIZE = user.program.account.marginfiAccount.size;
  const name = "marginfiAccount";
  const disc = createHash("sha256")
    .update(`account:${name}`)
    .digest()
    .slice(0, 8);

  // 1) List keys only (small response)
  const gpa = await user.connection.getProgramAccounts(user.program.programId, {
    filters: [
      { memcmp: { offset: 0, bytes: "CKkRR4La3xu" } },
      { memcmp: { offset: GROUP_OFFSET, bytes: groupKey.toBase58() } },
      { dataSize: DATA_SIZE },
    ],
    dataSlice: { offset: 0, length: 0 },
  });

  // 2) Fetch & decode in batches
  const keys = gpa.map((a) => a.pubkey); //[new PublicKey("F1sdbgu1FpDsKHGmG7RBNtehVC4M19KxAPSruvS5EXf8")]; //gpa.map((a) => a.pubkey);
  const pages = chunk(keys, 100); // 100–200 is friendly to most RPCs

  const results: Array<{ pubkey: PublicKey; account: any }> = [];
  for (const page of pages) {
    const infos = await user.connection.getMultipleAccountsInfo(
      page,
      "confirmed"
    );
    for (let i = 0; i < page.length; i++) {
      const info = infos[i];
      if (!info) continue;
      const userAccount = MarginfiAccount.decodeAccountRaw(
        info.data,
        user.program.idl
      );
      if (userAccount.accountFlags.testn(0)) {
        // ignore disabled accounts
        continue;
      }

      results.push({ pubkey: page[i], account: userAccount });
      const localCfg = { ...config, ACCOUNT: page[i] };
      await health_pulse(localCfg, user, false, crankedSwbOracles);
    }
    break;
  }

  //const users = await user.program.account.marginfiAccount.all([{ memcmp: { offset: 8, bytes: groupKey.toBase58() }}]);
  console.log("users from main pool: " + results.length);
}

async function health_pulse(
  config: Config,
  user: User<Marginfi>,
  sendTx: boolean = true,
  crankedSwbOracles: Set<PublicKey> = new Set()
) {
  const program = user.program;
  const connection = user.connection;

  let activeBalances = await getOraclesAndCrankSwb(
    program,
    config.ACCOUNT,
    connection,
    user.wallet.payer,
    crankedSwbOracles
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

  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash();
  const lut = config.LUT
    ? [(await connection.getAddressLookupTable(config.LUT)).value]
    : [];

  const v0Message = new TransactionMessage({
    payerKey: user.wallet.publicKey,
    recentBlockhash: blockhash,
    instructions: transaction.instructions,
  }).compileToV0Message(lut);
  const v0Tx = new VersionedTransaction(v0Message);

  let accAfter: any;
  if (sendTx) {
    try {
      const commitment: Commitment = "finalized";
      v0Tx.sign([user.wallet.payer]);

      const signature = await connection.sendTransaction(v0Tx, {
        maxRetries: 2,
      });
      await connection.confirmTransaction(
        { signature, blockhash, lastValidBlockHeight },
        commitment
      );
      console.log("Transaction signature:", signature);
    } catch (error) {
      console.error("Transaction failed:", error);
    }
    accAfter = await program.account.marginfiAccount.fetch(config.ACCOUNT);
  } else {
    const { value } = await program.provider.connection.simulateTransaction(
      v0Tx,
      {
        accounts: {
          encoding: "base64",
          addresses: [config.ACCOUNT.toBase58()],
        },
        sigVerify: false,
        replaceRecentBlockhash: true,
      }
    );

    const logs = (value.logs ?? []).join("\n");

    if (value.err) {
      console.log(
        `simulateTransaction failed: ${JSON.stringify(value.err)}\n${logs}`
      );
      return;
    }

    const acc = value.accounts?.[0];
    if (!acc || !Array.isArray((acc as any).data)) {
      console.log(
        `simulateTransaction returned no post-state for ${config.ACCOUNT.toBase58()}\n${logs}`
      );
      return;
    }

    const [b64, enc] = (acc as any).data as [string, string];
    if (enc !== "base64") {
      console.log(`Unexpected encoding "${enc}" in simulateTransaction result`);
      return;
    }

    const buf = Buffer.from(b64, "base64");
    accAfter = MarginfiAccount.decodeAccountRaw(buf, program.idl);
  }

  let cache = accAfter.healthCache;

  if (sendTx) {
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
  } else {
    const toNum = (x: any) => wrappedI80F48toBigNumber(x).toNumber(); // or toString() if you want exactness
    const prices = cache.prices
      .map((p: Uint8Array) => bytesToF64(p))
      .filter((v: number) => v !== 0);

    const row = {
      account: config.ACCOUNT.toBase58(),
      mrgn_err: cache.mrgnErr,
      internal_err: cache.internalErr,
      err_index: cache.errIndex,
      liq_err: cache.internalLiqErr,
      bankrupt_err: cache.internalBankruptcyErr,
      flags: cache.flags,
      asset: toNum(cache.assetValue),
      liab: toNum(cache.liabilityValue),
      asset_maint: toNum(cache.assetValueMaint),
      liab_maint: toNum(cache.liabilityValueMaint),
      asset_equity: toNum(cache.assetValueEquity),
      liab_equity: toNum(cache.liabilityValueEquity),
      cache_unix_ts: Number(cache.timestamp ?? 0),
      price_count: prices.length,
      prices_json: JSON.stringify(prices), // keeps CSV width stable
    };

    await appendCsvRow(row);
  }
}

main().catch((err) => {
  console.error(err);
});

export type HealthPulseArgs = {
  marginfiAccount: PublicKey;
  remaining: PublicKey[];
};
