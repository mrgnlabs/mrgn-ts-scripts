import React from "react";
import { BankList } from "../components/BankList";
import type { FetchedBank } from "../services/api";

interface BankInfoPageProps {
  banks: FetchedBank[];
}

export function BankInfoPage({ banks }: BankInfoPageProps) {
  return <BankList banks={banks} />;
}
