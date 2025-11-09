import { Connection, Keypair } from "@solana/web3.js";
import { AnchorProvider, Program, Wallet } from "@coral-xyz/anchor";
import { readFileSync } from "fs";
import { homedir } from "os";
import { loadEnvFile } from "../../utils";
import marginfiDriftIdl from "../../../idl/marginfi_drift.json";
import { Marginfi as MarginfiDrift } from "../../../idl/marginfi_drift";

export interface UserSetup {
  connection: Connection;
  wallet: Wallet;
  program: Program<MarginfiDrift>;
}

/**
 * Setup connection, wallet, and program for user (using USER_WALLET from .env)
 */
export function userSetup(programId: string): UserSetup {
  // Load environment
  loadEnvFile(".env");
  loadEnvFile(".env.api");

  let walletPath = process.env.USER_WALLET;
  if (!walletPath) {
    throw new Error("USER_WALLET not set in .env file");
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

  console.log("User wallet:", keypair.publicKey.toString());

  // Create connection
  const connection = new Connection(rpcUrl, "confirmed");

  // Create program
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });

  // Override the program ID in the IDL
  const idlWithProgramId = {
    ...marginfiDriftIdl,
    address: programId,
  };

  const program = new Program<MarginfiDrift>(
    idlWithProgramId as any,
    provider
  );

  return { connection, wallet, program };
}
