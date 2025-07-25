import * as fs from "fs";
import path from "path";
import dotenv from "dotenv";
import BigNumber from "bignumber.js";
import { Keypair, PublicKey, Transaction, VersionedTransaction } from "@solana/web3.js";
import { groupedNumberFormatterDyn, Wallet, wrappedI80F48toBigNumber } from "@mrgnlabs/mrgn-common";
import { AccountCache, BankMetadata, BirdeyeTokenMetadataResponse, BirdeyePriceResponse } from "./types";
import { PYTH_PUSH_ORACLE_ID, PYTH_SPONSORED_SHARD_ID, MARGINFI_SPONSORED_SHARD_ID } from "./constants";
import { Environment, MarginfiAccountRaw } from "@mrgnlabs/marginfi-client-v2";

dotenv.config();

export function loadKeypairFromFile(filePath: string): Keypair {
  const keyData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  return Keypair.fromSecretKey(new Uint8Array(keyData));
}

export function formatNumber(num: number | BigNumber): string {
  const value = typeof num === "number" ? new BigNumber(num) : num;
  if (value.eq(0)) return "0";
  if (value.lt(1)) return value.toString();
  return groupedNumberFormatterDyn.format(value.toNumber());
}

export function getCachedAccounts(): PublicKey[] {
  const CACHE_FILE = path.join(__dirname, "../account-cache.json");

  if (!fs.existsSync(CACHE_FILE)) {
    throw new Error("Account cache not found. Please run 'pnpm accounts:cache' first.");
  }

  const cache: AccountCache = JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8"));
  const accounts = cache.accounts.map((addr) => new PublicKey(addr));
  return accounts.sort(() => Math.random() - 0.5);
}

export function getCachedActivity(): Record<string, any[]> {
  const CACHE_FILE = path.join(__dirname, "../activity-cache.json");

  if (!fs.existsSync(CACHE_FILE)) {
    throw new Error("Activity cache not found. Please run 'pnpm activity:cache' first.");
  }

  return JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8"));
}

function u16ToArrayBufferLE(value: number): Uint8Array {
  // Create a buffer of 2 bytes
  const buffer = new ArrayBuffer(2);
  const dataView = new DataView(buffer);

  // Set the Uint16 value in little-endian order
  dataView.setUint16(0, value, true);

  // Return the buffer
  return new Uint8Array(buffer);
}

function findPythPushOracleAddress(feedId: Buffer, programId: PublicKey, shardId: number): PublicKey {
  const shardBytes = u16ToArrayBufferLE(shardId);
  return PublicKey.findProgramAddressSync([shardBytes, feedId], programId)[0];
}

export function getPythPushOracleAddresses(feedId: Buffer): PublicKey[] {
  return [
    findPythPushOracleAddress(feedId, PYTH_PUSH_ORACLE_ID, PYTH_SPONSORED_SHARD_ID),
    findPythPushOracleAddress(feedId, PYTH_PUSH_ORACLE_ID, MARGINFI_SPONSORED_SHARD_ID),
  ];
}

export async function getBankMetadata(env: Environment): Promise<BankMetadata[]> {
  let bankMetadataUrl = "https://storage.googleapis.com/mrgn-public/mrgn-bank-metadata-cache.json";
  let stakedBankMetadataUrl = "https://storage.googleapis.com/mrgn-public/mrgn-staked-bank-metadata-cache.json";

  if (env === "staging") {
    bankMetadataUrl = "https://storage.googleapis.com/mrgn-public/mrgn-bank-metadata-cache-stage.json";
    stakedBankMetadataUrl = "https://storage.googleapis.com/mrgn-public/mrgn-staked-bank-metadata-cache-stage.json";
  }

  const bankMetadataResponse = await fetch(bankMetadataUrl);
  const stakedBankMetadataResponse = await fetch(stakedBankMetadataUrl);
  const bankMetadata = (await bankMetadataResponse.json()) as BankMetadata[];
  const stakedBankMetadata = (await stakedBankMetadataResponse.json()) as BankMetadata[];

  return [...bankMetadata, ...stakedBankMetadata];
}

export async function getBankMetadataFromBirdeye(bank: PublicKey, mint: PublicKey) {
  const birdeyeApiResponse = await fetch(
    `https://public-api.birdeye.so/defi/v3/token/meta-data/single?address=${mint.toBase58()}`,
    {
      headers: {
        "x-api-key": process.env.BIRDEYE_API_KEY,
        "x-chain": "solana",
      },
    }
  );
  const birdeyeApiJson: BirdeyeTokenMetadataResponse = await birdeyeApiResponse.json();

  if (birdeyeApiResponse.ok && birdeyeApiJson.data) {
    return {
      bankAddress: bank.toString(),
      tokenSymbol: birdeyeApiJson.data.symbol,
    };
  }

  return null;
}

/**
 * A Wallet, but it's built from pubkey only, so it can't sign, and the keypair is always undefined.
 */
export class ReadOnlyWallet implements Wallet {
  payer: Keypair;
  readonly publicKey: PublicKey;

  constructor(pubkey: PublicKey) {
    this.publicKey = pubkey;
    this.payer = undefined;
  }

  async signTransaction<T extends Transaction | VersionedTransaction>(tx: T): Promise<T> {
    return tx;
  }

  async signAllTransactions<T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]> {
    return txs;
  }
}

export type BankAndOracles = PublicKey[]; // [bank, oracle, oracle_2...]

/**
 * Prepares transaction remaining accounts by processing bank-oracle groups:
 * 1. Sorts groups in descending order by bank public key (pushes inactive accounts to end)
 * 2. Flattens the structure into a single public key array
 *
 * Stable on most JS implementations (this shouldn't matter since we do not generally have duplicate
 * banks), in place, and uses the raw 32-byte value to sort in byte-wise lexicographical order (like
 * Rust's b.key.cmp(&a.key))
 *
 * @param banksAndOracles - Array where each element is a bank-oracle group: [bankPubkey,
 *                          oracle1Pubkey, oracle2Pubkey?, ...] Note: SystemProgram keys (111..111)
 *                          represent inactive accounts
 * @returns Flattened array of public keys with inactive accounts at the end, ready for transaction
 *          composition
 */
export const composeRemainingAccounts = (banksAndOracles: PublicKey[][]): PublicKey[] => {
  banksAndOracles.sort((a, b) => {
    const A = a[0].toBytes();
    const B = b[0].toBytes();
    // find the first differing byte
    for (let i = 0; i < 32; i++) {
      if (A[i] !== B[i]) {
        // descending: bigger byte should come first
        return B[i] - A[i];
      }
    }
    return 0; // identical keys
  });

  // flatten out [bank, oracle…, oracle…] → [bank, oracle…, bank, oracle…, …]
  return banksAndOracles.flat();
};

/**
 * Print account balances in a pretty table. If you're getting a type error here, due to a different
 * client version. feel free to ts-ignore it.
 */
export function dumpAccBalances(account: MarginfiAccountRaw) {
  let balances = account.lendingAccount.balances;
  let activeBalances = [];
  for (let i = 0; i < balances.length; i++) {
    if (balances[i].active == 0) {
      activeBalances.push({
        "Bank PK": "empty",
        // Tag: "-",
        "Liab Shares ": "-",
        "Asset Shares": "-",
        // Emissions: "-",
      });
      continue;
    }

    activeBalances.push({
      "Bank PK": balances[i].bankPk.toString(),
      // Tag: balances[i].bankAssetTag,
      "Liab Shares ": formatNumber(wrappedI80F48toBigNumber(balances[i].liabilityShares)),
      "Asset Shares": formatNumber(wrappedI80F48toBigNumber(balances[i].assetShares)),
      // Emissions: formatNumber(
      //   wrappedI80F48toBigNumber(balances[i].emissionsOutstanding)
      // ),
    });

    function formatNumber(num) {
      const number = parseFloat(num).toFixed(4);
      return number === "0.0000" ? "-" : number;
    }
  }
  console.table(activeBalances);
}

/**
 * Decode an f64 from 8 bytes (little‑endian).
 * @param bytes - either a Uint8Array or number[] of length 8
 * @returns the decoded number
 */
export function bytesToF64(bytes: Uint8Array | number[]): number {
  // Normalize to a Uint8Array
  const u8: Uint8Array = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);

  if (u8.length !== 8) {
    throw new Error(`Invalid length ${u8.length}, expected exactly 8 bytes`);
  }

  // Create a DataView on the buffer (little‑endian)
  const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
  return dv.getFloat64(0, /* littleEndian */ true);
}

/**
 * Fetches token prices for a list of banks using Birdeye API
 * @param banks Array of bank objects containing mint property
 * @returns A map of token addresses to their prices
 */
export async function getBankPrices(banks: any[]): Promise<Map<string, number>> {
  // Extract token addresses from banks
  const tokenAddresses = banks.map((bank) => bank.mint.toBase58());

  // Prepare request payload for Birdeye API
  const payload = {
    list_address: tokenAddresses.join(","),
  };

  // Make API request to Birdeye
  const birdeyeApiResponse = await fetch("https://public-api.birdeye.so/defi/multi_price", {
    method: "POST",
    headers: {
      "x-api-key": process.env.BIRDEYE_API_KEY,
      "x-chain": "solana",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  // Parse response
  const birdeyeApiJson: BirdeyePriceResponse = await birdeyeApiResponse.json();
  const priceMap = new Map<string, number>();

  // Create a map of token address to price
  if (birdeyeApiResponse.ok && birdeyeApiJson.data) {
    Object.entries(birdeyeApiJson.data).forEach(([tokenAddress, priceData]) => {
      if (!priceData) return;
      priceMap.set(tokenAddress, priceData.value);
    });
  }

  return priceMap;
}
