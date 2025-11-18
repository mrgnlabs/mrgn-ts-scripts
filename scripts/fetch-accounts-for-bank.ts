import { wrappedI80F48toBigNumber } from "@mrgnlabs/mrgn-common";
import { PublicKey } from "@solana/web3.js";
import { commonSetup } from "../lib/common-setup";
// import whatever provides commonSetup, wrappedI80F48toBigNumber, etc.

type Config = {
  PROGRAM_ID: string;
  BANK: PublicKey;
};

const config: Config = {
  PROGRAM_ID: "MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA",
  BANK: new PublicKey("EdB7YADw4XUt6wErT8kHGCUok4mnTpWGzPUU9rWDebzb"),
};

// layout constants
const DISCRIMINATOR_LEN = 8;
const LENDING_ACCOUNT_OFFSET = 64; // offset of LendingAccount inside MarginfiAccount struct
const BALANCE_SIZE = 104;
const BALANCE_BANK_PK_OFFSET = 1; // inside Balance
const MAX_BALANCES = 16;

function bankPkOffsetForIndex(i: number): number {
  return (
    DISCRIMINATOR_LEN +
    LENDING_ACCOUNT_OFFSET +
    i * BALANCE_SIZE +
    BALANCE_BANK_PK_OFFSET
  ); // 73 + i*104
}

function formatNumber(num: any) {
  const number = parseFloat(num).toFixed(4);
  return number === "0.0000" ? "-" : number;
}

async function main() {
  const user = commonSetup(
    true,
    config.PROGRAM_ID,
    "/.config/solana/id.json",
    undefined,
    "current"
  );
  const program = user.program;

  // Map to dedupe accounts that may match on multiple balance slots
  const byPk = new Map<string, (typeof acc)[number]>();

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

    for (const info of accForSlot) {
      byPk.set(info.publicKey.toBase58(), info);
    }
  }

  const acc = Array.from(byPk.values());

  acc.forEach((accInfo, index) => {
    const acc = accInfo.account;
    console.log(`${index}: ${accInfo.publicKey.toString()}`);

    const balances = acc.lendingAccount.balances;
    const activeBalances: any[] = [];

    for (let i = 0; i < balances.length; i++) {
      if (balances[i].active === 0) continue;

      activeBalances.push({
        "Balance Index": i,
        "Bank PK": balances[i].bankPk.toString(),
        Tag: balances[i].bankAssetTag,
        "Liab Shares": formatNumber(
          wrappedI80F48toBigNumber(balances[i].liabilityShares)
        ),
        "Asset Shares": formatNumber(
          wrappedI80F48toBigNumber(balances[i].assetShares)
        ),
      });
    }

    if (activeBalances.length > 0) {
      console.table(activeBalances);
    }
    console.log();
  });
}

main().catch((err) => {
  console.error(err);
});
