import { Program } from "@coral-xyz/anchor";
import { bigNumberToWrappedI80F48, WrappedI80F48 } from "@mrgnlabs/mrgn-common";
import { PublicKey, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import { Marginfi } from "../idl/marginfi1.3";
import { commonSetup } from "../lib/common-setup";
import { EmodeTag, MAX_EMODE_ENTRIES } from "../lib/constants";
import { I80F48_ZERO } from "./utils";
import { entriesIn, groupBy } from "lodash";

/**
 * If true, send the tx. If false, output the unsigned b58 tx to console.
 */
const sendTx = true;

type Config = {
  PROGRAM_ID: string;
  MULTISIG?: PublicKey;
};

const config: Config = {
  PROGRAM_ID: "MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA",
  // Not required if sending without multisig.
  MULTISIG: new PublicKey("CYXEgwbPHu2f9cY3mcUkinzDoDcsSan7myh1uBvYRbEw"),
};

interface PairConfig {
  lend: EmodeTag;
  borrow: EmodeTag;
  /** True to apply to isolated banks, false otherwise */
  appIso: boolean;
  /** Initial weight, as a float, e.g. for 90% pass 0.9 */
  init: number;
  maint: number;
}

// // STEP 1: Map each tag to the bank PublicKeys that will use that tag. NOTE: If a bank currently has
// // an emode entry and you want to REMOVE IT, make sure that bank appears here too (with a dummy
// // value for the tag)
// const BANK_KEYS: Record<EmodeTag, PublicKey[]> = {
//   // SOL
//   [EmodeTag.SOL]: [new PublicKey("3evdJSa25nsUiZzEUzd92UNa13TPRJrje1dRyiQP5Lhp")],
//   // Liquid staking tokens that are SOL correlated
//   [EmodeTag.LST]: [
//     new PublicKey("EJuhmswifV6wumS28Sfr5W8B18CJ29m1ZNKkhbhbYDCA"), // Jup SOL
//     new PublicKey("7QYMReTbACXKeX3fJWeJfxJs1gKRrCyWXKq63fUtBDNJ"), // hSOL
//   ],
//   // Stablecoins (~1:1 correlated to each other)
//   [EmodeTag.STABLE]: [
//     new PublicKey("Ek5JSFJFD8QgXM6rPDCzf31XhDp1q3xezaWYSkJWqbqc"), // USDC
//     new PublicKey("Fe5QkKPVAh629UPP5aJ8sDZu8HTfe6M26jDQkKyXVhoA"), // PyUSD
//     new PublicKey("FNEoFRVnmBF5KpRtghHJrJPbdbMjry1E33dNzzHY9UGC"), // UXD
//   ],
//   // Memecoins
//   [EmodeTag.MEME]: [
//     new PublicKey("DDLVJyj5sT3knnVDoTifrtQmroLnRCkBmGZ1QXCUDUUd"), // WIF
//     new PublicKey("GNw2sfgnFX4vermA94de6tgTyftpQHMvWLqFEceVZ1ad"), // DUST
//   ],
//   // Staked collateral
//   [EmodeTag.STAKE]: [
//     new PublicKey("3jt43usVm7qL1N5qPvbzYHWQRxamPCRhri4CxwDrf6aL"), // Cool
//     new PublicKey("4Gg6pW1U8W6ZQ22TbUWYRetx2nxjhUAydfKoCTSHhkkG"), // Phantom
//   ],
// };

// // STEP 2: Construct the pairs of Emode advantages that will be offered
// const PAIR_TABLE: PairConfig[] = [
//   // In plain English, when lending X and borrowing Y, offer rate A/B
//   { lend: EmodeTag.SOL, borrow: EmodeTag.LST, appIso: true, init: 0.9, maint: 0.95 },
//   { lend: EmodeTag.SOL, borrow: EmodeTag.STABLE, appIso: true, init: 0.85, maint: 0.9 },

//   { lend: EmodeTag.LST, borrow: EmodeTag.SOL, appIso: true, init: 0.8, maint: 0.85 },
//   { lend: EmodeTag.LST, borrow: EmodeTag.LST, appIso: true, init: 0.75, maint: 0.8 },

//   { lend: EmodeTag.STABLE, borrow: EmodeTag.STABLE, appIso: true, init: 0.95, maint: 0.97 },
//   { lend: EmodeTag.STABLE, borrow: EmodeTag.SOL, appIso: true, init: 0.95, maint: 0.97 },
//   { lend: EmodeTag.STABLE, borrow: EmodeTag.MEME, appIso: true, init: 0.15, maint: 0.25 },

//   { lend: EmodeTag.MEME, borrow: EmodeTag.MEME, appIso: true, init: 0.2, maint: 0.25 },
//   { lend: EmodeTag.MEME, borrow: EmodeTag.STABLE, appIso: true, init: 0.15, maint: 0.25 },
//   { lend: EmodeTag.MEME, borrow: EmodeTag.SOL, appIso: true, init: 0.15, maint: 0.25 },
//   { lend: EmodeTag.MEME, borrow: EmodeTag.LST, appIso: true, init: 0.1, maint: 0.2 },

//   { lend: EmodeTag.STAKE, borrow: EmodeTag.SOL, appIso: true, init: 0.98, maint: 1 },
// ];

const BANK_KEYS: Record<EmodeTag, PublicKey[]> = {
  // SOL
  [EmodeTag.SOL]: [new PublicKey("CCKtUs6Cgwo4aaQUmBPmyoApH2gUDErxNZCAntD6LYGh")],
  // Liquid staking tokens that are SOL correlated
  [EmodeTag.LST_T1]: [
    new PublicKey("22DcjMZrMwC5Bpa5AGBsmjc5V9VuQrXG6N9ZtdUNyYGE"), // msol
    new PublicKey("6hS9i46WyTq1KXcoa2Chas2Txh9TJAVr6n1t3tnrE23K"), // bsol
    new PublicKey("DMoqjmsuoru986HgfjqrKEvPv8YBufvBGADHUonkadC5"), // lst (our own)
    new PublicKey("8LaUZadNqtzuCG7iCvZd7d5cbquuYfv19KjAg6GPuuCb"), // jupsol
    new PublicKey("Bohoc1ikHLD7xKJuzTyiTyCwzaL5N7ggJQu75A8mKYM8"), // jitosol
  ],
  // Liquid staking tokens with a smaller market cap
  [EmodeTag.LST_T2]: [
    new PublicKey("GJCi1uj3kYPZ64puA5sLUiCQfFapxT2xnREzrbDzFkYY"), // hsol
    new PublicKey("4YipZHMNQjip1LrG3uF2fj1G5ieWQ9QRQRy1jhAWWKUZ"), // bbSol
    new PublicKey("FVVKPocxQqJNjDTjzvT3HFXte5oarfp29vJ9tqjAPUW4"), // bnSol
  ],
};

// STEP 2: Construct the pairs of Emode advantages that will be offered
const PAIR_TABLE: PairConfig[] = [
  // In plain English, when lending X and borrowing Y, offer rate A/B
  { lend: EmodeTag.SOL, borrow: EmodeTag.LST_T1, appIso: true, init: 0.9, maint: 0.95 },
  { lend: EmodeTag.SOL, borrow: EmodeTag.LST_T2, appIso: true, init: 0.85, maint: 0.95 },

  { lend: EmodeTag.LST_T1, borrow: EmodeTag.SOL, appIso: true, init: 0.992, maint: 0.999 }, // UPDATE
  { lend: EmodeTag.LST_T1, borrow: EmodeTag.LST_T1, appIso: true, init: 0.88, maint: 0.93 },
  { lend: EmodeTag.LST_T1, borrow: EmodeTag.LST_T2, appIso: true, init: 0.85, maint: 0.9 },

  { lend: EmodeTag.LST_T2, borrow: EmodeTag.SOL, appIso: true, init: 0.955, maint: 0.985 }, // UPDATE
  { lend: EmodeTag.LST_T2, borrow: EmodeTag.LST_T1, appIso: true, init: 0.8, maint: 0.85 },
  { lend: EmodeTag.LST_T2, borrow: EmodeTag.LST_T2, appIso: true, init: 0.75, maint: 0.85 },
];

async function main() {
  const user = commonSetup(sendTx, config.PROGRAM_ID, "/keys/emode-admin.json", config.MULTISIG, "1.3");
  const program = user.program;
  const connection = user.connection;

  const setups: ConfigureBankEmodeArgs[] = [];

  for (const [borrowTagStr, pairs] of Object.entries(groupBy(PAIR_TABLE, (p) => p.borrow))) {
    const borrowTag = Number(borrowTagStr) as EmodeTag;
    const entries: EmodeEntry[] = (pairs as PairConfig[]).map((p) => ({
      collateralBankEmodeTag: p.lend,
      flags: p.appIso ? 1 : 0,
      pad0: [0, 0, 0, 0, 0],
      assetWeightInit: bigNumberToWrappedI80F48(p.init),
      assetWeightMaint: bigNumberToWrappedI80F48(p.maint),
    }));

    // One setup per bank key under this borrow tag
    for (const bankPubkey of BANK_KEYS[borrowTag] || []) {
      console.log("preparing to add tag " + borrowTag + " to bank " + bankPubkey);
      setups.push({
        bank: bankPubkey,
        tag: borrowTag,
        entries: entries,
      });
    }
  }

  // Deal with banks that need a tag set, but have no entries in the borrow column (e.g. Staked
  // collateral)
  for (const borrowTagKey of Object.keys(BANK_KEYS)) {
    const borrowTag = Number(borrowTagKey) as EmodeTag;
    if (!setups.some((s) => s.tag === borrowTag)) {
      for (const bankPubkey of BANK_KEYS[borrowTag]) {
        console.log(`preparing to add tag ${borrowTag} to bank ${bankPubkey} with EMPTY entries`);
        setups.push({
          bank: bankPubkey,
          tag: borrowTag,
          entries: [],
        });
      }
    }
  }

  if (sendTx) {
    for (const setup of setups) {
      const tx = new Transaction();
      console.log(`Configuring ${setup.bank.toString()} with tag (${setup.tag}) using ${setup.entries.length} entries`);
      tx.add(
        await configBankEmode(program, {
          bank: setup.bank,
          tag: setup.tag,
          entries: setup.entries,
        })
      );

      try {
        const signature = await sendAndConfirmTransaction(connection, tx, [user.wallet.payer]);
        console.log("✅ Transaction signature:", signature);
      } catch (error) {
        console.error("❌ Transaction failed:", error);
      }
    }
  } else {
    // TODO output a series of bs58 encoded txes in pairs?
    // transaction.feePayer = config.MULTISIG;
    // const { blockhash } = await user.connection.getLatestBlockhash();
    // transaction.recentBlockhash = blockhash;
    // const serializedTransaction = transaction.serialize({
    //   requireAllSignatures: false,
    //   verifySignatures: false,
    // });
    // const base58Transaction = bs58.encode(serializedTransaction);
    // console.log("Base58-encoded transaction:", base58Transaction);
  }
}

main().catch((err) => {
  console.error(err);
});

type ConfigureBankEmodeArgs = {
  bank: PublicKey;
  tag: number;
  /** Must be `MAX_EMODE_ENTRIES` or fewer, see `newEmodeEntry` */
  entries: EmodeEntry[];
};

function configBankEmode(program: Program<Marginfi>, args: ConfigureBankEmodeArgs) {
  const paddedEntries = padEmodeEntries(args.entries);

  const ix = program.methods
    .lendingPoolConfigureBankEmode(args.tag, paddedEntries)
    .accounts({
      // group: // implied from bank
      // emode_admin: // implied from group
      bank: args.bank,
    })
    .instruction();

  return ix;
}

function padEmodeEntries(entries: EmodeEntry[]): EmodeEntry[] {
  if (entries.length > MAX_EMODE_ENTRIES) {
    throw new Error(`Too many entries provided. Maximum allowed is ${MAX_EMODE_ENTRIES}`);
  }
  const padded = [...entries];
  while (padded.length < MAX_EMODE_ENTRIES) {
    padded.push({
      collateralBankEmodeTag: 0,
      flags: 0,
      pad0: [0, 0, 0, 0, 0],
      assetWeightInit: I80F48_ZERO,
      assetWeightMaint: I80F48_ZERO,
    });
  }
  return padded;
}

type EmodeEntry = {
  collateralBankEmodeTag: number;
  flags: number;
  pad0: number[];
  assetWeightInit: WrappedI80F48;
  assetWeightMaint: WrappedI80F48;
};

function newEmodeEntry(
  collateralBankEmodeTag: number,
  flags: number,
  assetWeightInit: WrappedI80F48,
  assetWeightMaint: WrappedI80F48
): EmodeEntry {
  return {
    collateralBankEmodeTag,
    flags,
    pad0: [0, 0, 0, 0, 0],
    assetWeightInit,
    assetWeightMaint,
  };
}

// Proposed 07/10/2025

// const BANK_KEYS: Record<EmodeTag, PublicKey[]> = {
//   // SOL
//   [EmodeTag.SOL]: [new PublicKey("CCKtUs6Cgwo4aaQUmBPmyoApH2gUDErxNZCAntD6LYGh")],
//   // Liquid staking tokens that are SOL correlated
//   [EmodeTag.LST_T1]: [
//     new PublicKey("22DcjMZrMwC5Bpa5AGBsmjc5V9VuQrXG6N9ZtdUNyYGE"), // msol
//     new PublicKey("6hS9i46WyTq1KXcoa2Chas2Txh9TJAVr6n1t3tnrE23K"), // bsol
//     new PublicKey("DMoqjmsuoru986HgfjqrKEvPv8YBufvBGADHUonkadC5"), // lst (our own)
//     new PublicKey("8LaUZadNqtzuCG7iCvZd7d5cbquuYfv19KjAg6GPuuCb"), // jupsol
//     new PublicKey("Bohoc1ikHLD7xKJuzTyiTyCwzaL5N7ggJQu75A8mKYM8"), // jitosol
//   ],
//   // Liquid staking tokens with a smaller market cap
//   [EmodeTag.LST_T2]: [
//     new PublicKey("GJCi1uj3kYPZ64puA5sLUiCQfFapxT2xnREzrbDzFkYY"), // hsol
//     new PublicKey("4YipZHMNQjip1LrG3uF2fj1G5ieWQ9QRQRy1jhAWWKUZ"), // bbSol
//     new PublicKey("FVVKPocxQqJNjDTjzvT3HFXte5oarfp29vJ9tqjAPUW4"), // bnSol
//   ],
// };

// // STEP 2: Construct the pairs of Emode advantages that will be offered
// const PAIR_TABLE: PairConfig[] = [
//   // In plain English, when lending X and borrowing Y, offer rate A/B
//   { lend: EmodeTag.SOL, borrow: EmodeTag.LST_T1, appIso: true, init: 0.90, maint: 0.95 },
//   { lend: EmodeTag.SOL, borrow: EmodeTag.LST_T2, appIso: true, init: 0.85, maint: 0.95 },

//   { lend: EmodeTag.LST_T1, borrow: EmodeTag.SOL, appIso: true, init: 0.90, maint: 0.95 },
//   { lend: EmodeTag.LST_T1, borrow: EmodeTag.LST_T2, appIso: true, init: 0.85, maint: 0.90 },

//   { lend: EmodeTag.LST_T2, borrow: EmodeTag.SOL, appIso: true, init: 0.85, maint: 0.90 },
//   { lend: EmodeTag.LST_T2, borrow: EmodeTag.LST_T1, appIso: true, init: 0.80, maint: 0.85 },
// ];
