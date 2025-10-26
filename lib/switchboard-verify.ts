// lib/switchboard-verify.ts
import * as sb from "@switchboard-xyz/on-demand";
import { CrossbarClient, FeedHash, type IOracleJob } from "@switchboard-xyz/common";
import { Connection, PublicKey } from "@solana/web3.js";

// Heuristic: base58-ish detector + property-name hints
const BASE58_RE = /[1-9A-HJ-NP-Za-km-z]{32,44}/;

export type VerifyOptions = {
  connection: Connection;
  oraclePubkey: PublicKey | string;
  /** If provided, we will assert the oracle corresponds to this mint (base58). */
  expectedMint?: string;
  /** If provided, we will recompute a canonical feedHash and compare for an exact match. */
  expectedJobsForMint?: IOracleJob[]; // your canonical spec for this mint
  /** Use a custom Crossbar endpoint if you run your own. */
  crossbarUrl?: string;
};

export type VerifyResult = {
  oraclePubkey: string;
  queue: string;
  feedHashHex: string;
  name?: string;
  /** Candidate mints discovered by introspecting the job spec. */
  candidateMintsFromJobs: string[];
  /** true if expectedMint was provided and found among candidates */
  expectedMintFound?: boolean;
  /** true if expectedJobsForMint was provided and recomputed feedHash == on-chain feedHash */
  expectedJobHashMatches?: boolean;
};

/** Load PullFeed on-chain account and Crossbar jobs, then verify. */
export async function verifySwitchboardMint({
  connection,
  oraclePubkey,
  expectedMint,
  expectedJobsForMint,
  crossbarUrl,
}: VerifyOptions): Promise<VerifyResult> {
  const program = await sb.AnchorUtils.loadProgramFromConnection(
    // @ts-ignore - web3 version mismatch between anchor and solana/web3.js
    connection
  );
  const feed = new sb.PullFeed(program, new PublicKey(oraclePubkey));

  // 1) On-chain data (PullFeedAccountData)
  // Includes: queue, feedHash (Uint8Array), name, minResponses, etc.
  const data = await feed.loadData();
  const queue = new PublicKey(data.queue);
  const feedHashHex = Buffer.from(data.feedHash).toString("hex");
  const name = Buffer.from(data.name ?? [])
    .toString("utf8")
    .replace(/\0+$/, "") || undefined;

  // 2) Resolve jobs from Crossbar using feedHash
  // SDK does: crossbar.fetch(feedHashHex).then(resp => resp.jobs)
  const crossbar = crossbarUrl
    ? new CrossbarClient(crossbarUrl, true)
    : CrossbarClient.default();
  const jobs: IOracleJob[] = await feed.loadJobs(crossbar);

  // 3) Extract candidate mints heuristically from the job tree
  const candidateMintsFromJobs = extractCandidateMints(jobs);

  // 4) Optional: recompute canonical feedHash from a known, canonical job spec for a mint
  // Strongest verification: proves the feed uses exactly the job graph you expect.
  let expectedJobHashMatches: boolean | undefined;
  if (expectedJobsForMint?.length) {
    const canonical = FeedHash.compute(queue.toBuffer(), expectedJobsForMint); // 32 bytes
    const canonicalHex = Buffer.from(canonical).toString("hex");
    expectedJobHashMatches = canonicalHex === feedHashHex;
  }

  const expectedMintFound =
    expectedMint != null
      ? candidateMintsFromJobs.some((m) => m === expectedMint)
      : undefined;

  return {
    oraclePubkey: new PublicKey(oraclePubkey).toBase58(),
    queue: queue.toBase58(),
    feedHashHex,
    name,
    candidateMintsFromJobs,
    expectedMintFound,
    expectedJobHashMatches,
  };
}

/** Walk the OracleJob[] and collect fields that look like mints. */
export function extractCandidateMints(jobs: IOracleJob[]): string[] {
  const out = new Set<string>();
  const visit = (node: unknown, keyHint?: string) => {
    if (node == null) return;
    const t = typeof node;
    if (t === "string") {
      const k = (keyHint ?? "").toLowerCase();
      const looksLikeMint = BASE58_RE.test(node);
      const keySuggestsMint =
        k.includes("mint") ||
        k.includes("token") ||
        k.includes("spl") ||
        k.includes("pyth") ||
        k.includes("priceaccount") ||
        k.includes("vault");
      if (looksLikeMint && keySuggestsMint) out.add(node);
      return;
    }
    if (Array.isArray(node)) {
      for (const child of node) visit(child);
      return;
    }
    if (t === "object") {
      for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
        visit(v, k);
      }
    }
  };
  for (const job of jobs) visit(job);
  return [...out];
}
