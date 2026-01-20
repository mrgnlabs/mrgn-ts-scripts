# Claude's Notes - Marginfi Scripts Patterns

## Drift Integration Specifics

### Drift Program ID
```typescript
export const DRIFT_PROGRAM_ID = "dRiftyHA39MWEi3m9aunc5MzRF1JYuBsbn6VPcn33UH";
```

### Key Drift Methods
- `lendingPoolAddBankDrift` - Add drift-enabled bank
- `driftInitUser` - Initialize drift user (min 100 units deposit)
- `driftDeposit` - Deposit to drift bank
- `driftWithdraw` - Withdraw from drift bank
- `driftHarvestReward` - Harvest admin rewards (positions 2-7)

### Critical Drift Rules
1. **All assets need oracle** - No special cases for USDC/quote assets
2. **Scaled balances** - Drift uses 9 decimals internally for all assets
3. **Min init deposit** - 100 smallest units required for driftInitUser
4. **Bank mint** - Equals drift spot market mint (NOT actual token mint)
5. **Withdrawal health check** - Must pass remaining accounts for ALL other active banks
6. **Reward accounts** - Required if 2+ admin deposits active (positions 2-7)
7. **Oracle type** - Must use Pyth Pull (`oracleSetup: { driftPythPull: {} }`)

### Drift Config Structure
```typescript
{
  oracle: PublicKey,              // Pyth Pull oracle
  assetWeightInit: I80F48_ONE,    // 100%
  assetWeightMaint: I80F48_ONE,   // 100%
  depositLimit: BN,               // Max deposit
  totalAssetValueInitLimit: BN,   // USD limit
  oracleSetup: { driftPythPull: {} },
  oracleMaxAge: 100,              // Seconds
}
```

---

# Claude's Notes - Marginfi Scripts Patterns

## Key Patterns Learned

### 1. Common Setup Pattern
```typescript
import { commonSetup } from "../../lib/common-setup";
import { loadEnvFile } from "../utils";

const user = commonSetup(
  sendTx,           // true = execute, false = read-only
  programId,        // Program ID string
  walletPath,       // Path to keypair (from env)
  multisig,         // Optional: Squads multisig address
  "current"         // IDL version: "current", "kamino", "1.3", "1.4"
);

const program = user.program;
const connection = user.connection;
const wallet = user.wallet;
```

### 2. Environment Variables
- `MARGINFI_WALLET` in `.env` - path to wallet keypair
- `API_URL` in `.env.api` - RPC endpoint
- `commonSetup` prepends `process.env.HOME` to wallet paths
- Strip HOME prefix if wallet path is already absolute

### 3. Standard Script Structure
```typescript
// 1. Imports
import { PublicKey, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import { commonSetup } from "../../lib/common-setup";
import { loadEnvFile } from "../utils";

// 2. Config type
type Config = {
  PROGRAM_ID: string;
  GROUP: PublicKey;
  // ... other params
};

// 3. Hardcoded config
const config: Config = {
  PROGRAM_ID: "5UDghkpgW1HfYSrmEj2iAApHShqU44H6PKTAar9LL9bY", // Staging
  GROUP: new PublicKey("..."),
  // ... values
};

// 4. Main function
async function main() {
  // Load env
  loadEnvFile(".env");
  let walletPath = process.env.MARGINFI_WALLET;

  if (!walletPath) {
    throw new Error("MARGINFI_WALLET not set in .env file");
  }

  // Strip HOME prefix if absolute path
  if (walletPath.startsWith(process.env.HOME || "")) {
    walletPath = walletPath.substring((process.env.HOME || "").length);
  }

  // Setup
  const user = commonSetup(true, config.PROGRAM_ID, walletPath, undefined, "current");
  const program = user.program;
  const connection = user.connection;

  // Fetch state
  const group = await program.account.marginfiGroup.fetch(config.GROUP);

  // Build transaction
  const transaction = new Transaction();
  transaction.add(
    await program.methods
      .someMethod(params)
      .accounts({ /* accounts */ })
      .instruction()
  );

  // Simulate first
  transaction.feePayer = user.wallet.publicKey;
  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;

  const simulation = await connection.simulateTransaction(transaction);

  console.log("Program Logs:");
  simulation.value.logs?.forEach(log => console.log("  " + log));

  if (simulation.value.err) {
    throw new Error("Simulation failed");
  }

  // Execute
  const signature = await sendAndConfirmTransaction(
    connection,
    transaction,
    [user.wallet.payer]
  );

  console.log("Signature:", signature);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

## 5. Marginfi Account Field Names

**Group Admin Roles:**
- `admin` - General admin
- `emodeAdmin` - E-mode admin
- `delegateCurveAdmin` - Curve admin (NOT curveAdmin)
- `delegateLimitAdmin` - Limit admin (NOT limitAdmin)
- `delegateEmissionsAdmin` - Emissions admin (NOT emissionsAdmin)

## 6. Program IDs

- **Mainnet**: `MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA`
- **Staging**: `5UDghkpgW1HfYSrmEj2iAApHShqU44H6PKTAar9LL9bY`

Always verify group owner matches the program ID you're using.

## 7. Simulation Pattern

Always simulate before executing:

```typescript
// Set fee payer and blockhash
transaction.feePayer = user.wallet.publicKey;
const { blockhash } = await connection.getLatestBlockhash();
transaction.recentBlockhash = blockhash;

// Simulate
const simulation = await connection.simulateTransaction(transaction);

// Check results
if (simulation.value.logs) {
  console.log("Program Logs:");
  simulation.value.logs.forEach(log => console.log("  " + log));
}

if (simulation.value.err) {
  console.log("Error:", JSON.stringify(simulation.value.err, null, 2));
  throw new Error("Simulation failed");
}

console.log("Compute units:", simulation.value.unitsConsumed);
```

## 8. Testing Without Admin Wallet

Use VersionedTransaction with `sigVerify: false`:

```typescript
import { TransactionMessage, VersionedTransaction } from "@solana/web3.js";

// Replace wallet pubkey with actual admin in instruction
const instruction = transaction.instructions[0];
const modifiedAccountKeys = instruction.keys.map(key => {
  if (key.pubkey.equals(user.wallet.publicKey) && key.isSigner) {
    return { ...key, pubkey: actualAdmin };
  }
  return key;
});

const modifiedInstruction = { ...instruction, keys: modifiedAccountKeys };

// Build versioned transaction
const messageV0 = new TransactionMessage({
  payerKey: actualAdmin,
  recentBlockhash: blockhash,
  instructions: [modifiedInstruction],
}).compileToV0Message();

const versionedTx = new VersionedTransaction(messageV0);

// Simulate with sigVerify off
const simulation = await connection.simulateTransaction(versionedTx, {
  sigVerify: false,
});
```

## 9. Git Workflow

- One-line commit messages
- No "Co-Authored-By: Claude" footer
- Create feature branches from master
- Simple PR titles and descriptions

## 10. Script Execution

Scripts run from project root:
```bash
npx ts-node scripts/path/to/script.ts
```

Documentation should include this one-liner prominently.
