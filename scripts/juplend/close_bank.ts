import {
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { readFileSync } from "fs";
import { join } from "path";
import { parseConfig, Config } from "./lib/utils";
import { deriveBankWithSeed } from "../common/pdas";
import { commonSetup } from "../../lib/common-setup";
import { bs58 } from "@switchboard-xyz/common";

const sendTx = false;

async function main() {
  const configFile = process.argv[2];
  if (!configFile) {
    console.error(
      "Usage: tsx scripts/juplend/close_bank.ts"
      + " <config-file>",
    );
    console.error(
      "Example: tsx scripts/juplend/close_bank.ts"
      + " configs/stage/usdc.json",
    );
    process.exit(1);
  }

  const configPath = join(__dirname, configFile);
  const rawConfig = readFileSync(configPath, "utf8");
  const config = parseConfig(rawConfig);

  const programId = new PublicKey(config.PROGRAM_ID);
  const [bank] = deriveBankWithSeed(
    programId,
    config.GROUP_KEY,
    config.BANK_MINT,
    config.SEED,
  );

  console.log("=== Close JupLend Bank ===\n");
  console.log("Config:", configFile);
  console.log("Bank:", bank.toString());
  console.log("Mint:", config.BANK_MINT.toString());
  console.log();

  await closeJuplendBank(
    sendTx,
    config,
    bank,
    "/keys/staging-deploy.json",
  );
}

export async function closeJuplendBank(
  sendTx: boolean,
  config: Config,
  bank: PublicKey,
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
  const program = user.program;
  const connection = user.connection;

  const transaction = new Transaction().add(
    await program.methods
      .lendingPoolCloseBank()
      .accounts({ bank })
      .instruction(),
  );

  if (sendTx) {
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [user.wallet.payer],
    );
    console.log("Signature:", signature);
    console.log("Bank closed!");
  } else {
    transaction.feePayer = config.MULTISIG_PAYER;
    const { blockhash } =
      await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    const serialized = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    });
    console.log("bank:", bank.toString());
    console.log(
      "Base58-encoded transaction:",
      bs58.encode(serialized),
    );
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
