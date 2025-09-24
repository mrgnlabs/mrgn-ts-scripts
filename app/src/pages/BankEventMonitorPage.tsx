import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Connection, Logs, PublicKey, type Context } from "@solana/web3.js";
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

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const applyApiKey = (template: string, apiKey: string) => {
  const trimmed = template.trim();
  if (!trimmed) {
    return apiKey;
  }

  const placeholders = ["<API_KEY>", "{API_KEY}", "${API_KEY}", "%API_KEY%"];

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

const normalizeEventName = (value: string) =>
  value
    .trim()
    .replace(/Event$/iu, "")
    .replace(/[_\s]/gu, "")
    .toLowerCase();

const EVENT_MAP: Record<string, EventConfig> = {
  lendingaccountdeposit: { kind: "deposit" },
  lendingaccountborrow: { kind: "borrow" },
  lendingaccountwithdraw: { kind: "withdraw", trackFlagged: true },
  lendingaccountrepay: { kind: "repay", trackFlagged: true },
};

const getEventConfig = (eventName: string | undefined | null) =>
  eventName ? EVENT_MAP[normalizeEventName(eventName)] : undefined;

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

    if (
      typeof value === "object" &&
      typeof (value as any).toBase58 === "function"
    ) {
      return (value as any).toBase58();
    }

    if (value instanceof Uint8Array || Array.isArray(value)) {
      return new PublicKey(value as Uint8Array).toBase58();
    }

    if (typeof value === "object" && value !== null && "toString" in value) {
      return new PublicKey(
        (value as { toString(): string }).toString(),
      ).toBase58();
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

const toTimestampMs = (value: unknown): number | null => {
  if (value instanceof Date) {
    return value.getTime();
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return value > 1_000_000_000_000 ? value : value * 1000;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    const numeric = Number(trimmed);
    if (!Number.isNaN(numeric)) {
      return numeric > 1_000_000_000_000 ? numeric : numeric * 1000;
    }

    const parsed = Date.parse(trimmed);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  return null;
};

const readHeaderTimestamp = (header: unknown): number | null => {
  if (!header || typeof header !== "object") {
    return null;
  }

  const record = header as Record<string, unknown>;
  return (
    toTimestampMs(record.timestamp) ??
    toTimestampMs((record as Record<string, unknown>).ts)
  );
};

const extractEventTimestamp = (
  entry: Logs,
  context: Context | undefined,
  data: Record<string, unknown>,
) =>
  readHeaderTimestamp(data.header) ??
  toTimestampMs((entry as unknown as { timestamp?: unknown }).timestamp) ??
  toTimestampMs((context as unknown as { timestamp?: unknown })?.timestamp) ??
  Date.now();

const updateTotals = (
  current: EventTotals,
  amount: bigint,
  flagged: boolean,
  trackFlagged: boolean,
): EventTotals => ({
  count: current.count + 1,
  total: trackFlagged && flagged ? current.total : current.total + amount,
  flaggedCount:
    trackFlagged && flagged ? current.flaggedCount + 1 : current.flaggedCount,
  flaggedTotal:
    trackFlagged && flagged
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
    buildInitialStats(banks),
  );
  const [lastEvent, setLastEvent] = useState<LastEventSnapshot | null>(null);

  const connectionRef = useRef<Connection | null>(null);
  const subscriptionIdRef = useRef<number | null>(null);
  const shouldMaintainConnectionRef = useRef(false);
  const websocketCleanupRef = useRef<(() => void) | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const coder = useMemo(() => new BorshCoder(marginfiIdlTyped), []);
  const parser = useMemo(
    () => new EventParser(new PublicKey(programId), coder),
    [coder, programId],
  );

  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const triggerReconnect = useCallback(() => {
    if (!shouldMaintainConnectionRef.current) {
      return;
    }

    const activeConnection = connectionRef.current as unknown as {
      _rpcWebSocket?: { connect?: () => Promise<void> | void };
    } | null;

    try {
      activeConnection?._rpcWebSocket?.connect?.();
    } catch (error) {
      console.error("Failed to trigger websocket reconnect", error);
    }
  }, []);

  const attachWebSocketKeepAlive = useCallback(
    (connection: Connection) => {
      const socket = (
        connection as unknown as {
          _rpcWebSocket?: {
            on?: (event: string, handler: (...args: any[]) => void) => void;
            off?: (event: string, handler: (...args: any[]) => void) => void;
          } & { connect?: () => Promise<void> | void };
        }
      )._rpcWebSocket;

      if (!socket?.on || !socket?.off) {
        return;
      }

      websocketCleanupRef.current?.();

      const scheduleReconnect = () => {
        if (!shouldMaintainConnectionRef.current) {
          return;
        }

        if (reconnectTimeoutRef.current) {
          return;
        }

        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectTimeoutRef.current = null;
          triggerReconnect();
        }, 1000);
      };

      const handleClose = (code: number) => {
        if (!shouldMaintainConnectionRef.current) {
          return;
        }
        console.warn(
          `Geyser websocket closed (code ${code}). Attempting to reconnect…`,
        );
        scheduleReconnect();
      };

      const handleError = (error: unknown) => {
        if (!shouldMaintainConnectionRef.current) {
          return;
        }
        console.error("Geyser websocket error", error);
      };

      const handleOpen = () => {
        if (!shouldMaintainConnectionRef.current) {
          return;
        }
        clearReconnectTimeout();
        console.log("Geyser websocket connection established.");
      };

      socket.on("close", handleClose);
      socket.on("error", handleError);
      socket.on("open", handleOpen);

      websocketCleanupRef.current = () => {
        socket.off?.("close", handleClose);
        socket.off?.("error", handleError);
        socket.off?.("open", handleOpen);
      };
    },
    [clearReconnectTimeout, triggerReconnect],
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
    shouldMaintainConnectionRef.current = false;
    websocketCleanupRef.current?.();
    websocketCleanupRef.current = null;
    clearReconnectTimeout();
    if (subscriptionIdRef.current !== null && connectionRef.current) {
      try {
        await connectionRef.current.removeOnLogsListener(
          subscriptionIdRef.current,
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
  }, [clearReconnectTimeout]);

  useEffect(() => {
    return () => {
      void cleanupConnection();
    };
  }, [cleanupConnection]);

  const handleLogs = useCallback(
    (entry: Logs, context?: Context) => {
      if (!entry.logs?.length) {
        return;
      }

      for (const parsed of parser.parseLogs(entry.logs)) {
        const config = getEventConfig(parsed.name);
        if (!config) {
          console.debug("Skipping untracked event", parsed.name);
          continue;
        }

        const parsedData = (parsed.data ?? {}) as Record<string, unknown>;
        const bankKey = toBase58(parsedData.bank);
        if (!bankKey || !bankByPubkey.has(bankKey)) {
          console.debug("Skipping event for unknown bank", {
            event: parsed.name,
            bank: parsedData.bank,
          });
          continue;
        }

        const amount = amountToBigInt(parsedData.amount);
        const flagged = Boolean(
          config.trackFlagged &&
            [
              parsedData.closeBalance,
              parsedData.close_balance,
              parsedData.withdrawAll,
              parsedData.withdraw_all,
              parsedData.repayAll,
              parsedData.repay_all,
            ].some(
              (value) =>
                value === true ||
                value === "true" ||
                value === 1 ||
                value === "1",
            ),
        );

        const slot =
          typeof (entry as unknown as { slot?: unknown }).slot === "number"
            ? (entry as unknown as { slot: number }).slot
            : (context?.slot ?? 0);

        const timestamp = extractEventTimestamp(entry, context, parsedData);

        console.log(
          `[${new Date(timestamp).toISOString()}] ${config.kind.toUpperCase()} event for bank ${bankKey} (${amount.toString()} units)${
            flagged ? " (flagged)" : ""
          }`,
        );

        setStats((current) => {
          const existing = current[bankKey] ?? createEmptyBankEventStats();
          const updated: BankEventStats = {
            ...existing,
            [config.kind]: updateTotals(
              existing[config.kind],
              amount,
              flagged,
              Boolean(config.trackFlagged),
            ),
          };
          return {
            ...current,
            [bankKey]: updated,
          };
        });

        setLastEvent({
          slot,
          kind: config.kind,
          bankKey,
          tokenName: bankByPubkey.get(bankKey)?.tokenName,
          amount,
          flagged,
          timestamp,
        });
      }
    },
    [bankByPubkey, parser],
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
      shouldMaintainConnectionRef.current = true;
      attachWebSocketKeepAlive(connection);

      const subscriptionId = await connection.onLogs(
        new PublicKey(programId),
        (logEntry, ctx) => handleLogs(logEntry, ctx),
        "confirmed",
      );

      subscriptionIdRef.current = subscriptionId;
      setStatus("connected");
    } catch (startError) {
      console.error("Failed to subscribe to geyser events", startError);
      await cleanupConnection();
      setStatus("error");
      setStatusError(
        startError instanceof Error ? startError.message : String(startError),
      );
    }
  }, [
    apiKey,
    banks,
    attachWebSocketKeepAlive,
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
      },
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
    <div className="space-y-10 rounded-3xl border border-cyan-500/20 bg-slate-950/95 p-6 text-slate-100 shadow-[0_0_60px_rgba(8,47,73,0.45)] md:p-10">
      <section className="space-y-6">
        <div className="space-y-4">
          <h1 className="text-3xl font-semibold tracking-wide text-cyan-200">
            Geyser Event Monitor
          </h1>
          <p className="max-w-3xl text-sm leading-relaxed text-slate-400">
            Paste your Geyser API key and press Start to subscribe to marginfi
            lending account events. The monitor listens for deposit, borrow,
            withdraw, and repay events emitted by the program and aggregates
            them by bank in real-time.
          </p>
          {error && (
            <p className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              Bank data failed to load: {error}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <label className="flex-1 text-sm text-slate-300">
            <span className="mb-2 block font-semibold uppercase tracking-widest text-cyan-200">
              Geyser API Key
            </span>
            <input
              type="text"
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              className="w-full rounded-2xl border border-cyan-500/30 bg-slate-900/60 px-4 py-3 font-mono text-cyan-100 shadow-inner outline-none transition focus:border-pink-500/60 focus:ring-2 focus:ring-pink-500/30"
              placeholder="Paste your API key"
              disabled={status === "connecting" || status === "connected"}
            />
          </label>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={startMonitoring}
              className="rounded-full bg-gradient-to-r from-cyan-500/80 via-pink-500/70 to-orange-400/80 px-6 py-2 text-sm font-semibold uppercase tracking-wide text-slate-950 shadow-lg transition hover:from-cyan-400 hover:via-pink-400 hover:to-orange-300 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={
                status === "connecting" ||
                status === "connected" ||
                !banks.length
              }
            >
              Start Monitoring
            </button>
            <button
              onClick={stopMonitoring}
              className="rounded-full border border-slate-700/70 bg-slate-900/60 px-6 py-2 text-sm font-semibold uppercase tracking-wide text-slate-200 shadow-inner transition hover:border-pink-400/60 hover:text-pink-200 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={status === "idle"}
            >
              Stop
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm">
          <span className="rounded-full border border-slate-800/70 bg-slate-900/60 px-4 py-2 font-semibold uppercase tracking-widest text-slate-300">
            Status:
            <span
              className={`ml-2 rounded-full px-3 py-1 text-xs font-semibold ${
                status === "connected"
                  ? "bg-cyan-500/20 text-cyan-200"
                  : status === "error"
                    ? "bg-red-500/20 text-red-200"
                    : status === "connecting"
                      ? "bg-orange-500/20 text-orange-200"
                      : "bg-slate-700/60 text-slate-300"
              }`}
            >
              {statusLabel}
            </span>
          </span>
          {statusError && (
            <span className="text-sm text-red-200">{statusError}</span>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-cyan-500/30 bg-slate-900/60 p-4 shadow-inner">
            <p className="text-xs uppercase tracking-wide text-slate-400">Deposits</p>
            <p className="mt-2 font-mono text-2xl text-cyan-300">
              {aggregateCounts.deposit.toLocaleString()}
            </p>
            <p className="text-[0.7rem] text-slate-500">events observed</p>
          </div>
          <div className="rounded-2xl border border-orange-500/30 bg-slate-900/60 p-4 shadow-inner">
            <p className="text-xs uppercase tracking-wide text-slate-400">Borrows</p>
            <p className="mt-2 font-mono text-2xl text-orange-300">
              {aggregateCounts.borrow.toLocaleString()}
            </p>
            <p className="text-[0.7rem] text-slate-500">events observed</p>
          </div>
          <div className="rounded-2xl border border-pink-500/30 bg-slate-900/60 p-4 shadow-inner">
            <p className="text-xs uppercase tracking-wide text-slate-400">Withdrawals</p>
            <p className="mt-2 font-mono text-2xl text-pink-300">
              {aggregateCounts.withdraw.toLocaleString()}
            </p>
            <p className="text-[0.7rem] text-slate-500">
              {aggregateCounts.withdrawFlagged.toLocaleString()} withdraw-all
            </p>
          </div>
          <div className="rounded-2xl border border-blue-500/30 bg-slate-900/60 p-4 shadow-inner">
            <p className="text-xs uppercase tracking-wide text-slate-400">Repays</p>
            <p className="mt-2 font-mono text-2xl text-blue-300">
              {aggregateCounts.repay.toLocaleString()}
            </p>
            <p className="text-[0.7rem] text-slate-500">
              {aggregateCounts.repayFlagged.toLocaleString()} repay-all
            </p>
          </div>
        </div>

        {lastEventDisplay && (
          <div className="rounded-3xl border border-cyan-500/30 bg-gradient-to-r from-cyan-500/20 via-slate-900/60 to-pink-500/20 px-5 py-4 text-sm text-slate-200 shadow-lg">
            <span className="font-semibold uppercase tracking-widest text-cyan-200">
              Last event
            </span>
            <div className="mt-2 text-slate-100">{lastEventDisplay}</div>
          </div>
        )}
      </section>

      <section>
        <BankEventStatsList banks={banks} stats={stats} />
      </section>
    </div>
  );
}
