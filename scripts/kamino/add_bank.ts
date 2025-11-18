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
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";

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
  FEE_PAYER: PublicKey;
  BANK_MINT: PublicKey;
  KAMINO_RESERVE: PublicKey;
  KAMINO_MARKET: PublicKey;
  SEED: number;
  TOKEN_PROGRAM: PublicKey;
  MULTISIG_PAYER?: PublicKey; // May be omitted if not using squads
};

const config: Config = {
  PROGRAM_ID: "MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA",
  GROUP_KEY: new PublicKey("8D7qgu5153s3dHCbnHviijJyJ3CcJAj1QRX46yW2eSu1"),
  ORACLE: new PublicKey("Dpw1EAVrSB1ibxiDQyTAW6Zip3J4Btk2x4SgApQCeFbX"),
  ORACLE_TYPE: { kaminoPythPush: {} },
  ADMIN: new PublicKey("6DdJqQYD8AizuXiCkbn19LiyWRwUsRMzy2Sgyoyasyj7"),
  FEE_PAYER: new PublicKey("6DdJqQYD8AizuXiCkbn19LiyWRwUsRMzy2Sgyoyasyj7"),
  BANK_MINT: new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"), // usdc
  KAMINO_RESERVE: new PublicKey("D6q6wuQSrifJKZYpR1M8R4YawnLDtDsMmWM1NbBmgJ59"), // usdc
  KAMINO_MARKET: new PublicKey("7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF"), // main
  SEED: 7,
  TOKEN_PROGRAM: TOKEN_PROGRAM_ID,
};

const bankConfig: KaminoConfigCompact = {
  assetWeightInit: bigNumberToWrappedI80F48(1.0),
  assetWeightMaint: bigNumberToWrappedI80F48(1.0),
  depositLimit: new BN(100 * 10 ** 6),
  operationalState: { operational: {} },
  riskTier: { collateral: {} },
  totalAssetValueInitLimit: new BN(20000000),
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
    "/.config/stage/id.json",
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
