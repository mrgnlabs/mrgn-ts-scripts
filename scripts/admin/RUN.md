# Transfer Group Admin Authority

### Run the script

```bash
npx ts-node scripts/admin/transfer_group_admin.ts
```

## What happens

1. Script fetches current group state
2. Simulates the transaction (shows program logs)
3. If simulation succeeds, executes the transaction
4. Verifies all 5 admin roles were transferred

## Expected Output

```
=== Transfer Group Admin Authority ===

Group: ERBiJdWtnVBBd4gFm7YVHT3a776x5NbGbJBR5BDvsxtj
New Admin (all roles): 6QXw5bWtMcHBVPoqedh7hdwnetfQyKSZ19Vh1xrCvmym
Mode: EXECUTE

Current Admins:
  General Admin: 725Z4QQUVhRiXcCdf4cQTrxXYmQXyW9zgVkW5PDVSJz4
  E-mode Admin: 725Z4QQUVhRiXcCdf4cQTrxXYmQXyW9zgVkW5PDVSJz4
  ...

Simulating transaction to verify...

Program Logs:
  Program 5UDghkpgW1HfYSrmEj2iAApHShqU44H6PKTAar9LL9bY invoke [1]
  Program log: Instruction: MarginfiGroupConfigure
  Program log: Set admin from 725Z4QQ... to 6QXw5bW...
  Program log: Set emode admin from 725Z4QQ... to 6QXw5bW...
  Program log: Set curve admin from 725Z4QQ... to 6QXw5bW...
  Program log: Set limit admin from 725Z4QQ... to 6QXw5bW...
  Program log: Set emissions admin from 725Z4QQ... to 6QXw5bW...
  Program 5UDghkpgW1HfYSrmEj2iAApHShqU44H6PKTAar9LL9bY success

✓ Simulation successful!
Compute units consumed: 116992

Executing transaction...

✓ Transaction successful!
Signature: [TX_SIGNATURE]
Explorer: https://solscan.io/tx/[TX_SIGNATURE]

New Admins:
  General Admin: 6QXw5bWtMcHBVPoqedh7hdwnetfQyKSZ19Vh1xrCvmym ✓
  E-mode Admin: 6QXw5bWtMcHBVPoqedh7hdwnetfQyKSZ19Vh1xrCvmym ✓
  Curve Admin: 6QXw5bWtMcHBVPoqedh7hdwnetfQyKSZ19Vh1xrCvmym ✓
  Limit Admin: 6QXw5bWtMcHBVPoqedh7hdwnetfQyKSZ19Vh1xrCvmym ✓
  Emissions Admin: 6QXw5bWtMcHBVPoqedh7hdwnetfQyKSZ19Vh1xrCvmym ✓
```

## Command to run from project root

```bash
npx ts-node scripts/admin/transfer_group_admin.ts
```

That's it! Copy and paste this single command from the root of the `mrgn-ts-scripts` directory.
