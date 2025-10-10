// Note: don't forget to call init_bank_obligation after!
import {
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import {
  bigNumberToWrappedI80F48,
  TOKEN_PROGRAM_ID,
} from "@mrgnlabs/mrgn-common";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { KaminoConfigCompact, OracleSetupRawWithKamino } from "./kamino-types";
import { commonSetup } from "../../lib/common-setup";
import { makeAddKaminoBankIx } from "./ixes-common";
import { deriveBankWithSeed } from "../common/pdas";
import { TOKEN_2022_PROGRAM_ID, getMint } from "@solana/spl-token";
import { loadEnvFile } from "../utils";

/**
 * If true, send the tx. If false, output the unsigned b58 tx to console.
 */
const sendTx = false;

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
  FEE_PAYER: PublicKey;
  BANK_MINT: PublicKey;
  KAMINO_RESERVE: PublicKey;
  KAMINO_MARKET: PublicKey;
  SEED: number;
  MULTISIG_PAYER?: PublicKey; // May be omitted if not using squads
};

// ========================================
// USDC - Kamino Bank Configuration
// ========================================

const config: Config = {
  PROGRAM_ID: "MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA", // Mainnet program
  GROUP_KEY: new PublicKey("4qp6Fx6tnZkY5Wropq9wUYgtFxXKwE6viZxFHg3rdAG8"), // Mainnet group
  ORACLE: new PublicKey("Dpw1EAVrSB1ibxiDQyTAW6Zip3J4Btk2x4SgApQCeFbX"), // Pyth USDC/USD
  ORACLE_TYPE: { kaminoPythPush: {} },
  ADMIN: new PublicKey("CYXEgwbPHu2f9cY3mcUkinzDoDcsSan7myh1uBvYRbEw"), // Mainnet multisig
  FEE_PAYER: new PublicKey("CYXEgwbPHu2f9cY3mcUkinzDoDcsSan7myh1uBvYRbEw"), // Mainnet multisig
  BANK_MINT: new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"), // USDC
  KAMINO_RESERVE: new PublicKey("D6q6wuQSrifJKZYpR1M8R4YawnLDtDsMmWM1NbBmgJ59"), // Kamino USDC Reserve
  KAMINO_MARKET: new PublicKey("7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF"), // Main Market
  SEED: 300,
  MULTISIG_PAYER: new PublicKey("CYXEgwbPHu2f9cY3mcUkinzDoDcsSan7myh1uBvYRbEw"),
};

async function main() {
  // Load env vars from .env.api first, before reading KEYPAIR_PATH
  loadEnvFile(".env.api");

  console.log("adding bank to group: " + config.GROUP_KEY);

  // Use KEYPAIR_PATH env var, or fall back to default path
  // NOTE: When sendTx=false, this keypair is ONLY used for transaction construction.
  // The actual signer will be the Squads multisig (MULTISIG_PAYER).
  const keypairPath = process.env.KEYPAIR_PATH || "/keys/zerotrade_admin.json";
  console.log("using keypair path: " + keypairPath);

  const user = commonSetup(
    sendTx,
    config.PROGRAM_ID,
    keypairPath,
    config.MULTISIG_PAYER,
    "kamino"
  );
  const program = user.program;
  const connection = user.connection;

  // Fetch mint to determine token program and decimals
  console.log("fetching mint account: " + config.BANK_MINT);

  let mintInfo;
  let tokenProgram;

  try {
    // Try Token-2022 first
    mintInfo = await getMint(
      connection,
      config.BANK_MINT,
      "confirmed",
      TOKEN_2022_PROGRAM_ID
    );
    tokenProgram = TOKEN_2022_PROGRAM_ID;
    console.log("detected Token-2022 mint");
  } catch {
    // Fall back to regular Token Program
    mintInfo = await getMint(
      connection,
      config.BANK_MINT,
      "confirmed",
      TOKEN_PROGRAM_ID
    );
    tokenProgram = TOKEN_PROGRAM_ID;
    console.log("detected Token Program mint");
  }

  console.log("token program: " + tokenProgram);
  console.log("mint decimals: " + mintInfo.decimals);

  // Build bank config using fetched decimals
  const bankConfig: KaminoConfigCompact = {
    assetWeightInit: bigNumberToWrappedI80F48(1.0), // 100% for USDC
    assetWeightMaint: bigNumberToWrappedI80F48(1.0), // 100% for USDC
    depositLimit: new BN(100_000_000 * 10 ** mintInfo.decimals), // 100M USDC
    operationalState: { operational: {} },
    riskTier: { collateral: {} },
    totalAssetValueInitLimit: new BN(100_000_000), // $100M
    oracleMaxAge: 300,
    oracleMaxConfidence: 0,
    oracle: config.ORACLE,
    oracleSetup: config.ORACLE_TYPE,
    configFlags: 1,
  };

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
        feePayer: config.FEE_PAYER,
        bankMint: config.BANK_MINT,
        kaminoReserve: config.KAMINO_RESERVE,
        kaminoMarket: config.KAMINO_MARKET,
        oracle: config.ORACLE,
        tokenProgram: tokenProgram,
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
}

main().catch((err) => {
  console.error(err);
});
