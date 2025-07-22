// src/components/BankItem.tsx
import { useState } from "react";
import BigNumber from "bignumber.js";
import { wrappedI80F48toBigNumber } from "@mrgnlabs/mrgn-common";
import type { WrappedI80F48 } from "@mrgnlabs/mrgn-common";
import type { FetchedBank } from "../services/api";
import { PublicKey } from "@solana/web3.js";

const fmt = (value: BigNumber, decimals = 4) =>
  value.toFormat(decimals, BigNumber.ROUND_DOWN, {
    groupSeparator: ",",
    decimalSeparator: ".",
    groupSize: 3,
  });

const fromI80 = (x: WrappedI80F48, decimals = 4) =>
  fmt(wrappedI80F48toBigNumber(x), decimals);

const fromBN = (bn: any, decimals = 0) =>
  fmt(new BigNumber(bn.toString()), decimals);

interface BankItemProps {
  bank: FetchedBank;
}

export const BankItem: React.FC<BankItemProps> = ({ bank }) => {
  const [open, setOpen] = useState(false);

  const cfg = bank.bankAcc.config;
  const dec = bank.bankAcc.mintDecimals ?? 0;
  const scale = new BigNumber(10).pow(dec);

  // human‑readable totals
  const totalAssets = wrappedI80F48toBigNumber(
    bank.bankAcc.totalAssetShares as any
  )
    .multipliedBy(wrappedI80F48toBigNumber(bank.bankAcc.assetShareValue as any))
    .dividedBy(scale);
  const totalLiabs = wrappedI80F48toBigNumber(
    bank.bankAcc.totalLiabilityShares as any
  )
    .multipliedBy(
      wrappedI80F48toBigNumber(bank.bankAcc.liabilityShareValue as any)
    )
    .dividedBy(scale);

  return (
    <li className="border-b py-3">
      <div className="flex justify-between">
        <span className="font-semibold">{bank.tokenName}</span>
        <button
          onClick={() => setOpen((o) => !o)}
          className="text-blue-600 text-sm hover:underline"
        >
          {open ? "Hide details" : "Show details"}
        </button>
      </div>

      {open && (
        <div className="mt-3 space-y-4 text-sm">
          {/* Metrics */}
          <section>
            <h4 className="font-medium mb-1">Metrics</h4>
            <dl className="grid grid-cols-2 gap-2">
              <dt>is T22 Mint</dt>
              <dd>{bank.bankAcc.isT22Mint ? "Yes" : "No"}</dd>
              <dt>Group</dt>
              <dd>{bank.bankAcc.group.toString()}</dd>
              <dt>Mint</dt>
              <dd>{bank.bankAcc.mint.toString()}</dd>
              <dt>Mint Decimals</dt>
              <dd>{dec}</dd>
              <dt>Bank Flags</dt>
              <dd>{bank.bankAcc.flags.toNumber()}</dd>
              <dt>Config Flags</dt>
              <dd>{cfg.configFlags}</dd>
              <dt>Risk Tier</dt>
              <dd>{JSON.stringify(cfg.riskTier)}</dd>
              <dt>Operating Mode</dt>
              <dd>{JSON.stringify(cfg.operationalState)}</dd>
              <dt>Oracle Max Age (s)</dt>
              <dd>{cfg.oracleMaxAge}</dd>
            </dl>
          </section>

          {/* Weights (WrappedI80F48) */}
          <section>
            <h4 className="font-medium mb-1">Weights</h4>
            <dl className="grid grid-cols-2 gap-2">
              <dt>Asset Weight Init</dt>
              <dd>{fromI80(cfg.assetWeightInit as WrappedI80F48)}</dd>
              <dt>Asset Weight Maint</dt>
              <dd>{fromI80(cfg.assetWeightMaint as WrappedI80F48)}</dd>
              <dt>Liab Weight Init</dt>
              <dd>{fromI80(cfg.liabilityWeightInit as WrappedI80F48)}</dd>
              <dt>Liab Weight Maint</dt>
              <dd>{fromI80(cfg.liabilityWeightMaint as WrappedI80F48)}</dd>
            </dl>
          </section>

          {/* Oracles */}
          {cfg.oracleKeys.filter(
            (k) => k.toString() !== PublicKey.default.toString()
          ).length > 0 && (
            <section>
              <h4 className="font-medium mb-1">Oracle Keys</h4>
              <ul className="list-disc list-inside">
                {cfg.oracleKeys
                  .filter((k) => k.toString() !== PublicKey.default.toString())
                  .map((k, i) => (
                    <li key={i}>
                      #{i}: <code>{k.toString()}</code>
                    </li>
                  ))}
              </ul>
              <dt>Oracle Type</dt>
              <dd>{JSON.stringify(cfg.oracleSetup)}</dd>
            </section>
          )}

          {/* Deposits & Limits (mixed types) */}
          <section>
            <h4 className="font-medium mb-1">Deposits & Limits</h4>
            <dl className="grid grid-cols-2 gap-2">
              <dt>Deposits (shares)</dt>
              <dd>{fromI80(bank.bankAcc.totalAssetShares as WrappedI80F48)}</dd>

              <dt>Liabilities (shares)</dt>
              <dd>
                {fromI80(bank.bankAcc.totalLiabilityShares as WrappedI80F48)}
              </dd>

              <dt>Deposits per Share</dt>
              <dd>{fromI80(bank.bankAcc.assetShareValue as WrappedI80F48)}</dd>

              <dt>Liabs per Share</dt>
              <dd>{fromI80(cfg.liabilityWeightMaint as WrappedI80F48)}</dd>

              <dt>Total Deposits (token)</dt>
              <dd>{fmt(totalAssets, /* 4 decimals */ 4)}</dd>

              <dt>Total Liabilities (token)</dt>
              <dd>{fmt(totalLiabs, 4)}</dd>

              <dt>Deposit Limit (token)</dt>
              <dd>{fromBN(cfg.depositLimit)}</dd>

              <dt>Borrow Limit (token)</dt>
              <dd>{fromBN(cfg.borrowLimit)}</dd>

              <dt>UI Limit ($)</dt>
              <dd>{fromBN(cfg.totalAssetValueInitLimit)}</dd>
            </dl>
          </section>

          {/* Fees (BN) */}
          <section>
            <h4 className="font-medium mb-1">Fees</h4>
            <dl className="grid grid-cols-2 gap-2">
              <dt>Owed to Insurance</dt>
              <dd>{fromI80(bank.bankAcc.collectedInsuranceFeesOutstanding)}</dd>
              <dt>Owed to Group</dt>
              <dd>{fromI80(bank.bankAcc.collectedGroupFeesOutstanding)}</dd>
              <dt>Owed to Program</dt>
              <dd>{fromI80(bank.bankAcc.collectedProgramFeesOutstanding)}</dd>
            </dl>
          </section>

          {/* Interest Rate Config (WrappedI80F48) */}
          <section>
            <h4 className="font-medium mb-1">Interest Rate Config</h4>
            <dl className="grid grid-cols-2 gap-2">
              <dt>Optimal Utilization Rate</dt>
              <dd>
                {fromI80(
                  cfg.interestRateConfig.optimalUtilizationRate as WrappedI80F48
                )}
              </dd>

              <dt>Plateau Interest Rate</dt>
              <dd>
                {fromI80(
                  cfg.interestRateConfig.plateauInterestRate as WrappedI80F48
                )}
              </dd>

              <dt>Max Interest Rate</dt>
              <dd>
                {fromI80(
                  cfg.interestRateConfig.maxInterestRate as WrappedI80F48
                )}
              </dd>

              <dt>Insurance Fee Fixed APR</dt>
              <dd>
                {fromI80(
                  cfg.interestRateConfig.insuranceFeeFixedApr as WrappedI80F48
                )}
              </dd>

              <dt>Insurance IR Fee</dt>
              <dd>
                {fromI80(
                  cfg.interestRateConfig.insuranceIrFee as WrappedI80F48
                )}
              </dd>

              <dt>Protocol Fixed Fee APR</dt>
              <dd>
                {fromI80(
                  cfg.interestRateConfig.protocolFixedFeeApr as WrappedI80F48
                )}
              </dd>

              <dt>Protocol IR Fee</dt>
              <dd>
                {fromI80(cfg.interestRateConfig.protocolIrFee as WrappedI80F48)}
              </dd>

              <dt>Protocol Origination Fee</dt>
              <dd>
                {fromI80(
                  cfg.interestRateConfig.protocolOriginationFee as WrappedI80F48
                )}
              </dd>
            </dl>
          </section>
        </div>
      )}
    </li>
  );
};
