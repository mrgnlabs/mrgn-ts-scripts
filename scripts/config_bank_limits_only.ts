import {
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { commonSetup } from "../lib/common-setup";
import { cap } from "./utils";

/**
 * If true, send the tx. If false, output the unsigned b58 tx to console.
 */
const sendTx = false;

export type Config = {
  PROGRAM_ID: string;
  LIMIT_ADMIN: PublicKey;
  MULTISIG_PAYER?: PublicKey; // May be omitted if not using squads
};

const config: Config = {
  PROGRAM_ID: "MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA",
  LIMIT_ADMIN: new PublicKey("BACjgGYJYwVRRpnHJfcjykfkp2Xu118ghx5fYL1wgY7p"),
  MULTISIG_PAYER: new PublicKey("BACjgGYJYwVRRpnHJfcjykfkp2Xu118ghx5fYL1wgY7p"),
};

export type BankLimitsEntry = {
  bank: PublicKey;
  depositLimit: BN | null;
  borrowLimit: BN | null;
  initValue: BN | null;
};

/*
UPDATE PLAN
              deposit cap     borrow cap           mint decimals
    $WIF	    12,000,000	    6,000               6
    Bonk	    900,000,000,000	5,000,000,000       5
    CLOUD	    5,000,000	      500,000             9
    (W) ETH	  5,000	          100                 8
    HNT	      1,500,000	      150,000             8
    JLP	      1,500,000	      600,000             6
    JUP	      15,000,000	    100,000             6
    PUMP	    400,000,000	    40,000,000          6
    PYTH	    6,000,000	      2,500,000           6
    RENDER	  500,000	        50,000              8
    TNSR	    2,000,000	      100,000             9
    W	        2,500,000	      2,500,000           6
    WBTC	    300	            10                  8
 */

/**
 * Provide as many entries as you want, while noting that tx size limits will eventually apply
 *  (though using a LUT can help).
 */
const bankLimits: BankLimitsEntry[] = [
  // $WIF — deposit 12,000,000 * 10^6, borrow 6,000 * 10^6, decimals=6
  {
    bank: new PublicKey("9dpu8KL5ABYiD3WP2Cnajzg1XaotcJvZspv29Y1Y3tn1"),
    depositLimit: cap(12_000_000, 6),
    borrowLimit: cap(6_000, 6),
    initValue: null,
  },

  // Bonk — deposit 900,000,000,000 * 10^5, borrow 5,000,000,000 * 10^5, decimals=5
  {
    bank: new PublicKey("DeyH7QxWvnbbaVB4zFrf4hoq7Q8z1ZT14co42BGwGtfM"),
    depositLimit: cap(900_000_000_000, 5),
    borrowLimit: cap(5_000_000_000, 5),
    initValue: null,
  },

  // CLOUD — deposit 5,000,000 * 10^9, borrow 500,000 * 10^9, decimals=9
  {
    bank: new PublicKey("4kNXetv8hSv9PzvzPZzEs1CTH6ARRRi2b8h6jk1ad1nP"),
    depositLimit: cap(5_000_000, 9),
    borrowLimit: cap(500_000, 9),
    initValue: null,
  },

  // (W) ETH — using ETH bank — deposit 5,000 * 10^8, borrow 100 * 10^8, decimals=8
  {
    bank: new PublicKey("BkUyfXjbBBALcfZvw76WAFRvYQ21xxMWWeoPtJrUqG3z"),
    depositLimit: cap(5_000, 8),
    borrowLimit: cap(100, 8),
    initValue: null,
  },

  // HNT — deposit 1,500,000 * 10^8, borrow 150,000 * 10^8, decimals=8
  {
    bank: new PublicKey("JBcir4DPRPYVUpks9hkS1jtHMXejfeBo4xJGv3AYYHg6"),
    depositLimit: cap(1_500_000, 8),
    borrowLimit: cap(150_000, 8),
    initValue: null,
  },

  // JLP — deposit 1,500,000 * 10^6, borrow 600,000 * 10^6, decimals=6
  {
    bank: new PublicKey("Amtw3n7GZe5SWmyhMhaFhDTi39zbTkLeWErBsmZXwpDa"),
    depositLimit: cap(1_500_000, 6),
    borrowLimit: cap(600_000, 6),
    initValue: null,
  },

  // JUP — deposit 15,000,000 * 10^6, borrow 100,000 * 10^6, decimals=6
  {
    bank: new PublicKey("Guu5uBc8k1WK1U2ihGosNaCy57LSgCkpWAabtzQqrQf8"),
    depositLimit: cap(15_000_000, 6),
    borrowLimit: cap(100_000, 6),
    initValue: null,
  },

  // PUMP — deposit 400,000,000 * 10^6, borrow 40,000,000 * 10^6, decimals=6
  {
    bank: new PublicKey("61Qx9kgWo9RVtPHf8Rku6gbaUtcnzgkpAuifQBUcMRVK"),
    depositLimit: cap(400_000_000, 6),
    borrowLimit: cap(40_000_000, 6),
    initValue: null,
  },

  // PYTH — deposit 6,000,000 * 10^6, borrow 2,500,000 * 10^6, decimals=6
  {
    bank: new PublicKey("E4td8i8PT2BZkMygzW4MGHCv2KPPs57dvz5W2ZXf9Twu"),
    depositLimit: cap(6_000_000, 6),
    borrowLimit: cap(2_500_000, 6),
    initValue: null,
  },

  // RENDER — deposit 500,000 * 10^8, borrow 50,000 * 10^8, decimals=8
  {
    bank: new PublicKey("EbuSnXdFz1R4VPdaJ96KQQQmeYgZTHSzpNW94Tw1PE3H"),
    depositLimit: cap(500_000, 8),
    borrowLimit: cap(50_000, 8),
    initValue: null,
  },

  // TNSR — deposit 2,000,000 * 10^9, borrow 100,000 * 10^9, decimals=9
  {
    bank: new PublicKey("9KbkQsu4EGAeM7ZxvwsZcpxoekZyg5LTk1BF5SAMPXdY"),
    depositLimit: cap(2_000_000, 9),
    borrowLimit: cap(100_000, 9),
    initValue: null,
  },

  // W — deposit 2,500,000 * 10^6, borrow 2,500,000 * 10^6, decimals=6
  {
    bank: new PublicKey("EYp4j7oHV2SfEGSE3GJ4MjsCL33CzmqLTdvTCdacQ9uG"),
    depositLimit: cap(2_500_000, 6),
    borrowLimit: cap(2_500_000, 6),
    initValue: null,
  },

  // WBTC — deposit 300 * 10^8, borrow 10 * 10^8, decimals=8
  {
    bank: new PublicKey("BKsfDJCMbYep6gr9pq8PsmJbb5XGLHbAJzUV8vmorz7a"),
    depositLimit: cap(300, 8),
    borrowLimit: cap(10, 8),
    initValue: null,
  },
];

async function main() {
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

  for (const { bank, depositLimit, borrowLimit, initValue } of bankLimits) {
    const ix = await program.methods
      .lendingPoolConfigureBankLimitsOnly(depositLimit, borrowLimit, initValue)
      .accounts({
        bank,
      })
      .accountsPartial({
        delegateLimitAdmin: config.LIMIT_ADMIN,
      })
      .instruction();

    transaction.add(ix);
  }

  if (sendTx) {
    // TODO versioned tx with LUT
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
    // Prepare unsigned tx (b58) for multisig flow
    transaction.feePayer = config.MULTISIG_PAYER;
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

main().catch((err) => {
  console.error(err);
});
