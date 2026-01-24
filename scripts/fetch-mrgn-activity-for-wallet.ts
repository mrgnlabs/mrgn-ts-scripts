import { PublicKey } from "@solana/web3.js";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { commonSetup } from "../lib/common-setup";
import fs from "fs";
import path from "path";

type Config = {
  PROGRAM_ID: string;
  WALLET: PublicKey;
};

const config: Config = {
  PROGRAM_ID: "MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA",
  WALLET: new PublicKey("HPeLmNJgQdZ2yzxqiDY5v1EBW8ADF1Fx5Mt4xArjPbuX"),
};

async function main() {
  const user = commonSetup(true, config.PROGRAM_ID, "/.config/solana/id.json");
  const connection = user.connection;
  const programId = new PublicKey(config.PROGRAM_ID);
  const JUPITER_PROGRAM_ID = new PublicKey(
    "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4",
  );
  const TITAN_PROGRAM_ID = new PublicKey(
    "T1TANpTeScyeqVzzgNViGDNrkQ6qHz9KrSBS4aNXvGT",
  );

  const color = {
    reset: "\x1b[0m",
    dim: "\x1b[2m",
    cyan: "\x1b[36m",
    green: "\x1b[32m",
    red: "\x1b[31m",
    yellow: "\x1b[33m",
  };
  const paint = (text: string, tint: keyof typeof color) =>
    `${color[tint]}${text}${color.reset}`;

  const printTable = (headers: string[], rows: string[][]) => {
    const widths = headers.map((header, idx) =>
      Math.max(header.length, ...rows.map((row) => (row[idx] ?? "").length)),
    );
    const line = (cells: string[]) =>
      cells
        .map((cell, idx) => cell.padEnd(widths[idx]))
        .join("  ")
        .trimEnd();
    console.log(line(headers));
    console.log(line(widths.map((width) => "-".repeat(Math.max(width, 1)))));
    for (const row of rows) {
      console.log(line(row));
    }
  };

  const START_LIQUIDATION_DISCRIMINATOR = [244, 93, 90, 214, 192, 166, 191, 21];
  const LENDING_ACCOUNT_LIQUIDATE_DISCRIMINATOR = [
    214, 169, 151, 213, 251, 167, 86, 219,
  ];

  const nowSec = Math.floor(Date.now() / 1000);
  const windows = {
    "1h": 1 * 60 * 60,
    "24h": 24 * 60 * 60,
    "7d": 7 * 24 * 60 * 60,
    "30d": 30 * 24 * 60 * 60,
  };
  const windowOrder = ["1h", "24h", "7d", "30d"] as const;

  const cutoff30d = nowSec - windows["30d"];
  const signatures = [];
  let before: string | undefined;

  while (true) {
    const batch = await connection.getSignaturesForAddress(
      config.WALLET,
      { limit: 1000, before },
      "confirmed",
    );
    if (batch.length === 0) {
      break;
    }
    signatures.push(...batch);
    before = batch[batch.length - 1].signature;
    const oldestBlockTime = batch[batch.length - 1].blockTime ?? 0;
    if (oldestBlockTime && oldestBlockTime < cutoff30d) {
      break;
    }
  }

  const candidates = signatures.filter(
    (sig) => sig.blockTime && sig.blockTime >= cutoff30d,
  );

  const matches: {
    signature: string;
    blockTime: number;
    instructionNames: string[];
    success: boolean;
  }[] = [];
  const activityEvents: {
    signature: string;
    time: string;
    status: "success" | "failed";
    instruction: string;
  }[] = [];
  const jupiterTxs: {
    signature: string;
    blockTime: number;
    success: boolean;
  }[] = [];
  const titanTxs: { signature: string; blockTime: number; success: boolean }[] =
    [];

  const matchesDiscriminator = (data: Uint8Array, discriminator: number[]) => {
    if (data.length < discriminator.length) {
      return false;
    }
    for (let i = 0; i < discriminator.length; i += 1) {
      if (data[i] !== discriminator[i]) {
        return false;
      }
    }
    return true;
  };

  for (const sigInfo of candidates) {
    const tx = await connection.getTransaction(sigInfo.signature, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });
    if (!tx) {
      continue;
    }

    const message = tx.transaction.message;
    const staticKeys = message.staticAccountKeys;
    const loadedWritable = tx.meta?.loadedAddresses?.writable ?? [];
    const loadedReadonly = tx.meta?.loadedAddresses?.readonly ?? [];
    const accountKeys = [...staticKeys, ...loadedWritable, ...loadedReadonly];
    const signerIndex = accountKeys.findIndex((key) =>
      key.equals(config.WALLET),
    );

    if (signerIndex < 0 || !message.isAccountSigner(signerIndex)) {
      continue;
    }

    const instructionNames: string[] = [];
    let hasJupiter = false;
    let hasTitan = false;
    for (const ix of message.compiledInstructions) {
      if (ix.programIdIndex >= accountKeys.length) {
        continue;
      }
      const programKey = accountKeys[ix.programIdIndex];
      if (programKey?.equals(JUPITER_PROGRAM_ID)) {
        hasJupiter = true;
      } else if (programKey?.equals(TITAN_PROGRAM_ID)) {
        hasTitan = true;
      }
      if (!programKey || !programKey.equals(programId)) {
        continue;
      }

      const data = typeof ix.data === "string" ? bs58.decode(ix.data) : ix.data;
      if (matchesDiscriminator(data, START_LIQUIDATION_DISCRIMINATOR)) {
        instructionNames.push("startLiquidation");
      } else if (
        matchesDiscriminator(data, LENDING_ACCOUNT_LIQUIDATE_DISCRIMINATOR)
      ) {
        instructionNames.push("lendingAccountLiquidate");
      }
    }

    if (instructionNames.length > 0) {
      matches.push({
        signature: sigInfo.signature,
        blockTime: sigInfo.blockTime!,
        instructionNames,
        success: !tx.meta?.err,
      });
    }

    const status = tx.meta?.err ? "failed" : "success";
    const time = new Date(sigInfo.blockTime! * 1000).toISOString();
    for (const instruction of instructionNames) {
      activityEvents.push({
        signature: sigInfo.signature,
        time,
        status,
        instruction,
      });
    }
    if (hasJupiter) {
      jupiterTxs.push({
        signature: sigInfo.signature,
        blockTime: sigInfo.blockTime!,
        success: !tx.meta?.err,
      });
      activityEvents.push({
        signature: sigInfo.signature,
        time,
        status,
        instruction: "Jupiter",
      });
    }
    if (hasTitan) {
      titanTxs.push({
        signature: sigInfo.signature,
        blockTime: sigInfo.blockTime!,
        success: !tx.meta?.err,
      });
      activityEvents.push({
        signature: sigInfo.signature,
        time,
        status,
        instruction: "Titan",
      });
    }
  }

  matches.sort((a, b) => b.blockTime - a.blockTime);

  console.log(
    paint(
      `Matched ${matches.length} liquidation txs in the last 30d (wallet signer only).`,
      "cyan",
    ),
  );
  console.log("");
  console.log(paint("Transactions:", "yellow"));
  const txRows = matches.map((match) => {
    const date = new Date(match.blockTime * 1000).toISOString();
    return [
      match.signature,
      date,
      match.success ? paint("success", "green") : paint("failed", "red"),
      match.instructionNames.join(", "),
    ];
  });
  if (txRows.length > 0) {
    printTable(["signature", "time", "status", "instructions"], txRows);
  } else {
    console.log(paint("No matching liquidation transactions.", "dim"));
  }

  const summarize = (windowLabel: keyof typeof windows) => {
    const cutoff = nowSec - windows[windowLabel];
    const inWindow = matches.filter((m) => m.blockTime >= cutoff);
    const success = inWindow.filter((m) => m.success).length;
    const failed = inWindow.length - success;
    return [
      windowLabel,
      inWindow.length.toString(),
      paint(success.toString(), "green"),
      failed ? paint(failed.toString(), "red") : failed.toString(),
    ];
  };
  const summarizeHits = (
    windowLabel: keyof typeof windows,
    label: string,
    hits: { blockTime: number; success: boolean }[],
  ) => {
    const cutoff = nowSec - windows[windowLabel];
    const inWindow = hits.filter((m) => m.blockTime >= cutoff);
    const success = inWindow.filter((m) => m.success).length;
    const failed = inWindow.length - success;
    return [
      label,
      windowLabel,
      inWindow.length.toString(),
      paint(success.toString(), "green"),
      failed ? paint(failed.toString(), "red") : failed.toString(),
    ];
  };

  console.log("");
  console.log(paint("Liquidation counts:", "yellow"));
  printTable(
    ["window", "total", "success", "failed"],
    windowOrder.map((windowLabel) => summarize(windowLabel)),
  );
  console.log("");
  console.log(paint("Jupiter/Titan (any instruction) counts:", "yellow"));
  printTable(
    ["program", "window", "total", "success", "failed"],
    [
      ...windowOrder.map((windowLabel) =>
        summarizeHits(windowLabel, "Jupiter", jupiterTxs),
      ),
      ...windowOrder.map((windowLabel) =>
        summarizeHits(windowLabel, "Titan", titanTxs),
      ),
    ],
  );

  const activityDir = path.join("logs", "activity");
  fs.mkdirSync(activityDir, { recursive: true });
  const safeTimestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const activityPath = path.join(
    activityDir,
    `${config.WALLET.toBase58()}_${safeTimestamp}.json`,
  );
  const activityPayload = {
    wallet: config.WALLET.toBase58(),
    generatedAt: new Date().toISOString(),
    events: activityEvents,
  };
  fs.writeFileSync(activityPath, JSON.stringify(activityPayload, null, 2));
  console.log("");
  console.log(
    paint(
      `Wrote ${activityEvents.length} activity rows to ${activityPath}`,
      "cyan",
    ),
  );
}

main().catch((err) => {
  console.error(err);
});
