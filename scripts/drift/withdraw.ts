import {
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
  AccountMeta,
} from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import {
  getAssociatedTokenAddressSync,
  getMint,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  deriveDriftStatePDA,
  deriveSpotMarketVaultPDA,
  deriveDriftSignerPDA,
} from "./lib/utils";
import { BankAndOracles } from "../../lib/utils";
import { commonSetup } from "../../lib/common-setup";
import { bs58 } from "@switchboard-xyz/common";

/**
 * If true, send the tx. If false, output the unsigned b58 tx to console.
 */
const sendTx = true;

type Config = {
  PROGRAM_ID: string;
  BANK: PublicKey;
  ACCOUNT: PublicKey;
  AMOUNT: BN;
  WITHDRAW_ALL: boolean;

  DRIFT_MARKET_INDEX: number;

  /** Oracle address the Drift User uses. Can be read from bank.integrationAcc1 */
  DRIFT_ORACLE: PublicKey;

  LUT: PublicKey;
  MULTISIG_PAYER?: PublicKey; // May be omitted if not using squads
  NEW_REMAINING: BankAndOracles;
  ADD_COMPUTE_UNITS: boolean;
};

const config: Config = {
  PROGRAM_ID: "stag8sTKds2h4KzjUw3zKTsxbqvT4XKHdaR9X9E6Rct",
  BANK: new PublicKey("Ay8kyX7q2G9Yp3T6Nt8Z3p8xcMeaC19xLQjmGjTX2niq"),
  ACCOUNT: new PublicKey("FvRj5WiHZh6mU9TSsgAeJinDeSAkBmPvbJHJCqXAxCsH"),
  AMOUNT: new BN(40 * 10 ** 6), // 40 USDC
  WITHDRAW_ALL: true,

  DRIFT_MARKET_INDEX: 0, // USDC
  DRIFT_ORACLE: new PublicKey("3t4JZcueEzTbVP6kLxXrL3VpWx45jDer4eqysweBchNH"),

  LUT: new PublicKey("FtQ5uKQvFoKQ27SWY15tgBeJQnGKmKGzWqDz7kGUbeiq"),

  NEW_REMAINING: [
    new PublicKey("CVjHEnJWKELsbFt37znC2nq4KNrwTf7w42fcfySEifNu"),
    new PublicKey("DBE3N8uNjhKPRHfANdwGvCZghWXyLPdqdSbEW2XFwBiX"),
  ],
  ADD_COMPUTE_UNITS: true,
};

async function main() {
  await withdrawDrift(sendTx, config, "/.config/stage/id.json");
}

export async function withdrawDrift(
  sendTx: boolean,
  config: Config,
  walletPath: string,
  version?: "current",
) {
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

  const bank = await program.account.bank.fetch(config.BANK);
  const mint = bank.mint;

  console.log("=== Drift Withdraw ===\n");
  console.log("Bank mint:", mint);
  console.log("Amount:", config.AMOUNT, "base units");
  console.log("Withdraw all:", config.WITHDRAW_ALL);
  console.log();

  const [driftState] = deriveDriftStatePDA();
  const [driftSigner] = deriveDriftSignerPDA();
  const [driftSpotMarketVault] = deriveSpotMarketVaultPDA(
    config.DRIFT_MARKET_INDEX,
  );

  // Detect token program
  let tokenProgram = TOKEN_PROGRAM_ID;
  try {
    await getMint(connection, mint, "confirmed", TOKEN_2022_PROGRAM_ID);
    tokenProgram = TOKEN_2022_PROGRAM_ID;
    console.log("Detected Token-2022 mint");
  } catch {
    console.log("Detected SPL Token mint");
  }

  const oracleMeta: AccountMeta[] = config.NEW_REMAINING.flat().map(
    (pubkey) => {
      return { pubkey, isSigner: false, isWritable: false };
    },
  );

  const destinationTokenAccount = getAssociatedTokenAddressSync(
    mint,
    wallet.publicKey,
    false,
    tokenProgram,
  );

  console.log("Derived Accounts:");
  console.log("  Bank:", config.BANK.toString());
  console.log("  Marginfi Account:", config.ACCOUNT.toString());
  console.log("  Drift State:", driftState.toString());
  console.log(
    "  Destination Token Account:",
    destinationTokenAccount.toString(),
  );
  console.log();

  const ix = await program.methods
    .driftWithdraw(config.AMOUNT, config.WITHDRAW_ALL)
    .accounts({
      marginfiAccount: config.ACCOUNT,
      bank: config.BANK,
      destinationTokenAccount,
      driftState,
      driftSpotMarketVault,
      driftSigner,
      driftOracle: config.DRIFT_ORACLE,
      driftRewardOracle: null,
      driftRewardSpotMarket: null,
      driftRewardMint: null,
      driftRewardOracle2: null,
      driftRewardSpotMarket2: null,
      driftRewardMint2: null,
      tokenProgram,
    })
    .remainingAccounts(oracleMeta)
    .instruction();

  const transaction = new Transaction().add(ix);

  // Simulate
  transaction.feePayer = wallet.publicKey;
  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;

  console.log("Simulating driftWithdraw...");
  const simulation = await connection.simulateTransaction(transaction);

  console.log("\nProgram Logs:");
  simulation.value.logs?.forEach((log) => console.log("  " + log));

  if (simulation.value.err) {
    console.log("\nSimulation failed:");
    console.log(JSON.stringify(simulation.value.err, null, 2));
    process.exit(1);
  }

  console.log("\nSimulation successful!");
  console.log("Compute units:", simulation.value.unitsConsumed);
  console.log();

  if (sendTx) {
    try {
      console.log("Executing transaction...");
      const signature = await sendAndConfirmTransaction(
        connection,
        transaction,
        [wallet.payer],
      );
      console.log("Signature:", signature);
      console.log("✓ Withdrawal successful!");
    } catch (error) {
      console.error("Transaction failed:", error);
    }
  } else {
    transaction.feePayer = config.MULTISIG_PAYER; // Set the fee payer to Squads wallet
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    const serializedTransaction = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    });
    const base58Transaction = bs58.encode(serializedTransaction);
    console.log("deposit to: " + config.BANK);
    console.log("by account: " + config.ACCOUNT);
    console.log("Base58-encoded transaction:", base58Transaction);
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
  });
}
