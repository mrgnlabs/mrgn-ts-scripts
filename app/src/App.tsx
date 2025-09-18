import React, { useState, useEffect } from "react";
import { BankInfoPage } from "./pages/BankInfoPage";
import { OracleStatusPage } from "./pages/OracleStatusPage";
import { loadBanks, FetchedBank } from "./services/api";

// Shared program ID for all pages
export const PROGRAM_ID = "MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA";

export type Page = "bank" | "oracle";

export default function App() {
  const [page, setPage] = useState<Page>("bank");

  // Load banks once at app startup
  const [banks, setBanks] = useState<FetchedBank[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const list = await loadBanks(PROGRAM_ID);
        setBanks(list);
      } catch (err: any) {
        setError(err.message || "Failed to load banks");
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex space-x-4">
            <button
              onClick={() => setPage("bank")}
              className={`py-2 px-3 font-medium rounded-t ${
                page === "bank"
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 hover:bg-gray-200"
              }`}
            >
              Bank Info
            </button>
            <button
              onClick={() => setPage("oracle")}
              className={`py-2 px-3 font-medium rounded-t ${
                page === "oracle"
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 hover:bg-gray-200"
              }`}
            >
              Oracle Status
            </button>
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <main className="max-w-6xl mx-auto p-4">
        {page === "bank" && <BankInfoPage banks={banks}/>}
        {page === "oracle" && (
          <OracleStatusPage
            programId={PROGRAM_ID}
            banks={banks}
            error={error}
          />
        )}
      </main>
    </div>
  );
}
