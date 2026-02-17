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
import { commonSetup, registerKaminoProgram } from "../../lib/common-setup";
import { makeInitObligationIx } from "./ixes-common";
import {
  getAssociatedTokenAddressSync,
  getMint,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import { deriveBaseObligation, deriveUserState } from "./pdas";
import { deriveLiquidityVaultAuthority } from "../common/pdas";

/**
 * If true, send the tx. If false, output the unsigned b58 tx to console.
 */
const sendTx = false;

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
  MULTISIG_PAYER?: PublicKey; // May be omitted if not using squads
};

const config: Config = {
  PROGRAM_ID: "MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA",
  GROUP_KEY: new PublicKey("4qp6Fx6tnZkY5Wropq9wUYgtFxXKwE6viZxFHg3rdAG8"),

  // BANK: new PublicKey("44WmBHm3bKvrwy1jnf9EkgX8hBT61Dz7Z9yfLCSmdEyy"), // USDS
  // BANK: new PublicKey("8u7NuUBxckF2ouC3XKFkuxurinBYQTQiTcXVyqqoyRgM"), // USDC
  BANK: new PublicKey("24gdUT9SNqeizCD1dHXWgjpa6NnWSFD6TWPAnCFSJnAk"), // STKESOL
  ADMIN: new PublicKey("CS3NzMknNWtjo2pq5dqp67hQYQ8wdLPt5m67oa5mBZUX"),
  // KAMINO_MARKET: new PublicKey("6WEGfej9B9wjxRs6t4BYpb9iCXd8CpTpJ8fVSNzHCC5y"), // maple
  KAMINO_MARKET: new PublicKey("7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF"), // main

  RESERVE_ORACLE: new PublicKey("3t4JZcueEzTbVP6kLxXrL3VpWx45jDer4eqysweBchNH"),
};

async function main() {
  await initKaminoObligation(sendTx, config, "/.config/stage/id.json");
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
  registerKaminoProgram(user, KLEND_PROGRAM_ID.toString());
  const program = user.program;
  const connection = user.connection;

  const bank = await program.account.bank.fetch(config.BANK);
  const mint = bank.mint;
  const reserve = bank.integrationAcc1;

  console.log("Detecting token program for mint...");
  let tokenProgram = TOKEN_PROGRAM_ID;
  try {
    await getMint(connection, mint, "confirmed", TOKEN_2022_PROGRAM_ID);
    tokenProgram = TOKEN_2022_PROGRAM_ID;
    console.log("  Using Token-2022 program");
  } catch {
    // If it fails with Token-2022, it's a regular SPL token
    console.log("  Using SPL Token program");
  }
  console.log();

  console.log(
    "init obligation for bank: " + config.BANK + " (mint: " + mint + ")",
  );
  const [lendingVaultAuthority] = deriveLiquidityVaultAuthority(
    program.programId,
    config.BANK,
  );
  const [baseObligation] = deriveBaseObligation(
    lendingVaultAuthority,
    config.KAMINO_MARKET,
    KLEND_PROGRAM_ID,
  );

  const reserveAcc = await user.kaminoProgram.account.reserve.fetch(reserve);
  const reserveFarmState = reserveAcc.farmCollateral;

  const ata = getAssociatedTokenAddressSync(
    mint,
    user.wallet.publicKey,
    true,
    tokenProgram,
  );
  const [userState] = deriveUserState(
    FARMS_PROGRAM_ID,
    reserveFarmState,
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
        reserve: bank.integrationAcc1,
        scopePrices: config.RESERVE_ORACLE,
        reserveFarmState,
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
