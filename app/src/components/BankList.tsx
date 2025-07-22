import { useState, useMemo } from "react";
import type { FetchedBank } from "../services/api";
import { BankItem } from "./BankItem";

interface BankListProps {
  banks: FetchedBank[];
}

export const BankList: React.FC<BankListProps> = ({ banks }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState("");

  const filteredAndSorted = useMemo(() => {
    return banks
      .filter((b) =>
        b.tokenName.toLowerCase().includes(search.trim().toLowerCase())
      )
      .sort((a, b) => a.tokenName.localeCompare(b.tokenName));
  }, [banks, search]);

  return (
    <div className="space-y-4">
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        {collapsed ? "Show Banks" : "Hide Banks"}
      </button>

      {!collapsed && (
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Search by token name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 border rounded"
          />

          <ul className="border rounded divide-y">
            {filteredAndSorted.map((bank) => (
              <BankItem bank={bank} key={bank.bankPubkey.toBase58()} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
