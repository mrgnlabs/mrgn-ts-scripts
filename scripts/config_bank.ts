import {
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { bigNumberToWrappedI80F48, WrappedI80F48 } from "@mrgnlabs/mrgn-common";
import { InterestRateConfigRaw } from "@mrgnlabs/marginfi-client-v2";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { commonSetup } from "../lib/common-setup";
import { u32MAX } from "../lib/constants";

/**
 * If true, send the tx. If false, output the unsigned b58 tx to console.
 */
const sendTx = false;

export type Config = {
  PROGRAM_ID: string;
  BANK: PublicKey;
  ADMIN: PublicKey;

  MULTISIG_PAYER?: PublicKey; // May be omitted if not using squads
};

const config: Config = {
  PROGRAM_ID: "MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA",
  BANK: new PublicKey("BeNBJrAh1tZg5sqgt8D6AWKJLD5KkBrfZvtcgd7EuiAR"),
  // 4YipZHMNQjip1LrG3uF2fj1G5ieWQ9QRQRy1jhAWWKUZ
  // FVVKPocxQqJNjDTjzvT3HFXte5oarfp29vJ9tqjAPUW4
  // 6hS9i46WyTq1KXcoa2Chas2Txh9TJAVr6n1t3tnrE23K
  // Bohoc1ikHLD7xKJuzTyiTyCwzaL5N7ggJQu75A8mKYM8
  // DMoqjmsuoru986HgfjqrKEvPv8YBufvBGADHUonkadC5
  // CCKtUs6Cgwo4aaQUmBPmyoApH2gUDErxNZCAntD6LYGh
  // 22DcjMZrMwC5Bpa5AGBsmjc5V9VuQrXG6N9ZtdUNyYGE
  ADMIN: new PublicKey("CYXEgwbPHu2f9cY3mcUkinzDoDcsSan7myh1uBvYRbEw"),

  MULTISIG_PAYER: new PublicKey("CYXEgwbPHu2f9cY3mcUkinzDoDcsSan7myh1uBvYRbEw"),
};

export const bankConfigOpt = () => {
  let bankConfigOpt: BankConfigOptRaw = {
    assetWeightInit: null, // bigNumberToWrappedI80F48(.9)
    assetWeightMaint: null,
    liabilityWeightInit: null,
    liabilityWeightMaint: null,
    depositLimit: new BN(455_000 * 10 ** 6),
    borrowLimit: new BN(385_000 * 10 ** 6),
    riskTier: null, // { collateral: {} }
    assetTag: null,
    totalAssetValueInitLimit: null,
    interestRateConfig: {
      protocolOriginationFee: null,
      protocolIrFee: null,
      protocolFixedFeeApr: null,
      insuranceIrFee: null,
      insuranceFeeFixedApr: null,
      maxInterestRate: null,
      optimalUtilizationRate: null,
      plateauInterestRate: null,
    },
    operationalState: { operational: {} }, // { reduceOnly: {} },
    oracleMaxAge: null,
    oracleMaxConfidence: null, // 10% = u32MAX * 0.10
    permissionlessBadDebtSettlement: null,
    freezeSettings: null,
  };

  return bankConfigOpt;
};

// Example input

// export const bankConfigOpt = () => {
//   let bankConfigOpt: BankConfigOptRaw = {
//     assetWeightInit: null, // bigNumberToWrappedI80F48(.9)
//     assetWeightMaint: null,
//     liabilityWeightInit: bigNumberToWrappedI80F48(1.15),
//     liabilityWeightMaint: bigNumberToWrappedI80F48(1.05),
//     depositLimit: new BN(10000000),
//     borrowLimit: null,
//     riskTier: null, // { collateral: {} }
//     assetTag: null,
//     totalAssetValueInitLimit: null,
//     interestRateConfig: {
//       protocolOriginationFee: null,
//       protocolIrFee: bigNumberToWrappedI80F48(0.05),
//       protocolFixedFeeApr: bigNumberToWrappedI80F48(0.0001),
//       insuranceIrFee: null,
//       insuranceFeeFixedApr: null,
//       maxInterestRate: bigNumberToWrappedI80F48(1),
//       optimalUtilizationRate: bigNumberToWrappedI80F48(.85),
//       plateauInterestRate: bigNumberToWrappedI80F48(.075),
//     },
//     operationalState: null, // { reduceOnly: {} },
//     oracleMaxAge: null,
//     oracleMaxConfidence: null, // 10% = u32MAX * 0.10
//     permissionlessBadDebtSettlement: null,
//     freezeSettings: null,
//   };

//   return bankConfigOpt;
// };

async function main() {
  let bankConfig = bankConfigOpt();

  const user = commonSetup(
    sendTx,
    config.PROGRAM_ID,
    "/keys/staging-deploy.json",
    config.MULTISIG_PAYER,
    "current"
  );
  const program = user.program;
  const connection = user.connection;

  const transaction = new Transaction();
  transaction.add(
    await program.methods
      .lendingPoolConfigureBank(bankConfig)
      .accounts({
        // group: config.GROUP_KEY,
        // admin: config.ADMIN,
        bank: config.BANK,
      })
      .accountsPartial({
        admin: config.ADMIN,
      })
      .instruction()
  );

  if (sendTx) {
    try {
      const signature = await sendAndConfirmTransaction(
        connection,
        transaction,
        [user.wallet.payer]
      );
      console.log("Transaction signature:", signature);
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
    console.log("Base58-encoded transaction:", base58Transaction);
  }
}

const ASSET_TAG_DEFAULT = 0;
const ASSET_TAG_SOL = 1;
const ASSET_TAG_STAKED = 2;

type BankConfigOptRaw = {
  assetWeightInit: WrappedI80F48 | null;
  assetWeightMaint: WrappedI80F48 | null;

  liabilityWeightInit: WrappedI80F48 | null;
  liabilityWeightMaint: WrappedI80F48 | null;

  depositLimit: BN | null;
  borrowLimit: BN | null;
  riskTier: { collateral: {} } | { isolated: {} } | null;
  assetTag: number;
  totalAssetValueInitLimit: BN | null;

  interestRateConfig: InterestRateConfigRaw | null;
  operationalState:
    | { paused: {} }
    | { operational: {} }
    | { reduceOnly: {} }
    | null;

  oracleMaxAge: number | null;
  oracleMaxConfidence: number | null;
  permissionlessBadDebtSettlement: boolean | null;
  freezeSettings: boolean | null;
};

main().catch((err) => {
  console.error(err);
});

/*
05/06/2025 Fee adjustment for USDC

****Competitors's front end 1****
- Lending rate: 5.1% 
- Borrow rate: 12.39%

****Competitors's front end 2****
- Lending rate: 4.9% 
- Borrow rate: 7.71%


****Our Old Settings****
Optimal util rate = 85%, plateau = 10%, 
protocol fixed fee = 1%, ir fee = 12.5%

Current utilization: 23,453,583 / 40,502,614 = 57.90%
Base rate: (57.90 / 85) * 10% = 6.811%

- Lending rate = 6.811 * .5790 = 3.943%
- Borrow rate = 6.811 * (1.125) + 1 = 8.662%

****Proposed New Settings (changes in [])****
Optimal util rate = 85%, plateau = 10%, 
protocol fixed fee ~= [0%], ir fee = [6%]

Current utilization: 23,453,583 / 40,502,614 = 57.90%
Base rate: (57.90 / 85) * 10% = 6.811%

- Lending rate = 6.811 * .5790 = 3.943%
- Borrow rate = 6.811 * (1.06) + 0 = [7.219%]

****If new settings reach ~80% utilization (Like Competitor)
Base rate: (80 / 85) * 10% = 9.411%

- Lending rate = 9.411 * 0.8 = 7.528%
- Borrow rate = 9.411 * (1.06) = 9.975%

 */

/*
04/29/2025 Fee adjustment for SOL

****Competitors's front end****
- Lending rate: 5.39% 
- Borrow rate: 7.39%

****Our Old Settings****
Optimal util rate = 80%, plateau = 7.5%, 
protocol fixed fee ~= 0%, ir fee = 6%

Current utilization: 133,496 / 182,244 = 73.25%
Base rate: (73.25 / 80) * 7.5% = 6.867%

- Lending rate = 6.867 * 73.25 = 5.030%
- Borrow rate = 6.867 * (1.06) = 7.279%

****Proposed New Settings (changes in [])****
Optimal util rate = [90%], plateau = 7.5%, 
protocol fixed fee ~= 0%, ir fee = [4%]

Current utilization: 133,496 / 182,244 = 73.25%
Base rate: (73.25 / 90) * 7.5% = 6.104%

- Lending rate = 6.104 * 0.7325 = 4.471%
- Borrow rate = 6.104 * (1.04) = 6.348%

****If new settings reach 85% utilization (Like Kamino)
Base rate: (85 / 90) * 7.5% = 7.083%

- Lending rate = 7.083 * 0.85 = 6.02%
- Borrow rate = 7.083 * (1.04) = 7.366%

 */
