import { commonSetup } from "../lib/common-setup";

import * as sb from "@switchboard-xyz/on-demand";

import { CrossbarClient } from "@switchboard-xyz/common";
import { appendFileSync } from "fs";
import { Commitment, PublicKey, sendAndConfirmRawTransaction, BlockheightBasedTransactionConfirmationStrategy } from "@solana/web3.js";

(async () => {

    const MRGN_PROGRAM_ID = "MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA";
    const WALLET_PATH = "/.config/mrgn/B1x_keypair.json";
    const CROSSBAR_URL = "https://crossbar.switchboard.xyz";

    const TX_CONFIG = {
        commitment: "finalized" as Commitment,
        skipPreflight: true,
        maxRetries: 1,
    };

    const user = commonSetup(true, MRGN_PROGRAM_ID, WALLET_PATH);
    const program = user.program;
    const provider = user.provider;
    const connection = user.connection;
    const swbProgram = await sb.AnchorUtils.loadProgramFromConnection(
        connection
    )

    const crossbar = new CrossbarClient(CROSSBAR_URL, true);
    const queue = await sb.Queue.loadDefault(swbProgram!);
    const gateway = await queue.fetchGatewayFromCrossbar(crossbar);

    const feeds = [
        "EAsoLo2uSvBDx3a5grqzfqBMg5RqpJVHRtXmjsFEc4LL", // One
        //        "AAY5JGEmYT4WHx5KZCiiQg34GrCri1zbTTg9dfcprq5F", // SOL/USD Option 1
        //        "C8BHeLfbEWD8nSMesqPrAKNuyC5UtTaBpXXABz6DbX62",  // SOL/USD Option 2
        //        "HpYEhRjQcJ1cbtf4dkTfmNznK9j3d8GQ8XrfyaS2cKo9", // SOL/USD Option 3
    ].map((pubkey) => new sb.PullFeed(swbProgram, pubkey));

    const [pullIx, luts] = await sb.PullFeed.fetchUpdateManyIx(swbProgram, {
        feeds,
        gateway: gateway.gatewayUrl,
        numSignatures: 1,
        payer: user.wallet.publicKey,
    });

    const tx = await sb.asV0Tx({
        connection,
        ixs: pullIx,
        signers: [user.wallet.payer],
        //        computeUnitPrice: 200_000,    // Priority fee for consistent inclusion
        computeUnitLimitMultiple: 2, // 30% buffer on compute units
        lookupTables: luts,           // Address lookup tables for efficiency
    });

    //     const sim = await connection.simulateTransaction(tx, TX_CONFIG);
    //    console.log(`Simulation result: ${JSON.stringify(sim)}`);

    const result = await sendAndConfirmRawTransaction(
        connection,
        Buffer.from(tx.serialize()),
        TX_CONFIG
    );
    console.log(`Transaction confirmed: ${result}`);

})();