import dotenv from "dotenv";
import { loadKeypairFromFile } from "../lib/utils";

import * as sb from "@switchboard-xyz/on-demand";

import { CrossbarClient } from "@switchboard-xyz/common";
import { appendFileSync } from "fs";
import { Commitment, sendAndConfirmRawTransaction, Connection } from "@solana/web3.js";
import { Wallet } from "@coral-xyz/anchor";

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const OUTPUT_FILE = `swb-crank-output-${timestamp}.csv`;

const TX_CONFIG = {
    commitment: "confirmed" as Commitment,
    skipPreflight: true,
    maxRetries: 1,
};

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

dotenv.config();
if (!process.env.MARGINFI_PROGRAM_ID) {
    console.error("❌ Missing required environment variable MARGINFI_PROGRAM_ID.");
    process.exit(1);
}
console.log(`Using Marginfi Program ID: ${process.env.MARGINFI_PROGRAM_ID}`);

if (!process.env.MARGINFI_WALLET) {
    console.error("❌ Missing required environment variable MARGINFI_WALLET.");
    process.exit(1);
}
console.log(`Using Marginfi Wallet: ${process.env.MARGINFI_WALLET}`);

if (!process.env.PRIVATE_RPC_ENDPOINT) {
    console.error("❌ Missing required environment variable PRIVATE_RPC_ENDPOINT.");
    process.exit(1);
}
console.log(`Using Private RPC Endpoint: ${process.env.PRIVATE_RPC_ENDPOINT}`);

const MARGINFI_WALLET_FULL_PATH = process.env.HOME + process.env.MARGINFI_WALLET;
console.log(`The Marginfi Wallet full path: ${MARGINFI_WALLET_FULL_PATH}`);

const CROSSBAR_URL = process.argv[2];
// const CROSSBAR_URL = "https://crossbar.switchboard.xyz";
// const CROSSBAR_URL = "https://staging.crossbar.switchboard.xyz";
// const CROSSBAR_URL = "https://internal-crossbar.prod.mrgn.app";
// const CROSSBAR_URL = "https://internal-crossbar.stage.mrgn.app";
if (!CROSSBAR_URL) {
    console.error("❌ Missing the required Crossbar URL argument.");
    process.exit(1);
}
console.log(`Using Crossbar URL: ${CROSSBAR_URL}`);

(async () => {

    const connection = new Connection(process.env.PRIVATE_RPC_ENDPOINT, "confirmed");
    const wallet = new Wallet(loadKeypairFromFile(process.env.MARGINFI_WALLET));
    const swbProgram = await sb.AnchorUtils.loadProgramFromConnection(
        connection
    )
    const crossbar = new CrossbarClient(CROSSBAR_URL, true);
    const queue = await sb.Queue.loadDefault(swbProgram!);
    const gateway = await queue.fetchGatewayFromCrossbar(crossbar);

    const feed_addresses = [
        "EAsoLo2uSvBDx3a5grqzfqBMg5RqpJVHRtXmjsFEc4LL", // One
        "AAY5JGEmYT4WHx5KZCiiQg34GrCri1zbTTg9dfcprq5F", // SOL/USD Option 1
        "C8BHeLfbEWD8nSMesqPrAKNuyC5UtTaBpXXABz6DbX62",  // SOL/USD Option 2
        "HpYEhRjQcJ1cbtf4dkTfmNznK9j3d8GQ8XrfyaS2cKo9", // SOL/USD Option 3
    ]
    const feeds = feed_addresses.map((pubkey) => new sb.PullFeed(swbProgram, pubkey));

    appendFileSync(OUTPUT_FILE, `Using Crossbar URL: ${CROSSBAR_URL}` + "\n");
    appendFileSync(OUTPUT_FILE, `DateTime, Feed Address, Ix Fetch Time (ms), Tx Crank Time (ms), Tx Signature` + "\n");

    let errorCount = 0;
    while (true) {
        for (const feed of feeds) {
            try {
                const feed_address = feed.pubkey.toString();

                console.log(`Fetching the feed ${feed_address} Ix for cranking...`);
                const fetch_start = Date.now();
                const [pullIx, luts] = await sb.PullFeed.fetchUpdateManyIx(swbProgram, {
                    feeds: [feed],
                    gateway: gateway.gatewayUrl,
                    numSignatures: 1,
                    payer: wallet.publicKey,
                });
                const fetch_elapsed = Date.now() - fetch_start;

                const tx = await sb.asV0Tx({
                    connection,
                    ixs: pullIx,
                    signers: [wallet.payer],
                    computeUnitLimitMultiple: 2,
                    lookupTables: luts,
                });

                console.log(`Cranking the feed ${feed_address} Tx...`);
                const crank_start = Date.now();
                const result = await sendAndConfirmRawTransaction(
                    connection,
                    Buffer.from(tx.serialize()),
                    TX_CONFIG
                );
                const crank_elapsed = Date.now() - crank_start;

                const log_entry = `${new Date().toISOString()}, ${feed_address}, ${fetch_elapsed}, ${crank_elapsed}, ${result}`;
                console.log(`Cranking successful: ${log_entry}`);
                appendFileSync(OUTPUT_FILE, log_entry + "\n");

            } catch (error) {
                errorCount++;
                console.error(`Error ${errorCount} occurred while cranking:`, error);
            }
        }
        await delay(30_000);
    }

})();
