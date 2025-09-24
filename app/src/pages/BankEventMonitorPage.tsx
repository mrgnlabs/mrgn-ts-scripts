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
import { formatTokenAmountFixed } from "../lib/format";

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

  const lastEventDetails = useMemo(() => {
    if (!lastEvent) {
      return null;
    }

    const bank = bankByPubkey.get(lastEvent.bankKey);
    const decimals = bank?.bankAcc?.mintDecimals ?? 0;

    return {
      kind: lastEvent.kind,
      kindLabel: lastEvent.kind.toUpperCase(),
      bankLabel: bank?.tokenName ?? lastEvent.bankKey,
      bankKey: lastEvent.bankKey,
      amount: formatTokenAmountFixed(lastEvent.amount, decimals),
      flagged: lastEvent.flagged,
      slot: lastEvent.slot,
      timestampText: new Date(lastEvent.timestamp).toLocaleString(),
    };
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

  const statusTone = useMemo(() => {
    switch (status) {
      case "connected":
        return "bg-cyan-500/20 text-cyan-200 ring-1 ring-cyan-500/40";
      case "connecting":
        return "bg-orange-500/20 text-orange-200 ring-1 ring-orange-500/40";
      case "error":
        return "bg-pink-500/20 text-pink-200 ring-1 ring-pink-500/40";
      default:
        return "bg-slate-900/60 text-cyan-200 ring-1 ring-slate-700/60";
    }
  }, [status]);

  const observedSummaries = useMemo(() => {
    const withdrawDetail =
      aggregateCounts.withdrawFlagged > 0
        ? `${aggregateCounts.withdrawFlagged.toLocaleString()} withdraw-all`
        : "No withdraw-all events";
    const repayDetail =
      aggregateCounts.repayFlagged > 0
        ? `${aggregateCounts.repayFlagged.toLocaleString()} repay-all`
        : "No repay-all events";

    return [
      {
        key: "deposits",
        label: "Deposits",
        value: aggregateCounts.deposit,
        detail: "Events observed",
        accent: "from-cyan-400/60 via-blue-500/40 to-transparent",
      },
      {
        key: "borrows",
        label: "Borrows",
        value: aggregateCounts.borrow,
        detail: "Events observed",
        accent: "from-blue-400/60 via-cyan-500/30 to-transparent",
      },
      {
        key: "withdraws",
        label: "Withdrawals",
        value: aggregateCounts.withdraw,
        detail: withdrawDetail,
        accent: "from-pink-400/60 via-orange-400/30 to-transparent",
      },
      {
        key: "repays",
        label: "Repays",
        value: aggregateCounts.repay,
        detail: repayDetail,
        accent: "from-orange-400/60 via-pink-500/30 to-transparent",
      },
    ];
  }, [aggregateCounts]);

  return (
    <div className="relative isolate overflow-hidden rounded-3xl border border-cyan-500/30 bg-slate-950/80 px-6 py-8 text-cyan-100 shadow-[0_0_55px_rgba(14,165,233,0.25)] sm:px-10">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-36 right-0 h-64 w-64 rounded-full bg-pink-500/25 blur-[140px]" />
        <div className="absolute bottom-0 -left-24 h-72 w-72 rounded-full bg-cyan-500/25 blur-[160px]" />
      </div>
      <div className="relative z-10 space-y-10">
        <section className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-transparent bg-gradient-to-r from-cyan-300 via-pink-400 to-orange-300 bg-clip-text">
              Geyser Event Monitor
            </h1>
            <p className="max-w-3xl text-sm text-cyan-100/70">
              Paste your Geyser API key and press Start to subscribe to marginfi
              lending account events. The monitor listens for deposit, borrow,
              withdraw, and repay events emitted by the program and aggregates
              them by bank in real time.
            </p>
          </div>

          {error && (
            <div className="rounded-xl border border-pink-500/40 bg-pink-500/10 px-4 py-3 text-sm text-pink-100">
              Bank data failed to load: {error}
            </div>
          )}

          <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
            <label className="flex-1 text-sm">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300/80">
                Geyser API Key
              </span>
              <input
                type="text"
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
                className="w-full rounded-xl border border-cyan-500/40 bg-slate-900/70 px-3 py-2 font-mono text-sm text-cyan-100 placeholder:text-cyan-200/30 focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-400/50 disabled:cursor-not-allowed disabled:opacity-60"
                placeholder="Paste your API key"
                disabled={status === "connecting" || status === "connected"}
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={startMonitoring}
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-pink-500 px-5 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/40 transition hover:-translate-y-0.5 hover:shadow-pink-500/40 disabled:cursor-not-allowed disabled:opacity-60"
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
                className="inline-flex items-center justify-center rounded-full border border-pink-400/40 bg-slate-900/70 px-5 py-2 text-sm font-semibold text-pink-200 transition hover:border-pink-300 hover:text-pink-100 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={status === "idle"}
              >
                Stop
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] ${statusTone} ${status === "connecting" ? "animate-pulse" : ""}`}
            >
              <span className="h-2 w-2 rounded-full bg-current" />
              {statusLabel}
            </span>
            {statusError && (
              <span className="text-pink-200/80">{statusError}</span>
            )}
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-200/70">
              Observed Events
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {observedSummaries.map((summary) => (
                <div
                  key={summary.key}
                  className="relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-slate-900/70 p-4 shadow-[0_0_25px_rgba(14,165,233,0.2)]"
                >
                  <div
                    className={`pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${summary.accent}`}
                  />
                  <div className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-200/70">
                    {summary.label}
                  </div>
                  <div className="mt-3 text-2xl font-semibold text-cyan-100 tabular-nums">
                    {summary.value.toLocaleString()}
                  </div>
                  <div className="mt-1 text-xs text-cyan-200/60">
                    {summary.detail}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {lastEventDetails && (
            <div className="rounded-2xl border border-pink-500/30 bg-slate-900/70 p-5 shadow-[0_0_35px_rgba(236,72,153,0.25)]">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-[0.3em] text-pink-300">
                    Latest Event
                  </div>
                  <div className="text-lg font-semibold text-cyan-100">
                    {lastEventDetails.kindLabel} for {lastEventDetails.bankLabel}
                  </div>
                  <div className="text-xs text-cyan-200/70">
                    Slot {lastEventDetails.slot.toLocaleString()} •{" "}
                    {lastEventDetails.timestampText}
                  </div>
                  <div className="font-mono text-[0.65rem] text-cyan-200/50">
                    {lastEventDetails.bankKey}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 text-right">
                  <span className="font-mono text-2xl text-pink-200 tabular-nums min-w-[15ch]">
                    {lastEventDetails.amount}
                  </span>
                  {lastEventDetails.flagged ? (
                    <span className="text-xs text-orange-300">
                      Withdraw/Repay All flagged
                    </span>
                  ) : (
                    <span className="text-xs text-cyan-200/60">
                      Standard event
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-200/70">
              Bank Totals
            </h2>
            <p className="mt-1 text-xs text-cyan-200/50">
              Banks are listed alphabetically. Use the search to quickly jump to
              a specific token.
            </p>
          </div>
          <BankEventStatsList banks={banks} stats={stats} />
        </section>
      </div>
    </div>
  );

}
