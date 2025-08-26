import dotenv from "dotenv";
import { appendFileSync, readFileSync } from "fs";
import fetch from "node-fetch";

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const OUTPUT_FILE = `swb-sim2-output-${timestamp}.csv`;

function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}


interface SimulationEntry {
    feed: string;
    feedHash: string;
    results: number[];
    result: number;
    stdev: number;
    variance: number;
}

type SimulationResponse = SimulationEntry[];

async function simulate(feed: string) {
    console.log(`[${new Date().toISOString()}]`, `Simulating the feeds ${feed}...`);

    const start = Date.now();
    const response = await fetch(crossbar_url.replace("{feed}", feed));
    const elapsed = Date.now() - start;

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = (await response.json()) as SimulationResponse;

    // Pretty-print the data
    data.forEach((entry) => {
        appendFileSync(OUTPUT_FILE, `${new Date().toISOString()}, ${entry.feed},  ${elapsed}, ${entry.result}, ${entry.stdev}, ${entry.variance}` + "\n");
    });
    console.log(`[${new Date().toISOString()}]`, `Simulation completed in ${elapsed} ms.`);
}

// The Swb Feeds file
if (!process.argv[2]) {
    console.error("❌ Missing the required Feeds file argument.");
    process.exit(1);
}
console.log(`Using Feeds file: ${process.argv[2]}`);
const feeds = new Map(Object.entries(dotenv.parse(readFileSync(process.argv[2], 'utf8'))));

// The Crossbar URL
let crossbar_url = process.argv[3];
if (!crossbar_url) {
    console.error("❌ Missing the required Crossbar URL argument.");
    process.exit(1);
}
crossbar_url = crossbar_url + "/simulate/solana/mainnet/{feed}"
console.log(`Using Crossbar URL: ${crossbar_url}`);

// The Simulation delay
const SIM_DELAY = process.argv[4] ? parseInt(process.argv[4]) : 10;
console.log(`Using Simulation delay: ${SIM_DELAY} seconds`);

appendFileSync(OUTPUT_FILE, `DateTime, Feed Address, Elapsed Time (ms), Result, Stdev, Variance` + "\n");

(async () => {
    let errorCount = 0;
    while (true) {
        try {
            for (const [_, feed] of feeds) {
                await simulate(feed);
            }
        } catch (error) {
            errorCount++;
            console.error(`[${new Date().toISOString()}]`, `Error ${errorCount} occurred while simulating feed:`, error);
        }
        await delay(SIM_DELAY * 1000);
    }
})();


