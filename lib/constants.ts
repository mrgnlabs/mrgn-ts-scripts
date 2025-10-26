import { PublicKey } from "@solana/web3.js";

export const PYTH_PUSH_ORACLE_ID = new PublicKey("pythWSnswVUd12oZpeFP8e9CVaEqJg25g1Vtc2biRsT");
export const PYTH_SPONSORED_SHARD_ID = 0;
export const MARGINFI_SPONSORED_SHARD_ID = 3301;

/** By convention, all tags must be in 13375p34k (kidding, but only sorta) */
// export const enum EmodeTag {
//   SOL = 501,
//   LST = 157,
//   STABLE = 5748, // STAB because 574813 is out of range
//   MEME = 1313,
//   STAKE = 57412
// }

export const enum EmodeTag {
  SOL = 501,
  LST_T1 = 1571,
  LST_T2 = 1572,
  JLP = 619,
  STABLE_T1 = 57481,
  STABLE_T2 = 57482,
  BTC_T1 = 871,
  BTC_T2 = 872
}

export const MAX_EMODE_ENTRIES = 10;
export const EMODE_APPLIES_TO_ISOLATED = 1;

/** u32 MAX. Often used for specifying a percentage, on chain, e.g. N% * u32MAX is stored */
export const u32MAX: number = 4_294_967_295;
