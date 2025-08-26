import dotenv from "dotenv";
import { appendFileSync, readFileSync } from "fs";
import fetch from "node-fetch";

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const OUTPUT_FILE = `swb-sim-sol-output-${timestamp}.csv`;
console.log(`Output file: ${OUTPUT_FILE}`);

function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

import { writeFileSync } from "fs";

// --- Types ---
type Receipt = {
    task_name: string;
    task_output: string | null;
    error: string | null;
    children: Receipt[];
};

type FeedEntry = {
    feed: string;
    result: number;
    stdev: number;
    variance: number;
    receipts: Receipt[];
};


async function simulate() {
    console.log(`[${new Date().toISOString()}]`, `Simulating the SOL feed...`);

    const start = Date.now();
    const response = await fetch(crossbar_url);
    const elapsed = Date.now() - start;
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // TODO: implement the sim response parsing

    console.log(`[${new Date().toISOString()}]`, `Simulation completed in ${elapsed} ms.`);
}


// The Crossbar URL
let crossbar_url = process.argv[2];
if (!crossbar_url) {
    console.error("❌ Missing the required Crossbar URL argument.");
    process.exit(1);
}
crossbar_url = crossbar_url + "/simulate/solana/mainnet/C8BHeLfbEWD8nSMesqPrAKNuyC5UtTaBpXXABz6DbX62?includeReceipts=true"
console.log(`Crossbar URL: ${crossbar_url}`);

// The Simulation frequency
const SIM_DELAY = process.argv[3] ? parseInt(process.argv[3]) : 10;
console.log(`Simulation frequency: ${SIM_DELAY} seconds`);

(async () => {
    let errorCount = 0;
    while (true) {
        try {
            await simulate();
        } catch (error) {
            errorCount++;
            console.error(`[${new Date().toISOString()}]`, `Error ${errorCount} occurred while simulating feed:`, error);
        }
        await delay(SIM_DELAY * 1000);
    }
})();
