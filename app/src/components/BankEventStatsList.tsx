import { useMemo, useState } from "react";
import type { FetchedBank } from "../services/api";
import type { BankEventStats, EventTotals } from "../types/events";
import { createEmptyBankEventStats } from "../types/events";
import { formatTokenAmountFixed } from "../lib/format";

interface BankEventStatsListProps {
  banks: FetchedBank[];
  stats: Record<string, BankEventStats>;
}

interface StatPanelProps {
  label: string;
  totals: EventTotals;
  decimals: number;
  accentClass: string;
  flaggedLabel?: string;
}

const StatPanel: React.FC<StatPanelProps> = ({
  label,
  totals,
  decimals,
  accentClass,
  flaggedLabel,
}) => {
  const eventLabel = totals.count === 1 ? "event" : "events";
  const flaggedEventLabel =
    totals.flaggedCount === 1 ? "event" : "events";
  const flaggedSummary = flaggedLabel
    ? totals.flaggedCount > 0
      ? `${flaggedLabel}: ${formatTokenAmountFixed(
          totals.flaggedTotal,
          decimals,
        )} • ${totals.flaggedCount.toLocaleString()} ${flaggedEventLabel}`
      : `${flaggedLabel}: none`
    : null;

  return (
    <div className="rounded-xl border border-cyan-500/10 bg-slate-950/40 p-4 shadow-[0_0_20px_rgba(14,165,233,0.15)] transition-transform duration-200 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(236,72,153,0.25)]">
      <div
        className={`text-xs font-semibold uppercase tracking-[0.2em] ${accentClass}`}
      >
        {label}
      </div>
      <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="font-mono text-lg text-cyan-50 tabular-nums min-w-[15ch]">
          {formatTokenAmountFixed(totals.total, decimals)}
        </span>
        <span className="text-xs text-cyan-200/70">
          {totals.count.toLocaleString()} {eventLabel}
        </span>
      </div>
      {flaggedSummary && (
        <div className="mt-2 text-xs text-orange-200/80">{flaggedSummary}</div>
      )}
    </div>
  );
};

export const BankEventStatsList: React.FC<BankEventStatsListProps> = ({
  banks,
  stats,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState("");

  const filteredBanks = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return banks
      .filter((bank) =>
        bank.tokenName.toLowerCase().includes(normalizedSearch)
      )
      .sort((a, b) => a.tokenName.localeCompare(b.tokenName));
  }, [banks, search]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          onClick={() => setCollapsed((current) => !current)}
          className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-cyan-500/90 via-blue-500/80 to-pink-500/80 px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-pink-500/20 transition hover:-translate-y-0.5 hover:shadow-pink-500/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-300/60"
        >
          {collapsed ? "Show Banks" : "Hide Banks"}
        </button>

        {!collapsed && (
          <input
            type="text"
            placeholder="Search by token name…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-xl border border-cyan-500/30 bg-slate-950/60 px-3 py-2 text-sm text-cyan-100 placeholder:text-cyan-200/40 focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-400/40 sm:max-w-xs"
          />
        )}
      </div>

      {!collapsed && (
        <div className="space-y-5">
          {filteredBanks.length === 0 ? (
            <div className="rounded-2xl border border-pink-500/30 bg-slate-950/40 p-6 text-center text-sm text-pink-200/80">
              No banks match your search.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredBanks.map((bank) => {
                const key = bank.bankPubkey.toBase58();
                const bankStats = stats[key] ?? createEmptyBankEventStats();
                const decimals = bank.bankAcc?.mintDecimals ?? 0;

                return (
                  <div
                    key={key}
                    className="group relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-slate-950/60 p-5 shadow-[0_0_30px_rgba(14,165,233,0.15)] transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_0_45px_rgba(236,72,153,0.35)]"
                  >
                    <div className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-pink-200">
                          {bank.tokenName}
                        </h3>
                        <p className="mt-1 break-all font-mono text-[0.65rem] text-cyan-200/60">
                          {key}
                        </p>
                      </div>
                      <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-widest text-cyan-200/80">
                        {decimals} dec
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3">
                      <StatPanel
                        label="Deposits"
                        totals={bankStats.deposit}
                        decimals={decimals}
                        accentClass="text-cyan-300"
                      />
                      <StatPanel
                        label="Borrows"
                        totals={bankStats.borrow}
                        decimals={decimals}
                        accentClass="text-blue-300"
                      />
                      <StatPanel
                        label="Withdrawals"
                        totals={bankStats.withdraw}
                        decimals={decimals}
                        accentClass="text-pink-300"
                        flaggedLabel="Withdraw All"
                      />
                      <StatPanel
                        label="Repays"
                        totals={bankStats.repay}
                        decimals={decimals}
                        accentClass="text-orange-300"
                        flaggedLabel="Repay All"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <p className="text-xs text-cyan-200/60">
            * Withdraw All / Repay All events are tracked separately because the
            reported amount may not reflect the final settled amount.
          </p>
        </div>
      )}
    </div>
  );
};
