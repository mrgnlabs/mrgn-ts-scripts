// Mostly just copied from client utils.
import { PublicKey, Connection } from "@solana/web3.js";
import * as borsh from "borsh";
import { PYTH_PUSH_ORACLE_ID } from "../types/constants";

export const PYTH_SPONSORED_SHARD_ID = 0;
export const MARGINFI_SPONSORED_SHARD_ID = 3301;

function feedIdToString(feedId: PublicKey): string {
  return feedId.toBuffer().toString("hex");
}

export function findPythPushOracleAddress(
  feedId: Buffer,
  programId: PublicKey,
  shardId: number
): PublicKey {
  const shardBytes = u16ToArrayBufferLE(shardId);
  return PublicKey.findProgramAddressSync([shardBytes, feedId], programId)[0];
}

function u16ToArrayBufferLE(value: number): Uint8Array {
  // Create a buffer of 2 bytes
  const buffer = new ArrayBuffer(2);
  const dataView = new DataView(buffer);

  // Set the Uint16 value in little-endian order
  dataView.setUint16(0, value, true);

  // Return the buffer
  return new Uint8Array(buffer);
}

export async function loadSponsoredOracle(
  feedKey: PublicKey,
  connection: Connection,
  shardId = PYTH_SPONSORED_SHARD_ID
): Promise<{
  address: PublicKey;
  priceAccount: ReturnType<typeof parsePriceInfo>;
}> {
  // 1) turn your feed key into the raw “feedId” bytes
  const feedId = feedKey.toBuffer();

  // 2) derive the Pyth-sponsored oracle PDA
  const oracleAddress = findPythPushOracleAddress(
    feedId,
    PYTH_PUSH_ORACLE_ID,
    shardId
  );

  // 3) pull down the account
  const info = await connection.getAccountInfo(oracleAddress);
  if (!info) {
    throw new Error(
      `No Pyth-sponsored oracle found at ${oracleAddress.toBase58()}`
    );
  }

  // 4) skip the first 8 bytes (bump + discriminator) and parse
  const priceAccount = parsePriceInfo(info.data.slice(8));
  return { address: oracleAddress, priceAccount };
}

type PriceUpdateV2 = {
  writeAuthority: Buffer;
  verificationLevel: number;
  priceMessage: {
    feedId: Buffer;
    price: bigint;
    conf: bigint;
    exponent: number;
    publishTime: bigint;
    prevPublishTime: bigint;
    emaPrice: bigint;
    emaConf: bigint;
  };
};

const priceUpdateV2Schema = {
  struct: {
    writeAuthority: {
      array: { type: "u8", len: 32 },
    },
    verificationLevel: "u8",
    priceMessage: {
      struct: {
        feedId: { array: { type: "u8", len: 32 } },
        price: "i64",
        conf: "u64",
        exponent: "i32",
        publishTime: "i64",
        prevPublishTime: "i64",
        emaPrice: "i64",
        emaConf: "u64",
      },
    },
    postedSlot: "u64",
  },
};

export const parsePriceInfo = (data: Buffer): PriceUpdateV2 => {
  let decoded: PriceUpdateV2 = borsh.deserialize(
    priceUpdateV2Schema,
    data
  ) as any;
  return decoded;
};
