import { CrossbarClient } from "@switchboard-xyz/common";
import { appendFileSync } from "fs";

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const OUTPUT_FILE = `swb-sim-output-${timestamp}.csv`;

async function fetch(crossbar: CrossbarClient,
    feeds: string[]
) {

    for (let feed of feeds) {
        const start = Date.now();
        const results = await crossbar.simulateSolanaFeeds(
            "mainnet",
            [feed]
        );
        const elapsed = Date.now() - start;

        for (let simulation of results) {
            const log_entry = `${new Date().toISOString()}, ${simulation.feed}, ${elapsed}, ${simulation.results}`;
            console.log(log_entry);
            appendFileSync(OUTPUT_FILE, log_entry + "\n");
        }
    }
}

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

const crossbar_url = process.argv[2];
// const crossbar_url = "https://crossbar.switchboard.xyz";
// const crossbar_url = "https://staging.crossbar.switchboard.xyz";
// const crossbar_url = "https://internal-crossbar.prod.mrgn.app";
// const crossbar_url = "https://internal-crossbar.stage.mrgn.app";
if (!crossbar_url) {
    console.error("❌ Missing the required Crossbar URL argument.");
    process.exit(1);
}

appendFileSync(OUTPUT_FILE, `Using Crossbar URL: ${crossbar_url}` + "\n");
appendFileSync(OUTPUT_FILE, `DateTime, Feed Address, Elapsed Time (ms), Results` + "\n");

const crossbar = new CrossbarClient(crossbar_url, true);

const one = "EAsoLo2uSvBDx3a5grqzfqBMg5RqpJVHRtXmjsFEc4LL";
const sol_usd_1 = "AAY5JGEmYT4WHx5KZCiiQg34GrCri1zbTTg9dfcprq5F";
const sol_usd_2 = "C8BHeLfbEWD8nSMesqPrAKNuyC5UtTaBpXXABz6DbX62";

(async () => {
    let errorCount = 0;
    while (true) {
        try {
            await fetch(crossbar, [one, sol_usd_1]);
        } catch (error) {
            errorCount++;
            console.error(`Error ${errorCount} occurred while fetching feed data:`, error);
        }
        await delay(5_000);
    }
})();
