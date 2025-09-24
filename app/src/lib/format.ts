import BigNumber from "bignumber.js";

interface FormatTokenAmountOptions {
  maxFractionDigits?: number;
  fractionDigits?: number;
}

export const formatTokenAmount = (
  raw: bigint,
  decimals: number,
  options?: FormatTokenAmountOptions,
): string => {
  if (raw === 0n) {
    if (options?.fractionDigits !== undefined) {
      if (options.fractionDigits === 0) {
        return "0";
      }
      return `0.${"0".repeat(options.fractionDigits)}`;
    }
    return "0";
  }

  const amount = new BigNumber(raw.toString());
  const divisor = new BigNumber(10).pow(decimals);
  const decimalPlaces =
    options?.fractionDigits ??
    (decimals === 0
      ? 0
      : Math.min(decimals, options?.maxFractionDigits ?? 6));

  return amount
    .dividedBy(divisor)
    .toFormat(decimalPlaces, BigNumber.ROUND_DOWN, {
      groupSeparator: ",",
      decimalSeparator: ".",
      groupSize: 3,
    });
};
