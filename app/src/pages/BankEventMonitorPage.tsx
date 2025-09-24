import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Connection, Logs, PublicKey } from "@solana/web3.js";
import { BorshCoder, EventParser, type Idl } from "@coral-xyz/anchor";
import marginfiIdl from "../../idl/marginfi.json";
import type { FetchedBank } from "../services/api";
import {
  BankEventStats,
  createEmptyBankEventStats,
  type EventTotals,
} from "../types/events";
import { BankEventStatsList } from "../components/BankEventStatsList";
import { formatTokenAmount } from "../lib/format";

const DEFAULT_HTTP_TEMPLATE = "https://mrgn.rpcpool.com/<API_KEY>";
const DEFAULT_WS_TEMPLATE = "wss://mrgn.rpcpool.com/<API_KEY>";

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const applyApiKey = (template: string, apiKey: string) => {
  const trimmed = template.trim();
  if (!trimmed) {
    return apiKey;
  }

  const placeholders = [
    "<API_KEY>",
    "{API_KEY}",
    "${API_KEY}",
    "%API_KEY%",
  ];

  for (const placeholder of placeholders) {
    if (trimmed.includes(placeholder)) {
      const matcher = new RegExp(escapeRegExp(placeholder), "g");
      return trimmed.replace(matcher, apiKey);
    }
  }

  if (/api[-_]?key=\s*$/i.test(trimmed)) {
    return `${trimmed}${encodeURIComponent(apiKey)}`;
  }

  if (trimmed.endsWith("?") || trimmed.endsWith("&")) {
    return `${trimmed}api-key=${encodeURIComponent(apiKey)}`;
  }

  if (trimmed.includes("?")) {
    return `${trimmed}&api-key=${encodeURIComponent(apiKey)}`;
  }

  if (trimmed.endsWith("/")) {
    return `${trimmed}${apiKey}`;
  }

  return `${trimmed}?api-key=${encodeURIComponent(apiKey)}`;
};

const deriveWsTemplate = (httpTemplate: string) => {
  if (httpTemplate.startsWith("https://")) {
    return `wss://${httpTemplate.slice("https://".length)}`;
  }
  if (httpTemplate.startsWith("http://")) {
    return `ws://${httpTemplate.slice("http://".length)}`;
  }
  return DEFAULT_WS_TEMPLATE;
};

const HTTP_TEMPLATE =
  (import.meta.env.VITE_GEYSER_HTTP_URL_TEMPLATE as string | undefined) ??
  DEFAULT_HTTP_TEMPLATE;

const WS_TEMPLATE =
  (import.meta.env.VITE_GEYSER_WS_URL_TEMPLATE as string | undefined) ??
  deriveWsTemplate(HTTP_TEMPLATE);

type EventKind = "deposit" | "withdraw" | "repay" | "borrow";

type MonitorStatus = "idle" | "connecting" | "connected" | "error";

type EventConfig = {
  kind: EventKind;
  trackFlagged?: boolean;
};

const EVENT_MAP: Record<string, EventConfig> = {
  lendingAccountDepositEvent: { kind: "deposit" },
  lendingAccountDeposit: { kind: "deposit" },
  lendingAccountBorrowEvent: { kind: "borrow" },
  lendingAccountBorrow: { kind: "borrow" },
  lendingAccountWithdrawEvent: { kind: "withdraw", trackFlagged: true },
  lendingAccountWithdraw: { kind: "withdraw", trackFlagged: true },
  lendingAccountRepayEvent: { kind: "repay", trackFlagged: true },
  lendingAccountRepay: { kind: "repay", trackFlagged: true },
};

const toBase58 = (value: unknown): string | null => {
  if (!value) {
    return null;
  }

  try {
    if (value instanceof PublicKey) {
      return value.toBase58();
    }

    if (typeof value === "string") {
      return new PublicKey(value).toBase58();
    }

    if (typeof value === "object" && typeof (value as any).toBase58 === "function") {
      return (value as any).toBase58();
    }

    if (value instanceof Uint8Array || Array.isArray(value)) {
      return new PublicKey(value as Uint8Array).toBase58();
    }

    if (typeof value === "object" && value !== null && "toString" in value) {
      return new PublicKey((value as { toString(): string }).toString()).toBase58();
    }
  } catch (error) {
    console.warn("Failed to convert value to PublicKey", error);
  }

  return null;
};

const amountToBigInt = (value: unknown): bigint => {
  if (typeof value === "bigint") {
    return value;
  }

  if (typeof value === "number") {
    return BigInt(Math.floor(value));
  }

  if (typeof value === "string") {
    try {
      return BigInt(value);
    } catch (error) {
      console.warn("Unable to parse amount string", value, error);
      return 0n;
    }
  }

  if (value && typeof value === "object" && "toString" in value) {
    try {
      return BigInt((value as { toString(): string }).toString());
    } catch (error) {
      console.warn("Unable to convert amount via toString", value, error);
      return 0n;
    }
  }

  return 0n;
};

const updateTotals = (
  current: EventTotals,
  amount: bigint,
  flagged: boolean,
  trackFlagged: boolean
): EventTotals => ({
  count: current.count + 1,
  total: trackFlagged && flagged ? current.total : current.total + amount,
  flaggedCount: trackFlagged && flagged
    ? current.flaggedCount + 1
    : current.flaggedCount,
  flaggedTotal: trackFlagged && flagged
    ? current.flaggedTotal + amount
    : current.flaggedTotal,
});

const buildInitialStats = (banks: FetchedBank[]) => {
  const result: Record<string, BankEventStats> = {};
  banks.forEach((bank) => {
    result[bank.bankPubkey.toBase58()] = createEmptyBankEventStats();
  });
  return result;
};

interface BankEventMonitorPageProps {
  banks: FetchedBank[];
  programId: string;
  error?: string | null;
}

interface LastEventSnapshot {
  slot: number;
  kind: EventKind;
  bankKey: string;
  tokenName?: string;
  amount: bigint;
  flagged: boolean;
  timestamp: number;
}

const marginfiIdlTyped = marginfiIdl as Idl;

export function BankEventMonitorPage({
  banks,
  programId,
  error,
}: BankEventMonitorPageProps) {
  const [apiKey, setApiKey] = useState("");
  const [status, setStatus] = useState<MonitorStatus>("idle");
  const [statusError, setStatusError] = useState<string | null>(null);
  const [stats, setStats] = useState<Record<string, BankEventStats>>(() =>
    buildInitialStats(banks)
  );
  const [lastEvent, setLastEvent] = useState<LastEventSnapshot | null>(null);

  const connectionRef = useRef<Connection | null>(null);
  const subscriptionIdRef = useRef<number | null>(null);

  const coder = useMemo(() => new BorshCoder(marginfiIdlTyped), []);
  const parser = useMemo(
    () => new EventParser(new PublicKey(programId), coder),
    [coder, programId]
  );

  const bankByPubkey = useMemo(() => {
    const map = new Map<string, FetchedBank>();
    banks.forEach((bank) => {
      map.set(bank.bankPubkey.toBase58(), bank);
    });
    return map;
  }, [banks]);

  useEffect(() => {
    setStats((previous) => {
      const next: Record<string, BankEventStats> = {};
      banks.forEach((bank) => {
        const key = bank.bankPubkey.toBase58();
        next[key] = previous[key] ?? createEmptyBankEventStats();
      });
      return next;
    });
  }, [banks]);

  const cleanupConnection = useCallback(async () => {
    if (subscriptionIdRef.current !== null && connectionRef.current) {
      try {
        await connectionRef.current.removeOnLogsListener(
          subscriptionIdRef.current
        );
      } catch (cleanupError) {
        console.warn("Failed to remove logs listener", cleanupError);
      }
    }

    subscriptionIdRef.current = null;
    if (connectionRef.current) {
      try {
        // @ts-expect-error accessing private field to close socket explicitly
        connectionRef.current._rpcWebSocket?.close?.();
      } catch (closeError) {
        console.warn("Failed to close websocket", closeError);
      }
    }
    connectionRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      void cleanupConnection();
    };
  }, [cleanupConnection]);

  const handleLogs = useCallback(
    (entry: Logs) => {
      if (!entry.logs?.length) {
        return;
      }

      for (const parsed of parser.parseLogs(entry.logs)) {
        console.log("parsed event name: " + parsed.name);
        console.log("parsed bank maybe: " + (parsed.data as any)?.bank);
        
        const config =
          EVENT_MAP[parsed.name] ??
          EVENT_MAP[parsed.name.replace(/Event$/u, "")];
        if (!config) {
          console.log("not a listed event");
          continue;
        }

        const bankKey = toBase58((parsed.data as any)?.bank);
        if (!bankKey || !bankByPubkey.has(bankKey)) {
          console.log("didnt find bank");
          continue;
        }

        const amount = amountToBigInt((parsed.data as any)?.amount);
        console.log("amount " + amount);
        const flagged = Boolean(
          config.trackFlagged &&
            ((parsed.data as any)?.closeBalance ||
              (parsed.data as any)?.withdrawAll ||
              (parsed.data as any)?.repayAll)
        );

        setStats((current) => {
          const existing = current[bankKey] ?? createEmptyBankEventStats();
          const updated: BankEventStats = {
            ...existing,
            [config.kind]: updateTotals(
              existing[config.kind],
              amount,
              flagged,
              Boolean(config.trackFlagged)
            ),
          };
          return {
            ...current,
            [bankKey]: updated,
          };
        });

        setLastEvent({
          slot: entry.slot,
          kind: config.kind,
          bankKey,
          tokenName: bankByPubkey.get(bankKey)?.tokenName,
          amount,
          flagged,
          timestamp: Date.now(),
        });
      }
    },
    [bankByPubkey, parser]
  );

  const startMonitoring = useCallback(async () => {
    if (status === "connecting" || status === "connected") {
      return;
    }

    const trimmedKey = apiKey.trim();
    if (!trimmedKey) {
      setStatusError("Please provide a Geyser API key.");
      return;
    }

    if (banks.length === 0) {
      setStatusError("Banks are still loading. Try again in a moment.");
      return;
    }

    await cleanupConnection();
    setStatusError(null);
    setStats(buildInitialStats(banks));
    setLastEvent(null);

    const httpEndpoint = applyApiKey(HTTP_TEMPLATE, trimmedKey);
    const wsEndpoint = applyApiKey(WS_TEMPLATE, trimmedKey);

    setStatus("connecting");

    try {
      const connection = new Connection(httpEndpoint, {
        commitment: "confirmed",
        wsEndpoint,
      });
      connectionRef.current = connection;

      const subscriptionId = await connection.onLogs(
        new PublicKey(programId),
        handleLogs,
        "confirmed"
      );

      subscriptionIdRef.current = subscriptionId;
      setStatus("connected");
    } catch (startError) {
      console.error("Failed to subscribe to geyser events", startError);
      await cleanupConnection();
      setStatus("error");
      setStatusError(
        startError instanceof Error
          ? startError.message
          : String(startError)
      );
    }
  }, [
    apiKey,
    banks,
    cleanupConnection,
    handleLogs,
    programId,
    status,
  ]);

  const stopMonitoring = useCallback(async () => {
    if (status === "idle") {
      return;
    }

    await cleanupConnection();
    setStatus("idle");
  }, [cleanupConnection, status]);

  const aggregateCounts = useMemo(() => {
    return Object.values(stats).reduce(
      (acc, bankStats) => {
        acc.deposit += bankStats.deposit.count;
        acc.borrow += bankStats.borrow.count;
        acc.withdraw += bankStats.withdraw.count;
        acc.withdrawFlagged += bankStats.withdraw.flaggedCount;
        acc.repay += bankStats.repay.count;
        acc.repayFlagged += bankStats.repay.flaggedCount;
        return acc;
      },
      {
        deposit: 0,
        borrow: 0,
        withdraw: 0,
        withdrawFlagged: 0,
        repay: 0,
        repayFlagged: 0,
      }
    );
  }, [stats]);

  const lastEventDisplay = useMemo(() => {
    if (!lastEvent) {
      return null;
    }

    const bank = bankByPubkey.get(lastEvent.bankKey);
    const decimals = bank?.bankAcc?.mintDecimals ?? 0;
    const formattedAmount = formatTokenAmount(lastEvent.amount, decimals, {
      maxFractionDigits: 6,
    });

    return `${lastEvent.kind.toUpperCase()} event for ${
      bank?.tokenName ?? lastEvent.bankKey
    } — ${formattedAmount}${
      lastEvent.flagged ? " (withdraw/repay all)" : ""
    } at slot ${lastEvent.slot}`;
  }, [bankByPubkey, lastEvent]);

  const statusLabel = useMemo(() => {
    switch (status) {
      case "idle":
        return "Idle";
      case "connecting":
        return "Connecting to Geyser…";
      case "connected":
        return "Connected";
      case "error":
        return "Error";
      default:
        return status;
    }
  }, [status]);

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h1 className="text-2xl font-semibold">Geyser Event Monitor</h1>
        <p className="text-sm text-gray-600">
          Paste your Geyser API key and press Start to subscribe to marginfi
          lending account events. The monitor listens for deposit, borrow,
          withdraw, and repay events emitted by the program and aggregates them
          by bank.
        </p>
        {error && (
          <p className="text-sm text-red-600">
            Bank data failed to load: {error}
          </p>
        )}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex-1 text-sm">
            <span className="mb-1 block font-medium">Geyser API Key</span>
            <input
              type="text"
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              className="w-full px-3 py-2 border rounded"
              placeholder="Paste your API key"
              disabled={status === "connecting" || status === "connected"}
            />
          </label>
          <div className="flex gap-2">
            <button
              onClick={startMonitoring}
              className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-60"
              disabled={
                status === "connecting" || status === "connected" || !banks.length
              }
            >
              Start Monitoring
            </button>
            <button
              onClick={stopMonitoring}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded disabled:opacity-60"
              disabled={status === "idle"}
            >
              Stop
            </button>
          </div>
        </div>
        <div className="text-sm">
          <span
            className={
              status === "connected"
                ? "text-green-600"
                : status === "error"
                  ? "text-red-600"
                  : "text-gray-600"
            }
          >
            Status: {statusLabel}
          </span>
        </div>
        {statusError && (
          <div className="text-sm text-red-600">{statusError}</div>
        )}
        <div className="text-sm text-gray-600">
          Observed events — Deposits: {aggregateCounts.deposit}, Borrows: {" "}
          {aggregateCounts.borrow}, Withdrawals: {aggregateCounts.withdraw} (
          {aggregateCounts.withdrawFlagged} withdraw-all), Repays: {" "}
          {aggregateCounts.repay} ({aggregateCounts.repayFlagged} repay-all)
        </div>
        {lastEventDisplay && (
          <div className="text-sm text-gray-600">
            Last event: {lastEventDisplay}
          </div>
        )}
      </section>

      <section>
        <BankEventStatsList banks={banks} stats={stats} />
      </section>
    </div>
  );
}
