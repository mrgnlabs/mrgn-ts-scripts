// Call this once after each bank is made.
// This script is always run LOCALLY with your own wallet (not via Squads multisig).
// Set KEYPAIR_PATH env var to your wallet location.
// The fee payer will automatically be your wallet's public key.
import {
  ComputeBudgetProgram,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
  SystemProgram,
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
  createAssociatedTokenAccountInstruction,
  createSyncNativeInstruction,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
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
// SOL - Kamino Bank Obligation Configuration
// ========================================

const config: Config = {
  PROGRAM_ID: "MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA", // Mainnet program
  GROUP_KEY: new PublicKey("4qp6Fx6tnZkY5Wropq9wUYgtFxXKwE6viZxFHg3rdAG8"), // Mainnet group
  ADMIN: new PublicKey("CYXEgwbPHu2f9cY3mcUkinzDoDcsSan7myh1uBvYRbEw"), // Mainnet multisig
  BANK_MINT: new PublicKey("So11111111111111111111111111111111111111112"), // SOL
  KAMINO_RESERVE: new PublicKey("d4A2prbA2whesmvHaL88BH6Ewn5N4bTSU2Ze8P6Bc4Q"),
  KAMINO_MARKET: new PublicKey("7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF"),
  RESERVE_ORACLE: new PublicKey("3NJYftD5sjVfxSnUdZ1wVML8f3aC6mp1CXCL6L7TnU8C"), // Scope oracle for SOL
  FARM_STATE: new PublicKey("955xWFhSDcDiUgUr4sBRtCpTLiMd4H5uZLAmgtP3R3sX"), // Farm collateral for SOL
  SEED: 300,
  TOKEN_PROGRAM: TOKEN_PROGRAM_ID, // SOL uses standard Token Program
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

  // Check if ATA exists, if not we'll create it
  const ataInfo = await connection.getAccountInfo(ata);
  const needsAtaCreation = ataInfo === null;

  if (needsAtaCreation) {
    console.log("ATA does not exist, will create it:", ata.toBase58());
  } else {
    console.log("ATA exists:", ata.toBase58());
  }

  // Derive obligation farm user state if farm exists
  const hasFarm = !config.FARM_STATE.equals(PublicKey.default);
  const [obligationFarmUserState] = hasFarm
    ? deriveUserState(FARMS_PROGRAM_ID, config.FARM_STATE, baseObligation)
    : [null, 0];

  console.log("has farm:", hasFarm);
  if (hasFarm) {
    console.log("obligation farm user state:", obligationFarmUserState?.toBase58());
  }

  let initObligationTx = new Transaction();

  // Add ATA creation if needed
  if (needsAtaCreation) {
    initObligationTx.add(
      createAssociatedTokenAccountInstruction(
        user.wallet.publicKey, // payer
        ata, // ata
        user.wallet.publicKey, // owner
        config.BANK_MINT, // mint
        config.TOKEN_PROGRAM // token program
      )
    );

    // Transfer 100 lamports to the ATA
    initObligationTx.add(
      SystemProgram.transfer({
        fromPubkey: user.wallet.publicKey,
        toPubkey: ata,
        lamports: 100,
      })
    );

    // Sync native to wrap the SOL
    initObligationTx.add(
      createSyncNativeInstruction(ata, config.TOKEN_PROGRAM)
    );
  }

  initObligationTx.add(
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
        // Pass farm state if configured, otherwise null
        reserveFarmState: hasFarm ? config.FARM_STATE : null,
        obligationFarmUserState: obligationFarmUserState,
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
