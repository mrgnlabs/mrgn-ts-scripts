import { Connection, Keypair } from "@solana/web3.js";
import { AnchorProvider, Program, Wallet } from "@coral-xyz/anchor";
import { readFileSync } from "fs";
import { homedir } from "os";
import { loadEnvFile } from "../../utils";
import marginfiDriftIdl from "../../../idl/marginfi_drift.json";
import { Marginfi as MarginfiDrift } from "../../../idl/marginfi_drift";

export interface DriftSetup {
  connection: Connection;
  wallet: Wallet;
  program: Program<MarginfiDrift>;
}

/**
 * Setup connection, wallet, and program for drift-integration scripts
 */
export function driftSetup(programId: string): DriftSetup {
  // Load environment
  loadEnvFile(".env");
  loadEnvFile(".env.api");

  let walletPath = process.env.MARGINFI_WALLET;
  if (!walletPath) {
    throw new Error("MARGINFI_WALLET not set in .env file");
  }

  // Prepend HOME if relative path
  if (!walletPath.startsWith("/")) {
    walletPath = homedir() + walletPath;
  }

  const rpcUrl = process.env.API_URL;
  if (!rpcUrl) {
    throw new Error("API_URL not set in .env.api file");
  }

  // Load wallet
  const keypairData = JSON.parse(readFileSync(walletPath, "utf-8"));
  const keypair = Keypair.fromSecretKey(new Uint8Array(keypairData));
  const wallet = new Wallet(keypair);

  // Create connection
  const connection = new Connection(rpcUrl, "confirmed");

  // Create program
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });

  const program = new Program<MarginfiDrift>(
    marginfiDriftIdl as any,
    programId,
    provider
  );

  return { connection, wallet, program };
}
