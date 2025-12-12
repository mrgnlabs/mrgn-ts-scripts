import { Connection, PublicKey } from "@solana/web3.js";
import { BN, Program } from "@coral-xyz/anchor";
import { deriveBankWithSeed } from "../../common/pdas";
import { KAMINO_ASSET_TAG, KAMINO_SEED_START } from "./config_types";
import { Marginfi } from "../../../idl/marginfi";

/**
 * Information about an existing Kamino bank
 */
export interface KaminoBankInfo {
  seed: number;
  bankAddress: PublicKey;
  kaminoReserve: PublicKey;
  kaminoMarket: PublicKey;
  mint: PublicKey;
}

/**
 * Result of seed selection
 */
export interface SeedSelectionResult {
  seed: number;
  bankAddress: PublicKey;
  existingBanks: KaminoBankInfo[];
  isDuplicate: boolean;
  duplicateBank?: KaminoBankInfo;
}

/**
 * Find all existing Kamino banks for a given group and mint
 *
 * Uses getProgramAccounts to scan all banks, then filters by:
 * - Matching group
 * - Matching mint
 * - Asset tag = 3 (KAMINO)
 */
export async function findExistingKaminoBanks(
  program: Program<Marginfi>,
  group: PublicKey,
  mint: PublicKey
): Promise<KaminoBankInfo[]> {
  const kaminoBanks: KaminoBankInfo[] = [];

  // Fetch all bank accounts for this program
  // We use getProgramAccounts with filters for efficiency
  const accounts = await program.account.bank.all([
    {
      memcmp: {
        offset: 41, // Group offset in Bank struct (after discriminator + mint)
        bytes: group.toBase58(),
      },
    },
  ]);

  for (const account of accounts) {
    const bankData = account.account;

    // Check if this is a Kamino bank (asset tag = 3)
    // @ts-expect-error - assetTag exists on bank config
    const assetTag = bankData.config?.assetTag;
    if (assetTag !== KAMINO_ASSET_TAG) {
      continue;
    }

    // Check if mint matches
    // @ts-expect-error - mint exists on bank
    const bankMint = bankData.mint as PublicKey;
    if (!bankMint.equals(mint)) {
      continue;
    }

    // Extract Kamino-specific fields
    // @ts-expect-error - kaminoReserve exists on bank
    const kaminoReserve = bankData.kaminoReserve as PublicKey;

    // We need to derive the seed by trying seeds starting at 300
    // until we find one that matches this bank address
    let foundSeed = -1;
    for (let seed = KAMINO_SEED_START; seed < KAMINO_SEED_START + 100; seed++) {
      const [derivedBank] = deriveBankWithSeed(
        program.programId,
        group,
        mint,
        new BN(seed)
      );
      if (derivedBank.equals(account.publicKey)) {
        foundSeed = seed;
        break;
      }
    }

    if (foundSeed === -1) {
      console.warn(`Warning: Could not determine seed for bank ${account.publicKey.toBase58()}`);
      continue;
    }

    // Get the Kamino market from the reserve (we'd need to fetch the reserve account)
    // For now, we'll set it to default - the actual market will be fetched later if needed
    kaminoBanks.push({
      seed: foundSeed,
      bankAddress: account.publicKey,
      kaminoReserve,
      kaminoMarket: PublicKey.default, // Will be populated separately if needed
      mint: bankMint,
    });
  }

  // Sort by seed
  kaminoBanks.sort((a, b) => a.seed - b.seed);

  return kaminoBanks;
}

/**
 * Check if a bank already exists for the given Kamino reserve
 */
export function checkForDuplicateReserve(
  existingBanks: KaminoBankInfo[],
  targetReserve: PublicKey
): { isDuplicate: boolean; existingBank?: KaminoBankInfo } {
  for (const bank of existingBanks) {
    if (bank.kaminoReserve.equals(targetReserve)) {
      return { isDuplicate: true, existingBank: bank };
    }
  }
  return { isDuplicate: false };
}

/**
 * Get the next available seed for a Kamino bank
 *
 * - Scans existing Kamino banks for this group + mint
 * - Checks for duplicate reserve
 * - Returns next available seed starting at 300
 */
export async function getNextAvailableSeed(
  program: Program<Marginfi>,
  group: PublicKey,
  mint: PublicKey,
  targetReserve: PublicKey,
  startSeed: number = KAMINO_SEED_START
): Promise<SeedSelectionResult> {
  // Find existing banks
  const existingBanks = await findExistingKaminoBanks(program, group, mint);

  // Check for duplicate reserve
  const { isDuplicate, existingBank: duplicateBank } = checkForDuplicateReserve(
    existingBanks,
    targetReserve
  );

  // Find next available seed
  const usedSeeds = new Set(existingBanks.map((b) => b.seed));
  let seed = startSeed;
  while (usedSeeds.has(seed)) {
    seed++;
  }

  // Derive the bank address for this seed
  const [bankAddress] = deriveBankWithSeed(
    program.programId,
    group,
    mint,
    new BN(seed)
  );

  return {
    seed,
    bankAddress,
    existingBanks,
    isDuplicate,
    duplicateBank,
  };
}

/**
 * Format existing banks for console output
 */
export function formatExistingBanks(
  existingBanks: KaminoBankInfo[],
  targetReserve: PublicKey,
  assetName: string
): string {
  const lines: string[] = [];

  if (existingBanks.length === 0) {
    lines.push(`No existing Kamino banks found for ${assetName}`);
  } else {
    lines.push(`Existing Kamino banks for ${assetName}:`);
    for (const bank of existingBanks) {
      const isTargetReserve = bank.kaminoReserve.equals(targetReserve);
      const marker = isTargetReserve ? " ⚠️ DUPLICATE RESERVE" : "";
      lines.push(`  - Seed ${bank.seed}: ${bank.bankAddress.toBase58()}${marker}`);
      lines.push(`    Reserve: ${bank.kaminoReserve.toBase58()}`);
      lines.push(`    Solscan: https://solscan.io/account/${bank.bankAddress.toBase58()}`);
    }
  }

  // Check for duplicate
  const duplicateCheck = checkForDuplicateReserve(existingBanks, targetReserve);
  if (duplicateCheck.isDuplicate) {
    lines.push("");
    lines.push(`❌ ERROR: Bank already exists for reserve ${targetReserve.toBase58()}`);
    lines.push(`   Existing bank: ${duplicateCheck.existingBank!.bankAddress.toBase58()}`);
  } else {
    lines.push("");
    lines.push(`✅ No existing bank for reserve ${targetReserve.toBase58()}`);
  }

  return lines.join("\n");
}

/**
 * Verify a seed doesn't collide with an existing bank
 */
export async function verifySeedAvailable(
  connection: Connection,
  programId: PublicKey,
  group: PublicKey,
  mint: PublicKey,
  seed: number
): Promise<boolean> {
  const [bankAddress] = deriveBankWithSeed(
    programId,
    group,
    mint,
    new BN(seed)
  );

  const accountInfo = await connection.getAccountInfo(bankAddress);
  return accountInfo === null;
}
