import {
  AccountMeta,
  ComputeBudgetProgram,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import {
  bigNumberToWrappedI80F48,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  WrappedI80F48,
} from "@mrgnlabs/mrgn-common";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import {
  defaultKaminoBankConfig,
  KaminoConfigCompact,
  KLEND_PROGRAM_ID,
  OracleSetupRawWithKamino,
} from "./kamino-types";
import { commonSetup } from "../../lib/common-setup";
import { makeAddKaminoBankIx, makeInitObligationIx } from "./ixes-common";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { deriveBaseObligation } from "./pdas";

/**
 * If true, send the tx. If false, output the unsigned b58 tx to console.
 */
const sendTx = true;

const createBank = false;
const createObligation = true;

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
  TOKEN_PROGRAM: PublicKey;
  MULTISIG_PAYER?: PublicKey; // May be omitted if not using squads
};

const config: Config = {
  PROGRAM_ID: "5UDghkpgW1HfYSrmEj2iAApHShqU44H6PKTAar9LL9bY",
  GROUP_KEY: new PublicKey("ERBiJdWtnVBBd4gFm7YVHT3a776x5NbGbJBR5BDvsxtj"),
  ORACLE: new PublicKey("Dpw1EAVrSB1ibxiDQyTAW6Zip3J4Btk2x4SgApQCeFbX"),
  ORACLE_TYPE: { kaminoPythPush: {} },
  ADMIN: new PublicKey("725Z4QQUVhRiXcCdf4cQTrxXYmQXyW9zgVkW5PDVSJz4"),
  FEE_PAYER: new PublicKey("725Z4QQUVhRiXcCdf4cQTrxXYmQXyW9zgVkW5PDVSJz4"),
  BANK_MINT: new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"),
  KAMINO_RESERVE: new PublicKey("D6q6wuQSrifJKZYpR1M8R4YawnLDtDsMmWM1NbBmgJ59"),
  KAMINO_MARKET: new PublicKey("7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF"),
  SEED: 0,
  TOKEN_PROGRAM: TOKEN_PROGRAM_ID,

  MULTISIG_PAYER: new PublicKey("CYXEgwbPHu2f9cY3mcUkinzDoDcsSan7myh1uBvYRbEw"),
};

const bankConfig: KaminoConfigCompact = {
  assetWeightInit: bigNumberToWrappedI80F48(0.6),
  assetWeightMaint: bigNumberToWrappedI80F48(0.7),
  depositLimit: new BN(10 * 10 ** 8),
  operationalState: { operational: {} },
  riskTier: { collateral: {} },
  totalAssetValueInitLimit: new BN(2000000),
  oracleMaxAge: 70,
  oracleMaxConfidence: 0,
  oracle: config.ORACLE,
  oracleSetup: config.ORACLE_TYPE,
  configFlags: 0,
};

async function main() {
  console.log("adding bank to group: " + config.GROUP_KEY);
  const user = commonSetup(
    sendTx,
    config.PROGRAM_ID,
    "/keys/zerotrade_admin.json",
    config.MULTISIG_PAYER,
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
  const [baseObligation] = deriveBaseObligation(
    bankKey,
    config.KAMINO_MARKET,
    KLEND_PROGRAM_ID
  );

  const ata = getAssociatedTokenAddressSync(
    config.BANK_MINT,
    user.wallet.publicKey,
    true,
    config.TOKEN_PROGRAM
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
        tokenProgram: config.TOKEN_PROGRAM,
        admin: config.ADMIN,
      },
      {
        seed: new BN(config.SEED),
        config: bankConfig,
      }
    )
  );

  let initObligationTx = new Transaction().add(
    ComputeBudgetProgram.setComputeUnitLimit({ units: 1_400_000 }),
    await makeInitObligationIx(
      program,
      {
        feePayer: config.FEE_PAYER,
        bank: bankKey,
        signerTokenAccount: ata,
        lendingMarket: config.KAMINO_MARKET,
        reserveLiquidityMint: config.BANK_MINT,
        reserve: config.KAMINO_RESERVE,
        pythOracle: config.ORACLE,
        // reserveFarmState: farmState,
        // obligationFarmUserState: userState,
      },
      new BN(100)
    )
  );

  if (sendTx) {
    try {
      if (createBank) {
        const sigInit = await sendAndConfirmTransaction(
          connection,
          initBankTx,
          [user.wallet.payer]
        );
        console.log("bank key: " + bankKey);
        console.log("Transaction signature:", sigInit);
      }

      if (createObligation) {
        const sigObligation = await sendAndConfirmTransaction(
          connection,
          initObligationTx,
          [user.wallet.payer]
        );
        console.log("obligation key: " + baseObligation);
        console.log("Transaction signature:", sigObligation);
      }
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

const deriveBankWithSeed = (
  programId: PublicKey,
  group: PublicKey,
  bankMint: PublicKey,
  seed: BN
) => {
  return PublicKey.findProgramAddressSync(
    [group.toBuffer(), bankMint.toBuffer(), seed.toArrayLike(Buffer, "le", 8)],
    programId
  );
};

main().catch((err) => {
  console.error(err);
});
