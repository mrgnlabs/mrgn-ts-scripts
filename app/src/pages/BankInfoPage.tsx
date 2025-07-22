import React from "react";
import { BankList } from "../components/BankList";
import type { FetchedBank } from "../services/api";

interface BankInfoPageProps {
  banks: FetchedBank[];
  error: string | null;
}

export function BankInfoPage({ banks, error }: BankInfoPageProps) {
  return <BankList banks={banks} error={error} />;
}
