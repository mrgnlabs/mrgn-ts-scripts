// Call this once after each bank is made.
// This script is always run LOCALLY with your own wallet (not via Squads multisig).
// Set KEYPAIR_PATH env var to your wallet location.
// The fee payer will automatically be your wallet's public key.
import {
  ComputeBudgetProgram,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import {
  FARMS_PROGRAM_ID,
  KLEND_PROGRAM_ID,
} from "./kamino-types";
import { commonSetup } from "../../lib/common-setup";
import { makeInitObligationIx } from "./ixes-common";
import {
  getAssociatedTokenAddressSync,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import { deriveBaseObligation, deriveUserState } from "./pdas";
import {
  deriveBankWithSeed,
  deriveLiquidityVaultAuthority,
} from "../common/pdas";
import { loadEnvFile } from "../utils";

/**
 * If true, send the tx. If false, just output transaction details for review.
 */
const sendTx = true;

type Config = {
  PROGRAM_ID: string;
  GROUP_KEY: PublicKey;

  /** Group admin (generally the MS on mainnet) */
  ADMIN: PublicKey;
  BANK_MINT: PublicKey;
  KAMINO_RESERVE: PublicKey;
  KAMINO_MARKET: PublicKey;
  /** Oracle address the Kamino Reserve uses. Typically read from reserve.config.tokenInfo.scope */
  RESERVE_ORACLE: PublicKey;
  /** Reserve Farm state. Can be read from reserve.farmCollateral. Technically optional, but almost
   * every (perhaps every?) Kamino reserve in prod has one. */
  FARM_STATE: PublicKey;
  SEED: number;
  TOKEN_PROGRAM: PublicKey;
};

// ========================================
// PYUSD - Kamino Bank Obligation Configuration
// ========================================

const config: Config = {
  PROGRAM_ID: "MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA", // Mainnet program
  GROUP_KEY: new PublicKey("4qp6Fx6tnZkY5Wropq9wUYgtFxXKwE6viZxFHg3rdAG8"), // Mainnet group
  ADMIN: new PublicKey("CYXEgwbPHu2f9cY3mcUkinzDoDcsSan7myh1uBvYRbEw"), // Mainnet multisig
  BANK_MINT: new PublicKey("2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo"),
  KAMINO_RESERVE: new PublicKey("2gc9Dm1eB6UgVYFBUN9bWks6Kes9PbWSaPaa9DqyvEiN"),
  KAMINO_MARKET: new PublicKey("7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF"),
  RESERVE_ORACLE: new PublicKey("3NJYftD5sjVfxSnUdZ1wVML8f3aC6mp1CXCL6L7TnU8C"),
  FARM_STATE: new PublicKey("DEe2NZ5dAXGxC7M8Gs9Esd9wZRPdQzG8jNamXqhL5yku"), // Active farm
  SEED: 300,
  TOKEN_PROGRAM: TOKEN_2022_PROGRAM_ID, // PYUSD uses Token-2022
};

async function main() {
  // Load env vars from .env.api first, before reading KEYPAIR_PATH
  loadEnvFile(".env.api");

  console.log("init obligation for bank in group: " + config.GROUP_KEY);

  // commonSetup prepends HOME to the path, so pass a path starting with /
  const keypairPath = "/.config/solana/id.json";
  console.log("using keypair: $HOME" + keypairPath);

  // Always load real wallet (even when sendTx=false) since we need the public key for ATA
  const user = commonSetup(
    true, // Always pass true to load real wallet
    config.PROGRAM_ID,
    keypairPath,
    undefined,
    "kamino"
  );
  const program = user.program;
  const connection = user.connection;

  const [bankKey] = deriveBankWithSeed(
    program.programId,
    config.GROUP_KEY,
    config.BANK_MINT,
    new BN(config.SEED)
  );
  console.log("init obligation for bank: " + bankKey);
  const [lendingVaultAuthority] = deriveLiquidityVaultAuthority(
    program.programId,
    bankKey
  );
  const [baseObligation] = deriveBaseObligation(
    lendingVaultAuthority,
    config.KAMINO_MARKET,
    KLEND_PROGRAM_ID
  );

  const ata = getAssociatedTokenAddressSync(
    config.BANK_MINT,
    user.wallet.publicKey,
    true,
    config.TOKEN_PROGRAM
  );

  const [userState] = deriveUserState(
    FARMS_PROGRAM_ID,
    config.FARM_STATE,
    baseObligation
  );

  let initObligationTx = new Transaction().add(
    ComputeBudgetProgram.setComputeUnitLimit({ units: 1_400_000 }),
    await makeInitObligationIx(
      program,
      {
        feePayer: user.wallet.publicKey, // Use the wallet's public key as fee payer
        bank: bankKey,
        signerTokenAccount: ata,
        lendingMarket: config.KAMINO_MARKET,
        reserveLiquidityMint: config.BANK_MINT,
        reserve: config.KAMINO_RESERVE,
        scopePrices: config.RESERVE_ORACLE,
        // TODO support edge cases where no farm state is active
        reserveFarmState: config.FARM_STATE,
        obligationFarmUserState: userState,
        liquidityTokenProgram: config.TOKEN_PROGRAM,
      },
      new BN(100)
    )
  );

  if (sendTx) {
    try {
      const sigObligation = await sendAndConfirmTransaction(
        connection,
        initObligationTx,
        [user.wallet.payer]
      );
      console.log("obligation key: " + baseObligation);
      console.log("Transaction signature:", sigObligation);
    } catch (error) {
      console.error("Transaction failed:", error);
    }
  } else {
    // When sendTx=false, output transaction for simulation
    const { blockhash } = await connection.getLatestBlockhash();
    initObligationTx.recentBlockhash = blockhash;
    initObligationTx.feePayer = user.wallet.publicKey;

    // Simulate the transaction
    try {
      const simulation = await connection.simulateTransaction(initObligationTx);

      console.log("bank key: " + bankKey);
      console.log("obligation key: " + baseObligation);
      console.log("fee payer: " + user.wallet.publicKey.toBase58());
      console.log("\n=== SIMULATION RESULTS ===");

      if (simulation.value.err) {
        console.log("❌ Simulation failed!");
        console.log("Error:", JSON.stringify(simulation.value.err, null, 2));
      } else {
        console.log("✅ Simulation successful!");
        console.log("Compute units:", simulation.value.unitsConsumed);
      }

      if (simulation.value.logs) {
        console.log("\n📝 Logs:");
        simulation.value.logs.forEach((log, i) => {
          console.log(`  [${i}] ${log}`);
        });
      }

      console.log("\nSet sendTx=true to execute this transaction.");
    } catch (error) {
      console.error("Simulation error:", error);
    }
  }
}

main().catch((err) => {
  console.error(err);
});
