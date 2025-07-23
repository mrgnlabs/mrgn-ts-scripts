import React from "react";
import { BankList } from "../components/BankList";
import type { FetchedBank } from "../services/api";

interface BankInfoPageProps {
  banks: FetchedBank[];
  error: string | null;
}

export function BankInfoPage({ banks, error }: BankInfoPageProps) {
  if (error) {
    console.error(error);
  }
  return <BankList banks={banks} />;
}
