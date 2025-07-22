import { PublicKey } from "@solana/web3.js";
import { chunk } from "../lib/utils";
import { commonSetupBrowser, ReadOnlyWallet } from "../lib/commonSetup";
import { ASSET_TAG_STAKED } from "../types/constants";
import { PoolEntry, JSON_URL, CHUNK_SIZE } from "../types/json-fetching";

export async function fetchPoolEntries(): Promise<PoolEntry[]> {
  const resp = await fetch(JSON_URL);
  if (!resp.ok) throw new Error(`Failed to fetch JSON: ${resp.statusText}`);
  return resp.json();
}

export type FetchedBank = {
  bankPubkey: PublicKey;
  mintPubkey: PublicKey;
  tokenName: string;
  /** This is a `Awaited<ReturnType<typeof program.account.bank.fetch>>` */
  bankAcc: any;
};

export async function loadBanks(
  programId: string,
  walletPubkey?: string
): Promise<FetchedBank[]> {
  const wallet = new ReadOnlyWallet(
    walletPubkey ? new PublicKey(walletPubkey) : PublicKey.default
  );
  const { program } = commonSetupBrowser(wallet, programId);

  const pools = await fetchPoolEntries();
  const all = pools.map((p) => ({
    bankPubkey: new PublicKey(p.bankAddress),
    mintPubkey: new PublicKey(p.tokenAddress),
    tokenName: p.tokenName,
  }));

  const out: FetchedBank[] = [];
  let ignored = 0;
  const batches = chunk(all, CHUNK_SIZE);

  for (const batch of batches) {
    const keys = batch.map((b) => b.bankPubkey);
    const accounts = await program.account.bank.fetchMultiple(keys);
    accounts.forEach((acc, idx) => {
      if (!acc) return;
      if (acc.config.assetTag === ASSET_TAG_STAKED) {
        ignored++;
        return;
      }
      out.push({
        bankPubkey: batch[idx].bankPubkey,
        mintPubkey: batch[idx].mintPubkey,
        tokenName: batch[idx].tokenName,
        bankAcc: acc,
      });
    });
  }

  console.log(`Ignored ${ignored} staked banks`);
  return out;
}
