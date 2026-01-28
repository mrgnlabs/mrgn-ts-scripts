// Note: don't forget to call init_bank_obligation after!
import {
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import {
  bigNumberToWrappedI80F48,
  getMint,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@mrgnlabs/mrgn-common";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { KaminoConfigCompact, OracleSetupRawWithKamino } from "./kamino-types";
import { commonSetup } from "../../lib/common-setup";
import { makeAddKaminoBankIx } from "./ixes-common";
import { deriveBankWithSeed } from "../common/pdas";

/**
 * If true, send the tx. If false, output the unsigned b58 tx to console.
 */
const sendTx = true;

type Config = {
  PROGRAM_ID: string;
  GROUP_KEY: PublicKey;
  /** For Pyth, This is the feed, and is owned by rec5EKMGg6MxZYaMdyBfgwp4d5rB9T1VQH5pJv5LtFJ */
  ORACLE: PublicKey;
  /** { kaminoPythPush: {} } or  { kaminoSwitchboardPull: {} } */
  ORACLE_TYPE: OracleSetupRawWithKamino;
  /** Group admin (generally the MS on mainnet) */
  ADMIN: PublicKey;
  /** Pays flat sol fee to init and rent (generally the MS on mainnet) */
  FEE_PAYER?: PublicKey; // If omitted, defaults to ADMIN
  BANK_MINT: PublicKey;
  KAMINO_RESERVE: PublicKey;
  KAMINO_MARKET: PublicKey;
  SEED: number;
  MULTISIG_PAYER?: PublicKey; // May be omitted if not using squads
};

const config: Config = {
  PROGRAM_ID: "stag8sTKds2h4KzjUw3zKTsxbqvT4XKHdaR9X9E6Rct",
  GROUP_KEY: new PublicKey("FCPfpHA69EbS8f9KKSreTRkXbzFpunsKuYf5qNmnJjpo"),
  ORACLE_TYPE: { kaminoSwitchboardPull: {} },
  ADMIN: new PublicKey("mfC1LoEk4mpM5yx1LjwR9QLZQ49AitxxWkK5Aciw7ZC"),
  // USDS
  // ORACLE: new PublicKey("DyYBBWEi9xZvgNAeMDCiFnmC1U9gqgVsJDXkL5WETpoX"), // usds
  // BANK_MINT: new PublicKey("USDSwr9ApdHk5bvJKMjzff41FfuX8bSxdKcR81vTwcA"), // usds
  // KAMINO_RESERVE: new PublicKey("BiSRKTadXSiyTSpiqw9nJge33N32AXewUPY7skFJwMvA"), // usds
  // KAMINO_MARKET: new PublicKey("6WEGfej9B9wjxRs6t4BYpb9iCXd8CpTpJ8fVSNzHCC5y"), // maple

  // USDC
  // ORACLE: new PublicKey("Dpw1EAVrSB1ibxiDQyTAW6Zip3J4Btk2x4SgApQCeFbX"), // usdc
  // BANK_MINT: new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"), // usdc
  // KAMINO_RESERVE: new PublicKey("D6q6wuQSrifJKZYpR1M8R4YawnLDtDsMmWM1NbBmgJ59"), // usdc
  // KAMINO_MARKET: new PublicKey("7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF"), // main

  // SOL
  ORACLE: new PublicKey("4Hmd6PdjVA9auCoScE12iaBogfwS4ZXQ6VZoBeqanwWW"),
  BANK_MINT: new PublicKey("So11111111111111111111111111111111111111112"), // sol
  KAMINO_RESERVE: new PublicKey("d4A2prbA2whesmvHaL88BH6Ewn5N4bTSU2Ze8P6Bc4Q"), // sol
  KAMINO_MARKET: new PublicKey("7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF"), // main
  SEED: 41,
};

const bankConfig: KaminoConfigCompact = {
  assetWeightInit: bigNumberToWrappedI80F48(0.8),
  assetWeightMaint: bigNumberToWrappedI80F48(0.9),
  depositLimit: new BN(100 * 10 ** 6),
  operationalState: { operational: {} },
  riskTier: { collateral: {} },
  totalAssetValueInitLimit: new BN(2000000000),
  oracleMaxAge: 30,
  oracleMaxConfidence: 0,
  oracle: config.ORACLE,
  oracleSetup: config.ORACLE_TYPE,
  configFlags: 0,
};

async function main() {
  await addKaminoBank(sendTx, config, "/keys/staging-deploy.json");
}

export async function addKaminoBank(sendTx: boolean, config: Config, walletPath: string, version?: "current"): Promise<PublicKey> {
  console.log("adding bank to group: " + config.GROUP_KEY);
  const user = commonSetup(
    sendTx,
    config.PROGRAM_ID,
    walletPath,
    config.MULTISIG_PAYER,
    version
  );
  const program = user.program;
  const connection = user.connection;

  console.log("Detecting token program for mint...");
  let tokenProgram = TOKEN_PROGRAM_ID;
  try {
    await getMint(
      connection,
      config.BANK_MINT,
      "confirmed",
      TOKEN_2022_PROGRAM_ID,
    );
    tokenProgram = TOKEN_2022_PROGRAM_ID;
    console.log("  Using Token-2022 program");
  } catch {
    // If it fails with Token-2022, it's a regular SPL token
    console.log("  Using SPL Token program");
  }
  console.log();

  const [bankKey] = deriveBankWithSeed(
    program.programId,
    config.GROUP_KEY,
    config.BANK_MINT,
    new BN(config.SEED)
  );

  const initBankTx = new Transaction().add(
    await makeAddKaminoBankIx(
      program,
      {
        group: config.GROUP_KEY,
        feePayer: config.FEE_PAYER ?? config.ADMIN,
        bankMint: config.BANK_MINT,
        integrationAcc1: config.KAMINO_RESERVE,
        kaminoMarket: config.KAMINO_MARKET,
        oracle: config.ORACLE,
        tokenProgram,
        admin: config.ADMIN,
      },
      {
        seed: new BN(config.SEED),
        config: bankConfig,
      }
    )
  );

  if (sendTx) {
    try {
      const sigInit = await sendAndConfirmTransaction(connection, initBankTx, [
        user.wallet.payer,
      ]);
      console.log("bank key: " + bankKey);
      console.log("Transaction signature:", sigInit);
    } catch (error) {
      console.error("Transaction failed:", error);
    }
  } else {
    initBankTx.feePayer = config.MULTISIG_PAYER; // Set the fee payer to Squads wallet
    const { blockhash } = await connection.getLatestBlockhash();
    initBankTx.recentBlockhash = blockhash;
    const serializedTransaction = initBankTx.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    });
    const base58Transaction = bs58.encode(serializedTransaction);
    console.log("bank key: " + bankKey);
    console.log("Base58-encoded transaction:", base58Transaction);
  }

  return bankKey;
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
  });
}
