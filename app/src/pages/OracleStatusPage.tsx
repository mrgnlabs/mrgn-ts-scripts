import React, { useState, useEffect, useRef, useMemo } from "react";
import type { FetchedBank } from "../services/api";
import { commonSetupBrowser, ReadOnlyWallet } from "../lib/commonSetup";
import {
  findPythPushOracleAddress,
  loadSponsoredOracle,
} from "../lib/pyth-oracle-helpers";
import { decodePriceUpdateV2, PriceUpdateV2 } from "../lib/utils_oracle";
import { PublicKey } from "@solana/web3.js";
import {
  PYTH_PUSH_ORACLE_ID,
  PYTH_SPONSORED_SHARD_ID,
} from "../types/constants";

interface OracleStatusPageProps {
  programId: string;
  banks: FetchedBank[];
  error: string | null;
}

interface FeedMeta {
  tokenName: string;
  feedPubkey: PublicKey;
  maxAge: number;
}

interface FeedStatus {
  tokenName: string;
  feedPubkey: string;
  price: number;
  confidence: number;
  publishedAt: Date;
  agePct: number;
}

export function OracleStatusPage({
  programId,
  banks,
  error,
}: OracleStatusPageProps) {
  const [refreshSec, setRefreshSec] = useState<number>(10);
  const [feedMetas, setFeedMetas] = useState<FeedMeta[]>([]);
  const [feedData, setFeedData] = useState<FeedStatus[]>([]);
  // Track exceed counts and worst overages per feed
  const [exceedStats, setExceedStats] = useState<
    Record<string, { count: number; worst: number }>
  >({});
  const statsRef = useRef<Record<string, { count: number; worst: number }>>({});
  const isFetchingRef = useRef(false);

  // Setup connection once
  const connection = useMemo(
    () =>
      commonSetupBrowser(new ReadOnlyWallet(PublicKey.default), programId, "1.4")
        .connection,
    [programId]
  );

  // Build feed metadata once
  useEffect(() => {
    const metas = banks.flatMap((b) => {
      const os = (b.bankAcc.config as any).oracleSetup;
      if ("pythPushOracle" in os) {
        return [
          {
            tokenName: b.tokenName,
            feedPubkey: b.bankAcc.config.oracleKeys[0],
            maxAge: b.bankAcc.config.oracleMaxAge,
          },
        ];
      }
      return [];
    });
    setFeedMetas(metas);
  }, [banks]);

  // Poll feed data
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const fetchFeeds = async () => {
      if (isFetchingRef.current || feedMetas.length === 0) return;
      isFetchingRef.current = true;

      try {
        const nowMs = Date.now();
        const pubkeys = feedMetas.map((m) => m.feedPubkey);
        const infos = await connection.getMultipleAccountsInfo(pubkeys);

        const results: FeedStatus[] = [];
        // copy previous stats
        const newStats = { ...statsRef.current };

        infos.forEach((info, idx) => {
          const meta = feedMetas[idx];
          if (!info) return;
          try {
            const update: PriceUpdateV2 = decodePriceUpdateV2(
              Buffer.from(info.data)
            );
            const msg = update.price_message;

            const factor = 10 ** msg.exponent;
            const price = msg.price.toNumber() * factor;
            const confidence = msg.conf.toNumber() * factor;

            const publishMs = msg.publish_time.toNumber() * 1000;
            const ageSec = (nowMs - publishMs) / 1000;
            const agePct = Math.min((ageSec / meta.maxAge) * 100, 100);

            // update exceed stats
            const excess = ageSec - meta.maxAge;
            if (excess > 0) {
              const key = meta.feedPubkey.toBase58();
              const stat = newStats[key] || { count: 0, worst: 0 };
              stat.count++;
              stat.worst = Math.max(stat.worst, excess);
              newStats[key] = stat;
            }

            results.push({
              tokenName: meta.tokenName,
              feedPubkey: meta.feedPubkey.toBase58(),
              price,
              confidence,
              publishedAt: new Date(publishMs),
              agePct,
            });
          } catch (decodeError) {
            console.warn(
              `Skipping feed ${meta.tokenName}: decode error`,
              decodeError
            );
          }
        });

        // store updated stats
        statsRef.current = newStats;
        setExceedStats(newStats);
        setFeedData(results);
      } finally {
        isFetchingRef.current = false;
        timer = setTimeout(fetchFeeds, refreshSec * 1000);
      }
    };

    fetchFeeds();
    return () => clearTimeout(timer);
  }, [feedMetas, refreshSec, connection]);

  return (
    <div className="text-gray-600">
      <h2 className="text-xl font-bold mb-4">Oracle Status</h2>
      {error && <div className="text-red-600 mb-4">Error: {error}</div>}
      {!error && banks.length === 0 && (
        <div className="text-gray-500">Loading banks…</div>
      )}
      {!error && feedMetas.length === 0 && (
        <div className="text-gray-500">No Pyth oracles found</div>
      )}

      {feedMetas.length > 0 && (
        <div className="space-y-4">
          <label className="block">
            Refresh interval (seconds):
            <input
              type="number"
              min={1}
              value={refreshSec}
              onChange={(e) => setRefreshSec(Number(e.target.value))}
              className="ml-2 w-20 border px-2 py-1 rounded"
            />
          </label>

          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-2 border">Token</th>
                  <th className="px-3 py-2 border">Price</th>
                  <th className="px-3 py-2 border">Confidence</th>
                  <th className="px-3 py-2 border">Published At</th>
                  <th className="px-3 py-2 border">Age</th>
                  <th className="px-3 py-2 border">Exceed Count</th>
                  <th className="px-3 py-2 border">Max Overage (s)</th>
                </tr>
              </thead>
              <tbody>
                {feedData.map((d, idx) => {
                  const stats = exceedStats[d.feedPubkey] || {
                    count: 0,
                    worst: 0,
                  };
                  return (
                    <tr
                      key={`${d.feedPubkey}-${idx}`}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-3 py-1 border">{d.tokenName}</td>
                      <td className="px-3 py-1 border">
                        {d.price.toLocaleString(undefined, {
                          maximumFractionDigits: 8,
                        })}
                      </td>
                      <td className="px-3 py-1 border">
                        ±
                        {d.confidence.toLocaleString(undefined, {
                          maximumFractionDigits: 8,
                        })}
                      </td>
                      <td className="px-3 py-1 border">
                        {d.publishedAt.toLocaleString()}
                      </td>
                      <td className="px-3 py-1 border">
                        <div className="flex items-center space-x-2">
                          <progress
                            className="w-32"
                            value={d.agePct}
                            max={100}
                          />
                          <span>{d.agePct.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="px-3 py-1 border text-center">
                        {stats.count}
                      </td>
                      <td className="px-3 py-1 border text-center">
                        {stats.worst.toFixed(1)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="mt-2 text-gray-500">(Program: {programId})</p>
    </div>
  );
}
