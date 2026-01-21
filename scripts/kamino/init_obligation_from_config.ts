/**
 * Initialize Kamino Obligation from Config File
 *
 * Usage: npx tsx scripts/kamino/init_obligation_from_config.ts configs/<asset>_<market>.json
 *
 * This script:
 * 1. Loads the config file (must have derived values from add_bank_from_config)
 * 2. Verifies the bank exists on-chain
 * 3. Builds the kaminoInitObligation transaction
 * 4. Simulates and executes with local wallet
 *
 * NOTE: This script executes the transaction, unlike add_bank which outputs base58.
 * Run this after the add_bank transaction has been confirmed on-chain.
 */

import {
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
  ComputeBudgetProgram,
  SystemProgram,
} from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { TOKEN_PROGRAM_ID, NATIVE_MINT } from "@mrgnlabs/mrgn-common";
import {
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountIdempotentInstruction,
  createSyncNativeInstruction,
} from "@solana/spl-token";
import * as fs from "fs";
import * as path from "path";

import { commonSetup, registerKaminoProgram } from "../../lib/common-setup";
import { makeInitObligationIx } from "./ixes-common";
import { deriveLiquidityVaultAuthority } from "../common/pdas";
import { deriveBaseObligation, deriveUserState } from "./pdas";
import {
  KaminoBankConfig,
  MAINNET_PROGRAM_ID,
  MAINNET_GROUP,
} from "./lib/config_types";
import { KLEND_PROGRAM_ID, FARMS_PROGRAM_ID } from "./kamino-types";

/**
 * Default wallet path (relative to HOME)
 */
const DEFAULT_WALLET_PATH = "/.config/solana/id.json";

/**
 * Main entry point
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.error(
      "Usage: npx tsx scripts/kamino/init_obligation_from_config.ts <config_path> [wallet_path]"
    );
    console.error(
      "Example: npx tsx scripts/kamino/init_obligation_from_config.ts configs/sol_main.json"
    );
    process.exit(1);
  }

  const configPath = args[0];
  const walletPath = args[1] || DEFAULT_WALLET_PATH;

  await initObligationFromConfig(configPath, walletPath);
}

/**
 * Initialize Kamino obligation from a config file
 */
export async function initObligationFromConfig(
  configPath: string,
  walletPath: string = DEFAULT_WALLET_PATH
): Promise<PublicKey> {
  console.log("=".repeat(60));
  console.log("Kamino Init Obligation from Config");
  console.log("=".repeat(60));
  console.log("");

  // Resolve config path
  const resolvedPath = path.isAbsolute(configPath)
    ? configPath
    : path.join(__dirname, configPath);

  console.log(`Config file: ${resolvedPath}`);

  // Load config
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const config: KaminoBankConfig = require(resolvedPath);

  console.log(`Asset: ${config.asset}`);
  console.log(`Market: ${config.market}`);
  console.log("");

  // Check derived values exist
  if (!config.derived?.bankAddress) {
    console.error("ERROR: Config file missing derived values.");
    console.error("Run add_bank_from_config.ts first to populate derived values.");
    process.exit(1);
  }

  const derived = config.derived;
  console.log("--- Derived Values from Config ---");
  console.log(`Bank Address: ${derived.bankAddress}`);
  console.log(`Reserve Oracle: ${derived.reserveOracle}`);
  console.log(`Farm State: ${derived.farmState || "None"}`);
  console.log(`Token Program: ${derived.tokenProgram}`);
  console.log(`Seed: ${derived.seed}`);
  console.log("");

  // Setup connection and program with wallet
  const user = commonSetup(
    true, // Send tx
    MAINNET_PROGRAM_ID,
    walletPath,
    undefined,
    "current"
  );
  const program = user.program;
  const connection = user.connection;

  // Register Kamino program
  registerKaminoProgram(user, KLEND_PROGRAM_ID.toBase58());

  const group = new PublicKey(MAINNET_GROUP);
  const mint = new PublicKey(config.bankMint);
  const kaminoReserve = new PublicKey(config.kaminoReserve);
  const kaminoMarket = new PublicKey(config.kaminoMarket);
  const bankAddress = new PublicKey(derived.bankAddress);
  const reserveOracle = new PublicKey(derived.reserveOracle!);
  const tokenProgram = derived.tokenProgram
    ? new PublicKey(derived.tokenProgram)
    : TOKEN_PROGRAM_ID;

  // ============================================
  // Pre-flight Check: Verify bank exists
  // ============================================
  console.log("--- Pre-flight Check ---");

  const bankInfo = await connection.getAccountInfo(bankAddress);
  if (!bankInfo) {
    console.error("ERROR: Bank does not exist on-chain yet.");
    console.error("Make sure the add_bank transaction has been confirmed first.");
    console.error(`Expected bank: ${bankAddress.toBase58()}`);
    process.exit(1);
  }

  console.log(`Bank exists on-chain`);
  console.log(`Solscan: https://solscan.io/account/${bankAddress.toBase58()}`);
  console.log("");

  // ============================================
  // Derive accounts
  // ============================================
  const [lendingVaultAuthority] = deriveLiquidityVaultAuthority(
    program.programId,
    bankAddress
  );
  const [baseObligation] = deriveBaseObligation(
    lendingVaultAuthority,
    kaminoMarket,
    KLEND_PROGRAM_ID
  );

  console.log("--- Derived Accounts ---");
  console.log(`Lending Vault Authority: ${lendingVaultAuthority.toBase58()}`);
  console.log(`Base Obligation: ${baseObligation.toBase58()}`);

  // User's ATA for the mint
  const userAta = getAssociatedTokenAddressSync(
    mint,
    user.wallet.publicKey,
    true,
    tokenProgram
  );
  console.log(`User ATA: ${userAta.toBase58()}`);

  // Farm user state (if farm exists)
  let userState: PublicKey | null = null;
  let farmState: PublicKey | null = null;

  if (derived.farmState) {
    farmState = new PublicKey(derived.farmState);
    [userState] = deriveUserState(FARMS_PROGRAM_ID, farmState, baseObligation);
    console.log(`Farm State: ${farmState.toBase58()}`);
    console.log(`User State (farm): ${userState.toBase58()}`);
  } else {
    console.log("Farm State: None");
  }
  console.log("");

  // ============================================
  // Build Transaction
  // ============================================
  console.log("--- Building Transaction ---");

  const depositAmount = new BN(100);
  const tx = new Transaction().add(
    ComputeBudgetProgram.setComputeUnitLimit({ units: 1_400_000 })
  );

  // If native SOL, wrap SOL into the ATA first
  const isNativeSol = mint.equals(NATIVE_MINT);
  if (isNativeSol) {
    console.log("Native SOL detected - adding wrap instructions");

    // Create ATA if needed (idempotent)
    tx.add(
      createAssociatedTokenAccountIdempotentInstruction(
        user.wallet.publicKey,
        userAta,
        user.wallet.publicKey,
        mint,
        tokenProgram
      )
    );

    // Transfer lamports to the ATA
    tx.add(
      SystemProgram.transfer({
        fromPubkey: user.wallet.publicKey,
        toPubkey: userAta,
        lamports: depositAmount.toNumber(),
      })
    );

    // Sync native to update the wrapped balance
    tx.add(createSyncNativeInstruction(userAta, tokenProgram));
  }

  const ix = await makeInitObligationIx(
    program,
    {
      feePayer: user.wallet.publicKey,
      bank: bankAddress,
      signerTokenAccount: userAta,
      lendingMarket: kaminoMarket,
      reserveLiquidityMint: mint,
      reserve: kaminoReserve,
      scopePrices: reserveOracle,
      reserveFarmState: farmState,
      obligationFarmUserState: userState,
      liquidityTokenProgram: tokenProgram,
    },
    depositAmount
  );

  tx.add(ix);

  console.log("Transaction built successfully");
  console.log("");

  // ============================================
  // Simulate
  // ============================================
  console.log("--- Simulation ---");

  try {
    const simulation = await connection.simulateTransaction(tx, [
      user.wallet.payer,
    ]);

    if (simulation.value.err) {
      console.error("Simulation FAILED:");
      console.error(JSON.stringify(simulation.value.err, null, 2));
      if (simulation.value.logs) {
        console.error("Logs:");
        simulation.value.logs.forEach((log) => console.error(`  ${log}`));
      }
      process.exit(1);
    }

    console.log(`Simulation successful`);
    console.log(`Compute units: ${simulation.value.unitsConsumed}`);
    console.log("");
  } catch (error) {
    console.error("Simulation error:", error);
    process.exit(1);
  }

  // ============================================
  // Execute Transaction
  // ============================================
  console.log("--- Executing Transaction ---");

  try {
    const signature = await sendAndConfirmTransaction(connection, tx, [
      user.wallet.payer,
    ]);

    console.log("Transaction successful!");
    console.log(`Signature: ${signature}`);
    console.log(`Solscan: https://solscan.io/tx/${signature}`);
    console.log("");
    console.log(`Obligation: ${baseObligation.toBase58()}`);
    console.log(`Solscan: https://solscan.io/account/${baseObligation.toBase58()}`);
    console.log("");

    // Update output.md file with obligation info
    const outputPath = resolvedPath.replace(".json", ".output.md");
    if (fs.existsSync(outputPath)) {
      let outputContent = fs.readFileSync(outputPath, "utf-8");

      const obligationSection = `
## Init Obligation

**Executed:** ${new Date().toISOString()}

| Field | Value |
|-------|-------|
| Obligation | \`${baseObligation.toBase58()}\` |
| Signature | \`${signature}\` |
| Solscan TX | [View](https://solscan.io/tx/${signature}) |
| Solscan Obligation | [View](https://solscan.io/account/${baseObligation.toBase58()}) |
`;

      // Append before "## Next Steps" or at the end
      if (outputContent.includes("## Next Steps")) {
        outputContent = outputContent.replace("## Next Steps", obligationSection + "\n## Next Steps");
      } else {
        outputContent += obligationSection;
      }

      fs.writeFileSync(outputPath, outputContent);
      console.log(`Updated: ${outputPath}`);
    }

    console.log("=".repeat(60));
    console.log("COMPLETE");
    console.log("=".repeat(60));

    return baseObligation;
  } catch (error) {
    console.error("Transaction failed:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
