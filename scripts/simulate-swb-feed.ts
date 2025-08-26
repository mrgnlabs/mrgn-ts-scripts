import { CrossbarClient } from "@switchboard-xyz/common";
import { appendFileSync, readFileSync } from "fs";
import dotenv from "dotenv";

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const OUTPUT_FILE = `swb-sim-output-${timestamp}.csv`;
console.log(`Output file: ${OUTPUT_FILE}`);

async function fetch(crossbar: CrossbarClient,
    feeds: string[]
) {

    console.log(`[${new Date().toISOString()}]`, `Simulating the feeds ${feeds}...`);
    const start = Date.now();
    const results = await crossbar.simulateSolanaFeeds(
        "mainnet",
        feeds
    );
    const elapsed = Date.now() - start;

    for (let simulation of results) {
        appendFileSync(OUTPUT_FILE, `${new Date().toISOString()}, ${simulation.feed}, ${elapsed}, ${simulation.results}` + "\n");
    }
    console.log(`[${new Date().toISOString()}]`, `Simulation completed in ${elapsed} ms.`);
}

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

// The Swb Feeds file
if (!process.argv[2]) {
    console.error("❌ Missing the required Feeds file argument.");
    process.exit(1);
}
console.log(`Using Feeds file: ${process.argv[2]}`);
const feeds = new Map(Object.entries(dotenv.parse(readFileSync(process.argv[2], 'utf8'))));

// The Crossbar URL
const crossbar_url = process.argv[3];
if (!crossbar_url) {
    console.error("❌ Missing the required Crossbar URL argument.");
    process.exit(1);
}
console.log(`Using Crossbar URL: ${crossbar_url}`);

// The Simulation delay
const SIM_DELAY = process.argv[4] ? parseInt(process.argv[4]) : 10;
console.log(`Using Simulation delay: ${SIM_DELAY} seconds`);


const sim_all = process.argv[5] === "all";
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
            console.error(`[${new Date().toISOString()}]`, `Error ${errorCount} occurred while fetching feed data:`, error);
        }
        await delay(SIM_DELAY * 1000);
    }
})();
