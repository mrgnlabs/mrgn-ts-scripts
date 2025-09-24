import { useMemo, useState } from "react";
import type { FetchedBank } from "../services/api";
import type { BankEventStats, EventTotals } from "../types/events";
import { createEmptyBankEventStats } from "../types/events";
import { formatTokenAmount } from "../lib/format";

interface BankEventStatsListProps {
  banks: FetchedBank[];
  stats: Record<string, BankEventStats>;
}

const renderPrimary = (stat: EventTotals, decimals: number) => (
  <div className="space-y-1">
    <div className="font-mono text-sm">
      {formatTokenAmount(stat.total, decimals)}
    </div>
    <div className="text-xs text-gray-500">
      {stat.count} {stat.count === 1 ? "event" : "events"}
    </div>
    {stat.total !== 0n && (
      <div className="text-[0.65rem] text-gray-400 font-mono">
        raw: {stat.total.toString()}
      </div>
    )}
  </div>
);

const renderFlagged = (stat: EventTotals, decimals: number) => (
  <div className="space-y-1">
    <div className="font-mono text-sm">
      {stat.flaggedCount > 0
        ? formatTokenAmount(stat.flaggedTotal, decimals)
        : "0"}
    </div>
    <div className="text-xs text-gray-500">
      {stat.flaggedCount} {stat.flaggedCount === 1 ? "event" : "events"}
    </div>
    {stat.flaggedCount > 0 && (
      <div className="text-[0.65rem] text-gray-400 font-mono">
        raw: {stat.flaggedTotal.toString()}
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
    <div className="space-y-4">
      <button
        onClick={() => setCollapsed((current) => !current)}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        {collapsed ? "Show Banks" : "Hide Banks"}
      </button>

      {!collapsed && (
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Search by token name…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full px-3 py-2 border rounded"
          />

          <div className="overflow-x-auto">
            <table className="min-w-full border rounded bg-white">
              <thead className="bg-gray-100 text-left text-xs uppercase tracking-wide text-gray-600">
                <tr>
                  <th className="px-3 py-2">Token</th>
                  <th className="px-3 py-2">Deposits</th>
                  <th className="px-3 py-2">Borrows</th>
                  <th className="px-3 py-2">Withdrawals</th>
                  <th className="px-3 py-2">Withdraw All*</th>
                  <th className="px-3 py-2">Repays</th>
                  <th className="px-3 py-2">Repay All*</th>
                </tr>
              </thead>
              <tbody>
                {filteredBanks.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-3 py-6 text-center text-sm text-gray-500"
                    >
                      No banks match your search.
                    </td>
                  </tr>
                )}

                {filteredBanks.map((bank) => {
                  const key = bank.bankPubkey.toBase58();
                  const bankStats = stats[key] ?? createEmptyBankEventStats();
                  const decimals = bank.bankAcc?.mintDecimals ?? 0;

                  return (
                    <tr key={key} className="border-t">
                      <td className="px-3 py-2 font-medium text-sm">
                        <div>{bank.tokenName}</div>
                        <div className="text-xs text-gray-500 font-mono">
                          {key}
                        </div>
                      </td>
                      <td className="px-3 py-2 align-top">
                        {renderPrimary(bankStats.deposit, decimals)}
                      </td>
                      <td className="px-3 py-2 align-top">
                        {renderPrimary(bankStats.borrow, decimals)}
                      </td>
                      <td className="px-3 py-2 align-top">
                        {renderPrimary(bankStats.withdraw, decimals)}
                      </td>
                      <td className="px-3 py-2 align-top">
                        {renderFlagged(bankStats.withdraw, decimals)}
                      </td>
                      <td className="px-3 py-2 align-top">
                        {renderPrimary(bankStats.repay, decimals)}
                      </td>
                      <td className="px-3 py-2 align-top">
                        {renderFlagged(bankStats.repay, decimals)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-gray-500">
            * Withdraw All / Repay All events are tracked separately because the
            reported amount may not reflect the final settled amount.
          </p>
        </div>
      )}
    </div>
  );
};
