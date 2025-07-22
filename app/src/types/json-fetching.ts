/** List of banks */
export const JSON_URL =
  "https://storage.googleapis.com/mrgn-public/mrgn-bank-metadata-cache.json";

/** When fetching multiple accounts, this is the max per fetch */
export const CHUNK_SIZE = 100;

/** How entries are returned from the endpoint */
export type PoolEntry = {
  bankAddress: string;
  validatorVoteAccount: string;
  tokenAddress: string;
  tokenName: string;
  tokenSymbol: string;
};
