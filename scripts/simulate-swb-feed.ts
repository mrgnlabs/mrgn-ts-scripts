import { CrossbarClient } from "@switchboard-xyz/common";
import { appendFileSync, readFileSync } from "fs";
import dotenv from "dotenv";

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const OUTPUT_FILE = `swb-sim-output-${timestamp}.csv`;

async function fetch(crossbar: CrossbarClient,
    feeds: string[]
) {

    console.log(`Simulating the feeds ${feeds}...`);
    const start = Date.now();
    const results = await crossbar.simulateSolanaFeeds(
        "mainnet",
        feeds
    );
    const elapsed = Date.now() - start;

    for (let simulation of results) {
        const log_entry = `${new Date().toISOString()}, ${simulation.feed}, ${elapsed}, ${simulation.results}`;
        console.log(log_entry);
        appendFileSync(OUTPUT_FILE, log_entry + "\n");
    }
}

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

// The Swb Feed addresses file
if (!process.argv[2]) {
    console.error("❌ Missing the required Feeds file argument.");
    process.exit(1);
}
console.log(`Using Feeds file: ${process.argv[2]}`);
const feeds = new Map(Object.entries(dotenv.parse(readFileSync(process.argv[2], 'utf8'))));

// The Crossbar URL
const crossbar_url = process.argv[3];
// const crossbar_url = "https://crossbar.switchboard.xyz";
// const crossbar_url = "https://staging.crossbar.switchboard.xyz";
// const crossbar_url = "https://internal-crossbar.prod.mrgn.app";
// const crossbar_url = "https://internal-crossbar.stage.mrgn.app";
if (!crossbar_url) {
    console.error("❌ Missing the required Crossbar URL argument.");
    process.exit(1);
}

console.log(`Using Crossbar URL: ${crossbar_url}`);

const sim_all = process.argv[4] === "all";
if (sim_all) {
    console.log("Simulating all feeds at once.");
} else {
    console.log("Simulating feeds one by one.");
}


appendFileSync(OUTPUT_FILE, `Using Crossbar URL: ${crossbar_url}` + "\n");
appendFileSync(OUTPUT_FILE, `DateTime, Feed Address, Elapsed Time (ms), Results` + "\n");

const crossbar = new CrossbarClient(crossbar_url, true);

(async () => {
    let errorCount = 0;
    while (true) {
        try {
            if (sim_all) {
                await fetch(crossbar, Array.from(feeds.values()));
            } else {
                for (let [_, feed] of feeds) {
                    await fetch(crossbar, [feed]);
                }
            }

        } catch (error) {
            errorCount++;
            console.error(`Error ${errorCount} occurred while fetching feed data:`, error);
        }
        await delay(10_000);
    }
})();
