import { useMemo, useState } from "react";
import type { FetchedBank } from "../services/api";
import type { BankEventStats, EventTotals } from "../types/events";
import { createEmptyBankEventStats } from "../types/events";
import { formatTokenAmount } from "../lib/format";

interface BankEventStatsListProps {
  banks: FetchedBank[];
  stats: Record<string, BankEventStats>;
}

const formatAccumulatedAmount = (value: bigint, decimals: number) =>
  formatTokenAmount(value, decimals, { fractionDigits: 4 });

const formatFlaggedAmount = (stat: EventTotals, decimals: number) =>
  stat.flaggedCount > 0
    ? formatTokenAmount(stat.flaggedTotal, decimals, { fractionDigits: 4 })
    : "0.0000";

interface StatTileProps {
  label: string;
  amount: string;
  count: number;
  accentClass: string;
  rawValue?: string;
  className?: string;
}

const StatTile: React.FC<StatTileProps> = ({
  label,
  amount,
  count,
  accentClass,
  rawValue,
  className,
}) => (
  <div
    className={`rounded-2xl border border-slate-800/60 bg-slate-950/60 p-4 shadow-inner transition duration-300 hover:border-cyan-400/40 ${className ?? ""}`}
  >
    <div className="flex items-center justify-between text-[0.7rem] uppercase tracking-wide text-slate-400">
      <span>{label}</span>
      <span className="text-slate-500">
        {count} {count === 1 ? "event" : "events"}
      </span>
    </div>
    <div className="mt-3 flex items-end justify-between gap-3">
      <span
        className={`min-w-[15ch] text-right font-mono text-lg leading-none ${accentClass}`}
      >
        {amount}
      </span>
    </div>
    {rawValue && (
      <div className="mt-3 break-all text-[0.65rem] font-mono text-slate-500">
        raw: {rawValue}
      </div>
    )}
  </div>
);

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
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => setCollapsed((current) => !current)}
          className="rounded-full border border-cyan-500/40 bg-cyan-500/10 px-5 py-2 text-sm font-semibold text-cyan-200 shadow-md transition hover:border-pink-400/50 hover:text-pink-200"
        >
          {collapsed ? "Show Banks" : "Hide Banks"}
        </button>

        <span className="text-xs uppercase tracking-[0.2em] text-slate-500">
          {filteredBanks.length} bank{filteredBanks.length === 1 ? "" : "s"}
        </span>
      </div>

      {!collapsed && (
        <div className="space-y-6">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex w-10 items-center justify-center text-cyan-400">
              🔍
            </div>
            <input
              type="text"
              placeholder="Search by token name…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-2xl border border-slate-800/70 bg-slate-900/60 px-12 py-3 text-sm text-slate-100 shadow-inner outline-none transition focus:border-pink-500/60 focus:ring-2 focus:ring-pink-500/30"
            />
          </div>

          {filteredBanks.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-700/60 bg-slate-900/60 p-8 text-center text-sm text-slate-400">
              No banks match your search.
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filteredBanks.map((bank) => {
                const key = bank.bankPubkey.toBase58();
                const bankStats = stats[key] ?? createEmptyBankEventStats();
                const decimals = bank.bankAcc?.mintDecimals ?? 0;
                const totalEvents =
                  bankStats.deposit.count +
                  bankStats.borrow.count +
                  bankStats.withdraw.count +
                  bankStats.repay.count;

                return (
                  <div
                    key={key}
                    className="group relative overflow-hidden rounded-3xl border border-cyan-500/30 bg-slate-900/70 p-5 shadow-[0_12px_40px_rgba(8,47,73,0.35)] transition duration-300 hover:-translate-y-1 hover:border-pink-400/50"
                  >
                    <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100">
                      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/15 via-transparent to-pink-500/20" />
                    </div>
                    <div className="relative space-y-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-semibold tracking-wide text-cyan-200">
                            {bank.tokenName}
                          </h3>
                          <div className="mt-1 break-all font-mono text-[0.7rem] text-slate-500">
                            {key}
                          </div>
                        </div>
                        <span className="rounded-full border border-pink-500/40 bg-pink-500/10 px-3 py-1 text-[0.65rem] uppercase tracking-widest text-pink-200">
                          {totalEvents} evt
                        </span>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <StatTile
                          label="Deposits"
                          amount={formatAccumulatedAmount(
                            bankStats.deposit.total,
                            decimals,
                          )}
                          count={bankStats.deposit.count}
                          accentClass="text-cyan-300"
                          rawValue={
                            bankStats.deposit.total !== 0n
                              ? bankStats.deposit.total.toString()
                              : undefined
                          }
                        />
                        <StatTile
                          label="Borrows"
                          amount={formatAccumulatedAmount(
                            bankStats.borrow.total,
                            decimals,
                          )}
                          count={bankStats.borrow.count}
                          accentClass="text-orange-300"
                          rawValue={
                            bankStats.borrow.total !== 0n
                              ? bankStats.borrow.total.toString()
                              : undefined
                          }
                        />
                        <StatTile
                          label="Withdrawals"
                          amount={formatAccumulatedAmount(
                            bankStats.withdraw.total,
                            decimals,
                          )}
                          count={bankStats.withdraw.count}
                          accentClass="text-pink-300"
                          rawValue={
                            bankStats.withdraw.total !== 0n
                              ? bankStats.withdraw.total.toString()
                              : undefined
                          }
                        />
                        <StatTile
                          label="Repays"
                          amount={formatAccumulatedAmount(
                            bankStats.repay.total,
                            decimals,
                          )}
                          count={bankStats.repay.count}
                          accentClass="text-blue-300"
                          rawValue={
                            bankStats.repay.total !== 0n
                              ? bankStats.repay.total.toString()
                              : undefined
                          }
                        />
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <StatTile
                          label="Withdraw All*"
                          amount={formatFlaggedAmount(
                            bankStats.withdraw,
                            decimals,
                          )}
                          count={bankStats.withdraw.flaggedCount}
                          accentClass="text-pink-200"
                          rawValue={
                            bankStats.withdraw.flaggedCount > 0
                              ? bankStats.withdraw.flaggedTotal.toString()
                              : undefined
                          }
                          className="hover:border-pink-400/60"
                        />
                        <StatTile
                          label="Repay All*"
                          amount={formatFlaggedAmount(
                            bankStats.repay,
                            decimals,
                          )}
                          count={bankStats.repay.flaggedCount}
                          accentClass="text-orange-200"
                          rawValue={
                            bankStats.repay.flaggedCount > 0
                              ? bankStats.repay.flaggedTotal.toString()
                              : undefined
                          }
                          className="hover:border-orange-400/60"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <p className="text-xs text-slate-500">
            * Withdraw All / Repay All events are tracked separately because the
            reported amount may not reflect the final settled amount.
          </p>
        </div>
      )}
    </div>
  );
};
