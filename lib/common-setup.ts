// This script is an abomination and I apologize.
import { Connection, PublicKey } from "@solana/web3.js";
import { Program, AnchorProvider, Wallet, Idl } from "@coral-xyz/anchor";

import { Marginfi as MarginfiCurrent } from "../idl/marginfi";
import marginfiIdlCurrent from "../idl/marginfi.json";

import { Marginfi as MarginfiV1_4 } from "../idl/marginfi1.4";
import marginfiIdlV1_4 from "../idl/marginfi1.4.json";

import { Marginfi as MarginfiV1_3 } from "../idl/marginfi1.3";
import marginfiIdlV1_3 from "../idl/marginfi1.3.json";

import { loadKeypairFromFile, ReadOnlyWallet } from "../lib/utils";
import { DEFAULT_API_URL, loadEnvFile } from "../scripts/utils";

/**
 * A user context containing the Anchor program, wallet, provider, and connection.
 */
export type User<IDL extends Idl> = {
  program: Program<IDL>;
  wallet: ReadOnlyWallet | Wallet;
  provider: AnchorProvider;
  connection: Connection;
};

/**
 * Supported IDL versions.
 */
type Versions = {
  current: MarginfiCurrent;
  "1.3": MarginfiV1_3;
  "1.4": MarginfiV1_4;
};

// Map each version to its corresponding JSON IDL object.
const idlJsonMap: Record<keyof Versions, Idl> = {
  current: marginfiIdlCurrent as Idl,
  "1.3": marginfiIdlV1_3 as Idl,
  "1.4": marginfiIdlV1_4 as Idl,
};

/**
 * @overload
 * commonSetup(sendTx, programId, walletPath?, multisig?, version?: 'current'): User<MarginfiCurrent>
 */
/**
 * @overload
 * commonSetup(sendTx, programId, walletPath?, multisig?, version: '1.3'): User<MarginfiV1_3>
 */
export function commonSetup(
  sendTx: boolean,
  programId: string,
  walletPath?: string,
  multisig?: PublicKey,
  version?: "current"
): User<MarginfiCurrent>;
export function commonSetup(
  sendTx: boolean,
  programId: string,
  walletPath?: string,
  multisig?: PublicKey,
  version?: "1.3"
): User<MarginfiV1_3>;
export function commonSetup(
  sendTx: boolean,
  programId: string,
  walletPath?: string,
  multisig?: PublicKey,
  version?: "1.4"
): User<MarginfiV1_4>;
export function commonSetup(
  sendTx: boolean,
  programId: string,
  walletPath?: string,
  multisig?: PublicKey,
  version: keyof Versions = "current"
): User<MarginfiCurrent> | User<MarginfiV1_3> | User<MarginfiV1_4> {
  const selectedJsonIdl = idlJsonMap[version];
  selectedJsonIdl.address = programId;

  loadEnvFile(".env.api");
  const apiUrl = process.env.API_URL || DEFAULT_API_URL;
  console.log("api: " + apiUrl);

  const connection = new Connection(apiUrl, "confirmed");

  let wallet: ReadOnlyWallet | Wallet;
  let provider: AnchorProvider;

  if (sendTx) {
    console.log("using provided path as wallet: " + walletPath);
    wallet = new Wallet(loadKeypairFromFile(process.env.HOME + walletPath!));
    provider = new AnchorProvider(connection, wallet, {
      preflightCommitment: "confirmed",
    });
  } else {
    console.log("using MS as wallet: " + multisig);
    wallet = new ReadOnlyWallet(multisig!);
    provider = new AnchorProvider(connection, wallet, {
      preflightCommitment: "confirmed",
    });
  }

  // Instantiate the program with the selected IDL
  if (version === "1.3") {
    return {
      program: new Program<MarginfiV1_3>(selectedJsonIdl as any, provider),
      wallet,
      provider,
      connection,
    };
  } else if (version === "1.4") {
    return {
      program: new Program<MarginfiV1_4>(selectedJsonIdl as any, provider),
      wallet,
      provider,
      connection,
    };
  } else {
    return {
      program: new Program<MarginfiCurrent>(selectedJsonIdl as any, provider),
      wallet,
      provider,
      connection,
    };
  }
}
