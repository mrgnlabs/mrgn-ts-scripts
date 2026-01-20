# Drift Protocol Mainnet Spot Markets Research

**Date:** 2025-11-08
**Purpose:** Identify viable Drift spot markets for marginfi integration

## Summary

Successfully fetched **61 Drift spot markets** from mainnet. Below are the top candidates for marginfi drift integration.

## Key Findings

### Token-2022 Assets (5 total)
These are particularly interesting as they demonstrate Token-2022 program compatibility:

1. **PYUSD** (PayPal USD)
   - Market Index: 10500
   - Mint: `2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo`
   - Oracle: `5QZMnsyndmphvZF4BNgoMHwVZaREXeE2rpBoCPMxgCCd`
   - Token Program: Token-2022
   - **Recommended**: Yes - major stablecoin on Token-2022

2. **AUSD** (Agora USD)
   - Market Index: 10500
   - Mint: `AUSD1jCcCyPLybk1YnvPWsHQSrZ46dxwoMniN4N2UEB9`
   - Oracle: `9JYpqJfLXgrW8Wqzfd93GvJF73m2jJFjNqpQv3wQtehZ`
   - Token Program: Token-2022
   - **Recommended**: Maybe - newer stablecoin

3. **PUMP**
   - Market Index: 13000
   - Mint: `pumpCmXqMfrsAkQ5r49WcJnRayYRqmXz6ae8H7H9Dfn`
   - Oracle: `5r8RWTaRiMgr9Lph3FTUE3sGb1vymhpCrm83Bovjfcps`
   - Token Program: Token-2022
   - **Recommended**: Maybe - meme coin, higher risk

4. **AI16Z**
   - Market Index: 15000
   - Mint: `HeLp6NuQkmYB4pYWo2zYs22mESHXPQYzXbB8n4V98jwC`
   - Oracle: `3BGheQVvYtBNpBKSUXSTjpyKQc3dh8iiwT91Aiq7KYCU`
   - Token Program: Token-2022
   - **Recommended**: Maybe - AI meme coin

5. **sACRED-4**
   - Market Index: 10500
   - Mint: `59CwZq5b6drmDizgGfxECG7f16hxDpG1nXrxPoQx4y8g`
   - Oracle: `GheMfcCB49SuVCWrFReQDD2tLkcPDMG3qZEZWU44mHu`
   - Token Program: Token-2022

## Top 10 Recommended Candidates for Integration

### 1. USDC (Native)
- **Market Index:** 10000
- **Mint:** `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`
- **Oracle:** `9VCioxmni2gDLv11qufWzT3RDERhQE4iY5Gf7NTfYyAV`
- **Decimals:** 6
- **Token Program:** SPL Token
- **Drift Spot Market:** `6gMq3mRCKf8aP3ttTyYhuijVZ2LGi14oDsBbkgubfLB3`
- **Priority:** HIGH - Core stablecoin

### 2. SOL (Native)
- **Market Index:** 11000
- **Mint:** `So11111111111111111111111111111111111111112`
- **Oracle:** `3m6i4RFWEDw2Ft4tFHPJtYgmpPe21k56M3FHeWYrgGBz`
- **Decimals:** 9
- **Token Program:** SPL Token
- **Drift Spot Market:** `3x85u7SWkmmr7YQGYhtjARgxwegTLJgkSLRprfXod6rh`
- **Priority:** HIGH - Native SOL

### 3. PYUSD (Token-2022)
- **Market Index:** 10500
- **Mint:** `2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo`
- **Oracle:** `5QZMnsyndmphvZF4BNgoMHwVZaREXeE2rpBoCPMxgCCd`
- **Decimals:** 6
- **Token Program:** Token-2022
- **Drift Spot Market:** `GyyHYVCrZGc2AQPuvNbcP1babmU3L42ptmxZthUfD9q`
- **Priority:** HIGH - Token-2022 stablecoin, PayPal backed

### 4. jitoSOL (LST)
- **Market Index:** 11000
- **Mint:** `J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn`
- **Oracle:** `2cHCtAkMnttMh3bNKSCgSKSP5D4yN3p8bfnMdS3VZsDf`
- **Decimals:** 9
- **Token Program:** SPL Token
- **Drift Spot Market:** `6Aq7WBtsZVyumcRxpAoKNyWb97gAzp3be2LeQ9yE6SVX`
- **Priority:** HIGH - Popular LST with rewards

### 5. mSOL (LST)
- **Market Index:** 11000
- **Mint:** `mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So`
- **Oracle:** `FY2JMi1vYz1uayVT2GJ96ysZgpagjhdPRG2upNPtSZsC`
- **Decimals:** 9
- **Token Program:** SPL Token
- **Drift Spot Market:** `Mr2XZwj1NisUur3WZWdERdqnEUMoa9F9pUr52vqHyqj`
- **Priority:** HIGH - Marinade LST

### 6. bSOL (LST)
- **Market Index:** 11000
- **Mint:** `bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1`
- **Oracle:** `BmDWPMsytWmYkh9n6o7m79eVshVYf2B5GVaqQ2EWKnGH`
- **Decimals:** 9
- **Token Program:** SPL Token
- **Drift Spot Market:** `3fy2oMRJGceC3GAt9zGUBWt8MzjV5XxQDWKYLtiHPevX`
- **Priority:** MEDIUM - Blaze LST

### 7. JLP (Jupiter LP Token)
- **Market Index:** 11000
- **Mint:** `27G8MtK7VtTcCHkpASjSDdkWWYfoqT6ggEuKidVJidD4`
- **Oracle:** `4VMtKepA6iFwMTJ7bBbdcGxavNRKiDjxxRr1CaB2NnFJ`
- **Decimals:** 6
- **Token Program:** SPL Token
- **Drift Spot Market:** `DVYXHwLhwALZm94pChALZDJ2b6a7uZTKPXntAGMQtRoM`
- **Priority:** MEDIUM - Popular LP token

### 8. USDT
- **Market Index:** 10250
- **Mint:** `Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB`
- **Oracle:** `JDKJSkxjasBGL3ce1pkrN6tqDzuVUZPWzzkGuyX8m9yN`
- **Decimals:** 6
- **Token Program:** SPL Token
- **Drift Spot Market:** `7pPeeTqcqYeED7k4ocdeaSx3MAwT56Y7khyCx1zfS8jM`
- **Priority:** HIGH - Major stablecoin

### 9. wBTC (Wrapped Bitcoin)
- **Market Index:** 11000
- **Mint:** `3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh`
- **Oracle:** `fqPfDa6uQr9ndMvwaFp4mUBeUrHmLop8Jxfb1XJNmVm`
- **Decimals:** 8
- **Token Program:** SPL Token
- **Drift Spot Market:** `54Ai4NTZmPgsT4kUr1w4zFbh33JaC34ptvvvByamsaSw`
- **Priority:** MEDIUM - BTC exposure

### 10. wETH (Wrapped Ethereum)
- **Market Index:** 11000
- **Mint:** `7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs`
- **Oracle:** `6bEp2MiyoiiiDxcVqE8rUHQWwHirXUXtKfAEATTVqNzT`
- **Decimals:** 8
- **Token Program:** SPL Token
- **Drift Spot Market:** `64WtBLXJsFnmoFR2kXqbTz3KzNP5x1SrpSn8zmkbF6xB`
- **Priority:** MEDIUM - ETH exposure

## Additional Notable Markets

### 2Z Token
- **Market Index:** 13000
- **Mint:** `J6pQQ3FAcJQeWPPGppWRb4nM8jU3wLyYbRrLh7feMfvd`
- **Oracle:** `4HTDpcHAwBTHCJLNMwT35w4FGc4nfA4YhT1BkcZQwQ2m`
- **Decimals:** 9
- **Token Program:** SPL Token
- **Drift Spot Market:** `8h4B1tfDseHKhSdcywsj9QMpZe5LEV5uWGYUaBtNcTns`
- **Priority:** MEDIUM - Similar to our PUMP/2Z addition

### JUP (Jupiter)
- **Market Index:** 12500
- **Mint:** `JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN`
- **Oracle:** `DXqKSHyhTBKEW4qgnL7ycbf3Jca5hCvUgWHFYWsh4KJa`
- **Decimals:** 6
- **Token Program:** SPL Token
- **Drift Spot Market:** `7GGF99Et8AN8bjKug9nh6BJAQ3LKSziD2ceCps89zvQa`
- **Priority:** MEDIUM - Major DEX token

### WIF (Dogwifhat)
- **Market Index:** 14000
- **Mint:** `EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm`
- **Oracle:** `4QXWStoyEErTZFVsvKrvxuNa6QT8zpeA8jddZunSGvYE`
- **Decimals:** 6
- **Token Program:** SPL Token
- **Drift Spot Market:** `GyhmatSvGuo5nwPMLwH7CELGfDL8hLH4KSzRZj64whk2`
- **Priority:** LOW - Meme coin

### Bonk
- **Market Index:** 14000
- **Mint:** `DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263`
- **Oracle:** `BERaNi6cpEresbq6HC1EQGaB1H1UjvEo4NGnmYSSJof4`
- **Decimals:** 5
- **Token Program:** SPL Token
- **Drift Spot Market:** `7AJ4HcUkTLJimx5Q5NSoGrQ3ffm83Sh55fr5iavUJHJV`
- **Priority:** LOW - Meme coin

## Oracle Type Information

**Important:** All Drift oracles need to be verified for their oracle type. The marginfi drift integration expects **Pyth Pull** oracles specifically.

To verify oracle type, we need to:
1. Check the Drift spot market account's `oracle_source` field
2. Ensure it's set to `PythPull` variant
3. Get the oracle address from Drift's configuration

The oracles listed above are Drift's oracle accounts. For marginfi integration, we need to:
- Use Drift's oracle address in the `driftOracle` config field
- Separately specify the Pyth Pull oracle address in the `oracle` config field

## Next Steps

1. **Verify Oracle Types**: Check each oracle to ensure it's Pyth Pull compatible
2. **Check Token Mint Decimals**: The decimal values in the research may be off by factor (need to verify actual mint decimals)
3. **Create Config Files**: For each candidate, create a config file in `/root/projects/mrgn-ts-scripts/scripts/drift-staging/configs/`
4. **Test Integration**: Start with USDC and SOL as they're the most straightforward
5. **Add Token-2022 Support**: PYUSD is a great candidate to test Token-2022 compatibility

## Config File Template

Based on `/root/projects/mrgn-ts-scripts/scripts/drift-staging/configs/example.json`:

```json
{
  "programId": "STAGING_PROGRAM_ID_HERE",
  "group": "GROUP_PUBKEY_HERE",
  "bankMint": "MINT_PUBKEY_HERE",
  "driftMarketIndex": 0,
  "oracle": "PYTH_PULL_ORACLE_PUBKEY",
  "driftOracle": "DRIFT_ORACLE_PUBKEY",
  "depositLimit": "100000000000000",
  "totalAssetValueInitLimit": "10000000000000",
  "seed": "555",
  "initDepositAmount": "100"
}
```

## Drift Program Information

- **Drift Program ID:** `dRiftyHA39MWEi3m9aunc5MzRF1JYuBsbn6VPcn33UH`
- **Total Spot Markets:** 61
- **Network:** Mainnet
- **RPC:** `https://rpc.ironforge.network/mainnet?apiKey=01JSM3YXH7YWNSDTPDKVSR85QN`

## Research Script Location

- Main script: `/root/projects/mrgn-ts-scripts/scripts/drift-staging/research_drift_markets_simple.ts`
- Output: `/tmp/drift_markets_research.txt`

## Notes

1. **Decimals Verification Needed**: The decimal values extracted from Drift's SpotMarket accounts appear incorrect (showing market_index values). Need to verify actual mint decimals from token mint accounts.

2. **Multiple Market Instances**: Some assets have multiple market indices (e.g., USDC, jitoSOL, JTO). This could indicate:
   - Different pool configurations
   - Historical markets
   - Different trading pairs
   - Need to investigate which is the primary/active market

3. **Oracle Source**: Need to determine oracle type (Pyth, Pyth Pull, Switchboard) for each market to ensure compatibility with marginfi's integration.

4. **Liquidity & Volume**: Should check on-chain data or Drift's UI for actual liquidity and trading volume before selecting markets.

5. **Token-2022 Opportunities**: The 5 Token-2022 assets found are excellent candidates for testing Token-2022 program compatibility, especially PYUSD as a major stablecoin.
