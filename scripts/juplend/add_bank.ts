import {
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
  AccountMeta,
} from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import {
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  getMint,
  getAssociatedTokenAddressSync,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { readFileSync } from "fs";
import { join } from "path";
import {
  JuplendConfigCompact,
  parseConfig,
  Config,
  JUPLEND_LENDING_PROGRAM_ID,
} from "./lib/utils";
import {
  deriveBankWithSeed,
  deriveLiquidityVault,
  deriveLiquidityVaultAuthority,
  deriveInsuranceVault,
  deriveInsuranceVaultAuthority,
  deriveFeeVault,
  deriveFeeVaultAuthority,
} from "../common/pdas";
import { commonSetup } from "../../lib/common-setup";
import { bs58 } from "@switchboard-xyz/common";
import { bigNumberToWrappedI80F48 } from "@mrgnlabs/mrgn-common";

/**
 * If true, send the tx. If false, output the unsigned b58 tx to console.
 */
const sendTx = false;

async function main() {
  const configFile = process.argv[2];
  if (!configFile) {
    console.error("Usage: tsx scripts/juplend/add_bank.ts <config-file>");
    console.error("Example: tsx scripts/juplend/add_bank.ts configs/usdc.json");
    process.exit(1);
  }

  const configPath = join(__dirname, configFile);
  const rawConfig = readFileSync(configPath, "utf8");
  const config = parseConfig(rawConfig);

  console.log("=== Add JupLend Bank ===\n");
  console.log("Config:", configFile);
  console.log("Bank mint:", config.BANK_MINT.toString());
  console.log("JupLend Lending:", config.JUPLEND_LENDING.toString());
  console.log();

  await addJuplendBank(sendTx, config, "/keys/staging-deploy.json");
}

export async function addJuplendBank(
  sendTx: boolean,
  config: Config,
  walletPath: string,
  version?: "current",
): Promise<PublicKey> {
  const user = commonSetup(
    sendTx,
    config.PROGRAM_ID,
    walletPath,
    config.MULTISIG_PAYER,
    version,
  );
  const connection = user.connection;
  const wallet = user.wallet;
  const program = user.program;

  // Derive bank PDA
  const [bank] = deriveBankWithSeed(
    program.programId,
    config.GROUP_KEY,
    config.BANK_MINT,
    config.SEED,
  );

  console.log("Derived Accounts:");
  console.log("  Bank:", bank.toString());
  console.log();

  // Detect token program (SPL vs Token-2022)
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
    console.log("  Using SPL Token program");
  }
  console.log();

  // Build JuplendConfigCompact
  const riskTier =
    config.RISK_TIER === "isolated" ? { isolated: {} } : { collateral: {} };

  const bankConfig: JuplendConfigCompact = {
    oracle: config.ORACLE,
    assetWeightInit: bigNumberToWrappedI80F48(
      Number(config.ASSET_WEIGHT_INIT ?? "0.8"),
    ),
    assetWeightMaint: bigNumberToWrappedI80F48(
      Number(config.ASSET_WEIGHT_MAINT ?? "0.9"),
    ),
    depositLimit: new BN(config.DEPOSIT_LIMIT ?? "1000000000000"),
    oracleSetup: config.ORACLE_SETUP,
    riskTier,
    configFlags: config.CONFIG_FLAGS ?? 1,
    totalAssetValueInitLimit: new BN(
      config.TOTAL_ASSET_VALUE_INIT_LIMIT ?? "1000000000",
    ),
    oracleMaxAge: config.ORACLE_MAX_AGE ?? 60,
    oracleMaxConfidence: 0,
  };

  console.log("Bank Configuration:");
  console.log("  Deposit Limit:", bankConfig.depositLimit.toString());
  console.log(
    "  Total Asset Value Limit:",
    bankConfig.totalAssetValueInitLimit.toString(),
  );
  console.log();

  // Derive vault PDAs
  const [liquidityVaultAuthority] = deriveLiquidityVaultAuthority(
    program.programId,
    bank,
  );
  const [liquidityVault] = deriveLiquidityVault(program.programId, bank);
  const [insuranceVaultAuthority] = deriveInsuranceVaultAuthority(
    program.programId,
    bank,
  );
  const [insuranceVault] = deriveInsuranceVault(program.programId, bank);
  const [feeVaultAuthority] = deriveFeeVaultAuthority(program.programId, bank);
  const [feeVault] = deriveFeeVault(program.programId, bank);

  // fToken vault is an ATA of liquidityVaultAuthority for fTokenMint
  const juplendFTokenVault = getAssociatedTokenAddressSync(
    config.F_TOKEN_MINT,
    liquidityVaultAuthority,
    true,
    tokenProgram,
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );

  const admin = config.ADMIN ?? wallet.publicKey;
  const feePayer = config.FEE_PAYER ?? admin;

  // Remaining accounts for oracle validation
  const oracleMeta: AccountMeta = {
    pubkey: config.ORACLE,
    isSigner: false,
    isWritable: false,
  };
  const lendingMeta: AccountMeta = {
    pubkey: config.JUPLEND_LENDING,
    isSigner: false,
    isWritable: false,
  };

  console.log("Derived accounts:");
  console.log("  liquidityVaultAuthority:", liquidityVaultAuthority.toString());
  console.log("  liquidityVault:", liquidityVault.toString());
  console.log("  fTokenVault:", juplendFTokenVault.toString());
  console.log();

  const addBankIx = await program.methods
    .lendingPoolAddBankJuplend(bankConfig, config.SEED)
    .accounts({
      group: config.GROUP_KEY,
      feePayer,
      bankMint: config.BANK_MINT,
      integrationAcc1: config.JUPLEND_LENDING,
      fTokenMint: config.F_TOKEN_MINT,
      tokenProgram,
    })
    .accountsPartial({
      admin,
    })
    .remainingAccounts([oracleMeta, lendingMeta])
    .instruction();

  const transaction = new Transaction().add(addBankIx);

  // Simulate
  transaction.feePayer = feePayer;
  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;

  if (sendTx) {
    try {
      console.log("Executing transaction...");
      const signature = await sendAndConfirmTransaction(
        connection,
        transaction,
        [wallet.payer],
      );
      console.log("Signature:", signature);
      console.log("Bank added successfully!");
    } catch (error) {
      console.error("Transaction failed:", error);
    }
  } else {
    transaction.feePayer = config.MULTISIG_PAYER;
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    const serializedTransaction = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    });
    const base58Transaction = bs58.encode(serializedTransaction);
    console.log("bank key: " + bank);
    console.log("Base58-encoded transaction:", base58Transaction);
  }

  console.log();
  console.log("JupLend bank setup complete!");

  return bank;
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
  });
}
