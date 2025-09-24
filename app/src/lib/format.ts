import BigNumber from "bignumber.js";

export const formatTokenAmount = (
  raw: bigint,
  decimals: number,
  options?: { maxFractionDigits?: number }
): string => {
  if (raw === 0n) {
    return "0";
  }

  const amount = new BigNumber(raw.toString());
  if (decimals === 0) {
    return amount.toFormat(0, BigNumber.ROUND_DOWN, {
      groupSeparator: ",",
      decimalSeparator: ".",
      groupSize: 3,
    });
  }

  const divisor = new BigNumber(10).pow(decimals);
  const decimalPlaces = Math.min(
    decimals,
    options?.maxFractionDigits ?? 6
  );

  return amount
    .dividedBy(divisor)
    .toFormat(decimalPlaces, BigNumber.ROUND_DOWN, {
      groupSeparator: ",",
      decimalSeparator: ".",
      groupSize: 3,
    });
};

export const formatTokenAmountFixed = (
  raw: bigint,
  decimals: number,
  fractionDigits = 4,
): string => {
  if (fractionDigits < 0) {
    throw new Error("fractionDigits must be non-negative");
  }

  if (raw === 0n) {
    return `0.${"0".repeat(fractionDigits)}`;
  }

  const divisor = decimals > 0 ? new BigNumber(10).pow(decimals) : new BigNumber(1);
  const normalized = new BigNumber(raw.toString()).dividedBy(divisor);

  return normalized.toFormat(fractionDigits, BigNumber.ROUND_DOWN, {
    groupSeparator: ",",
    decimalSeparator: ".",
    groupSize: 3,
  });
};
