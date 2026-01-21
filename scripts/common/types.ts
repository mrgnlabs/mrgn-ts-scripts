import { WrappedI80F48 } from "@mrgnlabs/mrgn-common";

export type RatePoint = {
  util: number;
  rate: number;
};

export type InterestRateConfigOpt1_6 = {
  // Fees
  insuranceFeeFixedApr: WrappedI80F48 | null;
  insuranceIrFee: WrappedI80F48 | null;
  protocolFixedFeeApr: WrappedI80F48 | null;
  protocolIrFee: WrappedI80F48 | null;

  protocolOriginationFee: WrappedI80F48 | null;

  zeroUtilRate: number | null;
  hundredUtilRate: number | null;
  points: RatePoint[] | null;
};