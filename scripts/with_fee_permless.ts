// Optionally set, then permissionlessly withdraw to, an emissions account.
import { AccountMeta, PublicKey, sendAndConfirmTransaction, Transaction } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import {
  createAssociatedTokenAccountIdempotentInstruction,
  getAccount,
  getAssociatedTokenAddressSync,
  TOKEN_2022_PROGRAM_ID,
  wrappedI80F48toBigNumber,
} from "@mrgnlabs/mrgn-common";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { commonSetup } from "../lib/common-setup";

/**
 * If true, send the tx. If false, output the unsigned b58 tx to console.
 */
const sendTx = false;
/**
 * If true, set emissions destination. If false, skip that step and just withdraw.
 */
const setDestination = true;

export type Config = {
  PROGRAM_ID: string;
  BANK: PublicKey;
  DESTINATION_WALLET: PublicKey;

  MULTISIG_PAYER: PublicKey;
};

const config: Config = {
  PROGRAM_ID: "MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA",
  BANK: new PublicKey("HmpMfL8942u22htC4EMiWgLX931g3sacXFR6KjuLgKLV"),
  DESTINATION_WALLET: new PublicKey("J3oBkTkDXU3TcAggJEa3YeBZE5om5yNAdTtLVNXFD47"),

  MULTISIG_PAYER: new PublicKey("CYXEgwbPHu2f9cY3mcUkinzDoDcsSan7myh1uBvYRbEw"),
};

async function main() {
  const user = commonSetup(sendTx, config.PROGRAM_ID, "/keys/staging-deploy.json", config.MULTISIG_PAYER);
  const program = user.program;
  const connection = user.connection;

  let bankAcc = await program.account.bank.fetch(config.BANK);
  const mint = bankAcc.mint;
  const feesUncollected = wrappedI80F48toBigNumber(bankAcc.collectedGroupFeesOutstanding).toNumber();
  let mintAccInfo = await connection.getAccountInfo(mint);
  const tokenProgram = mintAccInfo.owner;
  let isT22 = tokenProgram.toString() == TOKEN_2022_PROGRAM_ID.toString();
  console.log("mint: " + mint + " is 22: " + isT22);
  const [feeVault] = deriveFeeVault(program.programId, config.BANK);
  let feesVaultAcc = await getAccount(connection, feeVault, undefined, tokenProgram);
  const feesAvailable = Number(feesVaultAcc.amount);
  console.log("fees uncollected (in token): " + feesUncollected.toLocaleString());
  console.log("fees available (in token): " + feesAvailable.toLocaleString());
  console.log("decimals: " + bankAcc.mintDecimals);
  let dstAta = getAssociatedTokenAddressSync(mint, config.DESTINATION_WALLET, true, tokenProgram);
  console.log("fee destination: " + dstAta);

  let createAtaIx = createAssociatedTokenAccountIdempotentInstruction(
    config.MULTISIG_PAYER,
    dstAta,
    config.DESTINATION_WALLET,
    mint,
    tokenProgram
  );

  let remaining: AccountMeta[] = [];
  if (isT22) {
    const meta: AccountMeta = {
      pubkey: mint,
      isSigner: false,
      isWritable: false,
    };
    remaining.push(meta);
  }

  const transaction = new Transaction();
  if (setDestination) {
    transaction.add(
      createAtaIx,
      await program.methods
        .lendingPoolUpdateFeesDestinationAccount()
        .accounts({
          bank: config.BANK,
          destinationAccount: dstAta,
        })
        .instruction()
    );
  }

  transaction.add(
    await program.methods
      .lendingPoolWithdrawFeesPermissionless(new BN(feesAvailable - 1))
      .accounts({
        bank: config.BANK,
        tokenProgram: tokenProgram,
      })
      // The dst ata may not exist yet, so we need to specify it
      .accountsPartial({
        feesDestinationAccount: dstAta,
      })
      .remainingAccounts(remaining)
      .instruction()
  );

  if (sendTx) {
    try {
      const signature = await sendAndConfirmTransaction(connection, transaction, [user.wallet.payer]);
      console.log("Transaction signature:", signature);
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
    console.log("Base58-encoded transaction:", base58Transaction);
  }
}

const deriveFeeVault = (programId: PublicKey, bank: PublicKey) => {
  return PublicKey.findProgramAddressSync([Buffer.from("fee_vault", "utf-8"), bank.toBuffer()], programId);
};

main().catch((err) => {
  console.error(err);
});
