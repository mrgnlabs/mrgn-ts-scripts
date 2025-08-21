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
    console.log(`Simulating the feeds ${feed}...`);

    const URL =
        `https://internal-crossbar.stage.mrgn.app/simulate/solana/mainnet/${feed}`;

    const start = Date.now();
    const response = await fetch(URL);
    const elapsed = Date.now() - start;

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = (await response.json()) as SimulationResponse;

    // Pretty-print the data
    data.forEach((entry) => {
        appendFileSync(OUTPUT_FILE, `${new Date().toISOString()}, ${entry.feed},  ${elapsed}, ${entry.result}, ${entry.stdev}, ${entry.variance}` + "\n");
    });
    console.log(`Simulation completed in ${elapsed} ms.`);
}

// The Swb Feeds file
if (!process.argv[2]) {
    console.error("❌ Missing the required Feeds file argument.");
    process.exit(1);
}
console.log(`Using Feeds file: ${process.argv[2]}`);
const feeds = new Map(Object.entries(dotenv.parse(readFileSync(process.argv[2], 'utf8'))));


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
            console.error(`Error ${errorCount} occurred while fetching feed data:`, error);
        }
        await delay(10_000);
    }
})();


