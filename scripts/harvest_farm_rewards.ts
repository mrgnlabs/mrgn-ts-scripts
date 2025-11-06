/**
 * Harvest farm rewards from Kamino farms attached to marginfi banks
 * 
 * This script harvests rewards from Kamino Farms that are accrued by marginfi banks.
 * The harvested rewards are sent to the global fee wallet.
 * 
 * Run with:
 * ts-node harvest_farm_rewards.ts <path-to-config.json>
 * 
 * Example:
 * ts-node harvest_farm_rewards.ts scripts/farm_rewards/my-reward-config.json
 */

import {
    PublicKey,
    Transaction,
    sendAndConfirmTransaction,
} from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
    createAssociatedTokenAccountIdempotentInstruction,
    getAssociatedTokenAddressSync,
} from "@mrgnlabs/mrgn-common";
import { commonSetup } from "../lib/common-setup";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { deriveLiquidityVaultAuthority } from "./common/pdas";
import * as fs from "fs";
import * as path from "path";

const sendTx = true;

// Kamino Farms program ID (mainnet)
const FARMS_PROGRAM_ID = new PublicKey("FarmsPZpWu9i7Kky8tPN37rs2TpmMrAZrC7S7vJa91Hr");

/**
 * Configuration for harvesting farm rewards (parsed from JSON file)
 */
type ConfigJson = {
    /** Marginfi program ID */
    PROGRAM_ID: string;

    /** The marginfi bank address that has a Kamino farm attached */
    BANK: string;

    /** The Kamino lending market (required to derive obligation) */
    LENDING_MARKET: string;

    /** The Kamino farm state address for this bank */
    FARM_STATE: string;

    /** The Kamino global config address */
    GLOBAL_CONFIG: string;

    /** The reward mint address */
    REWARD_MINT: string;

    /** The reward index to harvest (usually 0 for the first reward) */
    REWARD_INDEX: number;

    /** Multisig wallet (optional, if not sending directly) */
    MULTISIG?: string | null;
};

/**
 * Parsed configuration with PublicKey objects
 */
type Config = {
    PROGRAM_ID: string;
    BANK: PublicKey;
    LENDING_MARKET: PublicKey;
    FARM_STATE: PublicKey;
    GLOBAL_CONFIG: PublicKey;
    REWARD_MINT: PublicKey;
    REWARD_INDEX: number;
    MULTISIG?: PublicKey;
};

/**
 * Load and parse config from JSON file
 */
function loadConfig(configPath: string): Config {
    try {
        // Read the config file
        const absolutePath = path.isAbsolute(configPath)
            ? configPath
            : path.resolve(process.cwd(), configPath);

        if (!fs.existsSync(absolutePath)) {
            throw new Error(`Config file not found: ${absolutePath}`);
        }

        const configData = fs.readFileSync(absolutePath, "utf-8");
        const configJson: ConfigJson = JSON.parse(configData);

        // Validate required fields
        const requiredFields = [
            "PROGRAM_ID",
            "BANK",
            "LENDING_MARKET",
            "FARM_STATE",
            "GLOBAL_CONFIG",
            "REWARD_MINT",
            "REWARD_INDEX",
        ];

        for (const field of requiredFields) {
            if (!(field in configJson) || configJson[field as keyof ConfigJson] === null) {
                throw new Error(`Missing required field in config: ${field}`);
            }
        }

        // Parse public keys
        const config: Config = {
            PROGRAM_ID: configJson.PROGRAM_ID,
            BANK: new PublicKey(configJson.BANK),
            LENDING_MARKET: new PublicKey(configJson.LENDING_MARKET),
            FARM_STATE: new PublicKey(configJson.FARM_STATE),
            GLOBAL_CONFIG: new PublicKey(configJson.GLOBAL_CONFIG),
            REWARD_MINT: new PublicKey(configJson.REWARD_MINT),
            REWARD_INDEX: configJson.REWARD_INDEX,
        };

        // Add optional multisig if present
        if (configJson.MULTISIG && configJson.MULTISIG !== null) {
            config.MULTISIG = new PublicKey(configJson.MULTISIG);
        }

        return config;
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to load config: ${error.message}`);
        }
        throw error;
    }
}

/**
 * Derive the global fee state PDA
 */
const deriveGlobalFeeState = (programId: PublicKey) => {
    return PublicKey.findProgramAddressSync(
        [Buffer.from("feestate", "utf-8")],
        programId
    );
};

/**
 * Derive the Kamino user state PDA (farm obligation user state)
 */
const deriveUserState = (
    farmsProgramId: PublicKey,
    farmState: PublicKey,
    obligation: PublicKey
) => {
    return PublicKey.findProgramAddressSync(
        [
            Buffer.from("user"),
            farmState.toBuffer(),
            obligation.toBuffer(),
        ],
        farmsProgramId
    );
};

/**
 * Derive the Kamino base obligation PDA
 */
const deriveBaseObligation = (
    liquidityVaultAuthority: PublicKey,
    lendingMarket: PublicKey
) => {
    const KLEND_PROGRAM_ID = new PublicKey("KLend2g3cP87fffoy8q1mQqGKjrxjC8boSyAYavgmjD");
    return PublicKey.findProgramAddressSync(
        [
            Buffer.from("obligation"),
            lendingMarket.toBuffer(),
            liquidityVaultAuthority.toBuffer(),
        ],
        KLEND_PROGRAM_ID
    );
};

/**
 * Derive the farm vaults authority PDA
 */
const deriveFarmVaultsAuthority = (
    farmsProgramId: PublicKey,
    farmState: PublicKey
) => {
    return PublicKey.findProgramAddressSync(
        [Buffer.from("authority"), farmState.toBuffer()],
        farmsProgramId
    );
};

/**
 * Derive the reward vault PDA
 */
const deriveRewardVault = (
    farmsProgramId: PublicKey,
    farmState: PublicKey,
    rewardMint: PublicKey
) => {
    return PublicKey.findProgramAddressSync(
        [Buffer.from("rvault"), farmState.toBuffer(), rewardMint.toBuffer()],
        farmsProgramId
    );
};

/**
 * Derive the reward treasury vault PDA
 */
const deriveRewardTreasuryVault = (
    farmsProgramId: PublicKey,
    globalConfig: PublicKey,
    rewardMint: PublicKey
) => {
    return PublicKey.findProgramAddressSync(
        [Buffer.from("tvault"), globalConfig.toBuffer(), rewardMint.toBuffer()],
        farmsProgramId
    );
};

async function main() {
    // Check for config file argument
    if (process.argv.length < 3) {
        console.error("❌ Error: Config file path is required");
        console.error("\nUsage:");
        console.error("  ts-node harvest_farm_rewards.ts <path-to-config.json>");
        console.error("\nExample:");
        console.error("  ts-node harvest_farm_rewards.ts scripts/farm_rewards/my-reward-config.json");
        console.error("\nSee scripts/farm_rewards/README_CONFIG.md for more information");
        process.exit(1);
    }

    const configPath = process.argv[2];
    console.log(`Loading config from: ${configPath}`);

    // Load and parse config
    let config: Config;
    try {
        config = loadConfig(configPath);
        console.log("✅ Config loaded successfully\n");
    } catch (error) {
        console.error("❌ Failed to load config:", error instanceof Error ? error.message : error);
        process.exit(1);
    }

    const user = commonSetup(
        sendTx,
        config.PROGRAM_ID,
        "/.config/solana/id.json",
        config.MULTISIG,
        "kamino" // Use the kamino IDL version
    );
    const program = user.program;
    const connection = user.connection;

    console.log("Harvesting farm rewards...");
    console.log("Program ID:", config.PROGRAM_ID);
    console.log("Bank:", config.BANK.toString());
    console.log("Lending Market:", config.LENDING_MARKET.toString());
    console.log("Farm State:", config.FARM_STATE.toString());
    console.log("Reward Mint:", config.REWARD_MINT.toString());
    console.log("Reward Index:", config.REWARD_INDEX);

    // Derive PDAs
    const [feeState] = deriveGlobalFeeState(new PublicKey(config.PROGRAM_ID));
    console.log("Fee State:", feeState.toString());

    // Fetch fee state to get the global fee wallet
    const feeStateAccount = await program.account.feeState.fetch(feeState);
    const globalFeeWallet = feeStateAccount.globalFeeWallet;
    console.log("Global Fee Wallet:", globalFeeWallet.toString());

    // Derive liquidity vault authority
    const [liquidityVaultAuthority] = deriveLiquidityVaultAuthority(
        new PublicKey(config.PROGRAM_ID),
        config.BANK
    );
    console.log("Liquidity Vault Authority:", liquidityVaultAuthority.toString());

    // Derive obligation
    const [obligation] = deriveBaseObligation(liquidityVaultAuthority, config.LENDING_MARKET);
    console.log("Obligation:", obligation.toString());

    // Derive user state (farm user state for the obligation)
    const [userState] = deriveUserState(
        FARMS_PROGRAM_ID,
        config.FARM_STATE,
        obligation
    );
    console.log("User State:", userState.toString());

    // Derive farm vaults authority
    const [farmVaultsAuthority] = deriveFarmVaultsAuthority(
        FARMS_PROGRAM_ID,
        config.FARM_STATE
    );
    console.log("Farm Vaults Authority:", farmVaultsAuthority.toString());

    // Derive reward vaults
    const [rewardsVault] = deriveRewardVault(
        FARMS_PROGRAM_ID,
        config.FARM_STATE,
        config.REWARD_MINT
    );
    console.log("Rewards Vault:", rewardsVault.toString());

    const [rewardsTreasuryVault] = deriveRewardTreasuryVault(
        FARMS_PROGRAM_ID,
        config.GLOBAL_CONFIG,
        config.REWARD_MINT
    );
    console.log("Rewards Treasury Vault:", rewardsTreasuryVault.toString());

    // Get destination ATA (owned by global fee wallet)
    const destinationAta = getAssociatedTokenAddressSync(
        config.REWARD_MINT,
        globalFeeWallet,
        true
    );
    console.log("Destination ATA:", destinationAta.toString());

    // Get user reward ATA (owned by liquidity vault authority)
    const userRewardAta = getAssociatedTokenAddressSync(
        config.REWARD_MINT,
        liquidityVaultAuthority,
        true
    );
    console.log("User Reward ATA:", userRewardAta.toString());

    // Build transaction
    const transaction = new Transaction();

    // Add instruction to create destination ATA if it doesn't exist
    transaction.add(
        createAssociatedTokenAccountIdempotentInstruction(
            user.wallet.publicKey,
            destinationAta,
            globalFeeWallet,
            config.REWARD_MINT
        )
    );

    // Add instruction to create user reward ATA if it doesn't exist
    transaction.add(
        createAssociatedTokenAccountIdempotentInstruction(
            user.wallet.publicKey,
            userRewardAta,
            liquidityVaultAuthority,
            config.REWARD_MINT
        )
    );

    // Add harvest reward instruction
    // Note: destinationTokenAccount and liquidityVaultAuthority are auto-derived by Anchor as PDAs
    // Note: farmsProgram is hardcoded in the IDL and not passed as an account
    transaction.add(
        await program.methods
            .kaminoHarvestReward(new BN(config.REWARD_INDEX))
            .accounts({
                bank: config.BANK,
                feeState: feeState,
                // destinationTokenAccount: auto-derived PDA
                // liquidityVaultAuthority: auto-derived PDA
                userState: userState,
                farmState: config.FARM_STATE,
                globalConfig: config.GLOBAL_CONFIG,
                rewardMint: config.REWARD_MINT,
                userRewardAta: userRewardAta,
                rewardsVault: rewardsVault,
                rewardsTreasuryVault: rewardsTreasuryVault,
                farmVaultsAuthority: farmVaultsAuthority,
                scopePrices: null, // Optional, set to null if not needed
                tokenProgram: TOKEN_PROGRAM_ID,
            })
            .instruction()
    );

    if (sendTx) {
        try {
            const signature = await sendAndConfirmTransaction(
                connection,
                transaction,
                [user.wallet.payer]
            );
            console.log("✅ Transaction signature:", signature);
            console.log("View on Solana Explorer:", `https://explorer.solana.com/tx/${signature}`);
        } catch (error) {
            console.error("❌ Transaction failed:", error);
        }
    } else {
        // Prepare for multisig
        transaction.feePayer = config.MULTISIG;
        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        const serializedTransaction = transaction.serialize({
            requireAllSignatures: false,
            verifySignatures: false,
        });
        const base58Transaction = bs58.encode(serializedTransaction);
        console.log("Base58-encoded transaction for multisig:", base58Transaction);
    }

    console.log("✨ Harvest farm rewards complete!");
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});

