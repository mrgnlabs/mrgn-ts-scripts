// Call this once after each bank is made.
import {
  ComputeBudgetProgram,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { TOKEN_PROGRAM_ID } from "@mrgnlabs/mrgn-common";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { FARMS_PROGRAM_ID, KLEND_PROGRAM_ID } from "./kamino-types";
import { commonSetup } from "../../lib/common-setup";
import { makeInitObligationIx } from "./ixes-common";
import {
  getAssociatedTokenAddressSync,
  getMint,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import { deriveBaseObligation, deriveUserState } from "./pdas";
import {
  deriveLiquidityVaultAuthority,
} from "../common/pdas";

/**
 * If true, send the tx. If false, output the unsigned b58 tx to console.
 */
const sendTx = true;

type Config = {
  PROGRAM_ID: string;
  GROUP_KEY: PublicKey;

  /** Group admin (generally the MS on mainnet) */
  ADMIN: PublicKey;
  /** Pays flat sol fee to init and rent (generally the MS on mainnet) */
  FEE_PAYER?: PublicKey; // If omitted, defaults to ADMIN
  BANK: PublicKey;
  KAMINO_MARKET: PublicKey;
  /** Oracle address the Kamino Reserve uses. Typically read from reserve.config.tokenInfo.scope */
  RESERVE_ORACLE: PublicKey;
  /** Reserve Farm state. Can be read from reserve.farmCollateral. Technically optional, but almost
   * every (perhaps every?) Kamino reserve in prod has one. */
  FARM_STATE: PublicKey;
  MULTISIG_PAYER?: PublicKey; // May be omitted if not using squads
};

const config: Config = {
  PROGRAM_ID: "stag8sTKds2h4KzjUw3zKTsxbqvT4XKHdaR9X9E6Rct",
  GROUP_KEY: new PublicKey("FCPfpHA69EbS8f9KKSreTRkXbzFpunsKuYf5qNmnJjpo"),

  // BANK: new PublicKey("44WmBHm3bKvrwy1jnf9EkgX8hBT61Dz7Z9yfLCSmdEyy"), // USDS
  // BANK: new PublicKey("8u7NuUBxckF2ouC3XKFkuxurinBYQTQiTcXVyqqoyRgM"), // USDC
  BANK: new PublicKey("98sBXvVx6rHLuTWWBJG1hw1RjEEssUWwnrjfXoGmBgYk"), // SOL
  ADMIN: new PublicKey("mfC1LoEk4mpM5yx1LjwR9QLZQ49AitxxWkK5Aciw7ZC"),
  // KAMINO_MARKET: new PublicKey("6WEGfej9B9wjxRs6t4BYpb9iCXd8CpTpJ8fVSNzHCC5y"), // maple
  KAMINO_MARKET: new PublicKey("7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF"), // main

  RESERVE_ORACLE: new PublicKey("3t4JZcueEzTbVP6kLxXrL3VpWx45jDer4eqysweBchNH"),
  FARM_STATE: new PublicKey("955xWFhSDcDiUgUr4sBRtCpTLiMd4H5uZLAmgtP3R3sX"),
};

async function main() {
  await initKaminoObligation(sendTx, config, "/keys/staging-deploy.json");
}

export async function initKaminoObligation(
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
  const program = user.program;
  const connection = user.connection;

  const bank = await program.account.bank.fetch(config.BANK);
  const mint = bank.mint;

  console.log("Detecting token program for mint...");
  let tokenProgram = TOKEN_PROGRAM_ID;
  try {
    await getMint(
      connection,
      mint,
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

  console.log("init obligation for bank: " + config.BANK + "(mint: " + mint + ")");
  const [lendingVaultAuthority] = deriveLiquidityVaultAuthority(
    program.programId,
    config.BANK,
  );
  const [baseObligation] = deriveBaseObligation(
    lendingVaultAuthority,
    config.KAMINO_MARKET,
    KLEND_PROGRAM_ID,
  );

  const ata = getAssociatedTokenAddressSync(
    mint,
    user.wallet.publicKey,
    true,
    tokenProgram,
  );

  const [userState] = deriveUserState(
    FARMS_PROGRAM_ID,
    config.FARM_STATE,
    baseObligation,
  );

  let initObligationTx = new Transaction().add(
    ComputeBudgetProgram.setComputeUnitLimit({ units: 1_400_000 }),
    await makeInitObligationIx(
      program,
      {
        feePayer: config.FEE_PAYER ?? config.ADMIN,
        bank: config.BANK,
        signerTokenAccount: ata,
        lendingMarket: config.KAMINO_MARKET,
        reserveLiquidityMint: mint,
        reserve: bank.integrationAcc1,
        scopePrices: config.RESERVE_ORACLE,
        // TODO support edge cases where no farm state is active
        reserveFarmState: config.FARM_STATE,
        obligationFarmUserState: userState,
        liquidityTokenProgram: tokenProgram,
      },
      new BN(100),
    ),
  );

  if (sendTx) {
    try {
      const sigObligation = await sendAndConfirmTransaction(
        connection,
        initObligationTx,
        [user.wallet.payer],
      );
      console.log("obligation key: " + baseObligation);
      console.log("Transaction signature:", sigObligation);
    } catch (error) {
      console.error("Transaction failed:", error);
    }
  } else {
    initObligationTx.feePayer = config.MULTISIG_PAYER; // Set the fee payer to Squads wallet
    const { blockhash } = await connection.getLatestBlockhash();
    initObligationTx.recentBlockhash = blockhash;
    const serializedTransaction = initObligationTx.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    });
    const base58Transaction = bs58.encode(serializedTransaction);
    console.log("bank key: " + config.BANK);
    console.log("Base58-encoded transaction:", base58Transaction);
  }

  return baseObligation;
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
  });
}
