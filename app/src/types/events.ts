export type EventKind = "deposit" | "withdraw" | "repay" | "borrow";

export interface EventTotals {
  count: number;
  total: bigint;
  flaggedCount: number;
  flaggedTotal: bigint;
}

export interface BankEventStats {
  deposit: EventTotals;
  withdraw: EventTotals;
  repay: EventTotals;
  borrow: EventTotals;
}

export const createEmptyEventTotals = (): EventTotals => ({
  count: 0,
  total: 0n,
  flaggedCount: 0,
  flaggedTotal: 0n,
});

export const createEmptyBankEventStats = (): BankEventStats => ({
  deposit: createEmptyEventTotals(),
  withdraw: createEmptyEventTotals(),
  repay: createEmptyEventTotals(),
  borrow: createEmptyEventTotals(),
});
