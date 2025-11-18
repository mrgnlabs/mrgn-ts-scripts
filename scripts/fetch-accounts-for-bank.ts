import fs from "fs";
import path from "path";
import { PublicKey } from "@solana/web3.js";
import { wrappedI80F48toBigNumber } from "@mrgnlabs/mrgn-common";
import { commonSetup } from "../lib/common-setup";

const writeToConsole = true;
const writeToFile = true;

type Config = {
  PROGRAM_ID: string;
  BANK: PublicKey;
};

const config: Config = {
  PROGRAM_ID: "MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA",
  BANK: new PublicKey("9KbkQsu4EGAeM7ZxvwsZcpxoekZyg5LTk1BF5SAMPXdY"),
};

// ---- Layout constants ----
const DISCRIMINATOR_LEN = 8;
const LENDING_ACCOUNT_OFFSET = 64;
const BALANCE_SIZE = 104;
const BALANCE_BANK_PK_OFFSET = 1;
const MAX_BALANCES = 16;

function bankPkOffsetForIndex(i: number): number {
  return (
    DISCRIMINATOR_LEN +
    LENDING_ACCOUNT_OFFSET +
    i * BALANCE_SIZE +
    BALANCE_BANK_PK_OFFSET
  );
}

function formatNumber(num: any) {
  const number = parseFloat(num).toFixed(4);
  return number === "0.0000" ? "-" : number;
}

async function main() {
  const user = commonSetup(
    true,
    config.PROGRAM_ID,
    "/keys/phantom-wallet.json",
    undefined,
    "current"
  );
  const program = user.program;

  const allAcc: any[] = [];

  // Search each balance slot for bank_pk match
  for (let i = 0; i < MAX_BALANCES; i++) {
    const offset = bankPkOffsetForIndex(i);

    const accForSlot = await program.account.marginfiAccount.all([
      {
        memcmp: {
          offset,
          bytes: config.BANK.toBase58(),
        },
      },
    ]);

    allAcc.push(...accForSlot);
  }

  // Prepare JSON output array
  const jsonOutput: any[] = [];

  allAcc.forEach((accInfo, index) => {
    const acc = accInfo.account;
    const pk = accInfo.publicKey.toString();
    const balances = acc.lendingAccount.balances;

    console.log(`${index}: ${pk}`);

    const accountEntry: any = {
      publicKey: pk,
      balances: [],
    };

    let hasThisBank = false;

    for (let i = 0; i < balances.length; i++) {
      const b = balances[i];
      if (b.active === 0) continue;

      const balInfo = {
        balanceIndex: i,
        bankPk: b.bankPk.toString(),
        tag: b.bankAssetTag,
        assetShares: formatNumber(wrappedI80F48toBigNumber(b.assetShares)),
        liabilityShares: formatNumber(
          wrappedI80F48toBigNumber(b.liabilityShares)
        ),
      };

      accountEntry.balances.push(balInfo);

      if (b.bankPk.equals(config.BANK)) {
        hasThisBank = true;
      }
    }

    if (hasThisBank) {
      jsonOutput.push(accountEntry);

      if (writeToConsole) {
        if (accountEntry.balances.length > 0) {
          console.table(accountEntry.balances);
        }
        console.log();
      }
    }
  });

  // ----- WRITE OUTPUT TO FILE -----

  if (writeToFile) {
    const logsDir = path.join(process.cwd(), "logs");
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir);
    }

    const filename = `${config.BANK.toBase58()}_accounts.json`;
    const filePath = path.join(logsDir, filename);

    fs.writeFileSync(filePath, JSON.stringify(jsonOutput, null, 2));
    console.log(`\n📁 Results written to: ${filePath}\n`);
  }
}

main().catch((err) => {
  console.error(err);
});
