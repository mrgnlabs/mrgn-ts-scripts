import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";
import { Program, AnchorProvider, Wallet, type Idl } from "@coral-xyz/anchor";
import { Marginfi as MarginfiCurrent } from "../../idl/marginfi";
import { Marginfi as MarginfiV1_3 } from "../../idl/marginfi1.3";
import marginfiIdlCurrent from "../../idl/marginfi.json";
import marginfiIdlV1_3 from "../../idl/marginfi1.3.json";

// Only env vars prefixed with VITE_ are exposed to the client
const DEFAULT_API_URL = "https://api.mainnet-beta.solana.com";

const idlMap: Record<"current" | "1.3", Idl> = {
  current: marginfiIdlCurrent as Idl,
  "1.3": marginfiIdlV1_3 as Idl,
};

type Version = "current" | "1.3";

/**
 * Browser-friendly setup for Anchor + Solana.
 * Reads API URL from VITE_API_URL, falling back to DEFAULT_API_URL.
 * @param wallet - a Wallet or ReadOnlyWallet instance (e.g. from wallet adapter or multisig)
 * @param programId - the on‑chain program ID (string)
 * @param version - which IDL version to use ('current' or '1.3')
 */
export function commonSetupBrowser(
  wallet: Wallet | ReadOnlyWallet,
  programId: string,
  version: Version = "current"
) {
  // Vite exposes env via import.meta.env
  const apiUrl = import.meta.env.VITE_API_URL || DEFAULT_API_URL;

  // Create a connection & provider
  const connection = new Connection(apiUrl, "confirmed");
  const provider = new AnchorProvider(connection, wallet, {
    preflightCommitment: "confirmed",
  });

  // Instantiate the program
  const idl = idlMap[version];
  idl.address = programId;
  if (version === "1.3") {
    return {
      program: new Program<MarginfiV1_3>(idl as any, provider),
      wallet,
      provider,
      connection,
    };
  } else {
    return {
      program: new Program<MarginfiCurrent>(idl as any, provider),
      wallet,
      provider,
      connection,
    };
  }
}

/**
 * A Wallet, but it's built from pubkey only, so it can't sign, and the keypair is always random.
 */
export class ReadOnlyWallet implements Wallet {
  payer: Keypair;
  readonly publicKey: PublicKey;

  constructor(pubkey: PublicKey) {
    this.publicKey = pubkey;
    this.payer = Keypair.generate();
  }

  async signTransaction<T extends Transaction | VersionedTransaction>(
    tx: T
  ): Promise<T> {
    return tx;
  }

  async signAllTransactions<T extends Transaction | VersionedTransaction>(
    txs: T[]
  ): Promise<T[]> {
    return txs;
  }
}
