"use client";

import useSWR from "swr";
import { useEffect } from "react";
import type { Token, SortField } from "@/types";
import { TokenRow } from "./TokenRow";
import { useFamilyMeta } from "@/lib/useFamilyMeta";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function TokenTable({
  family,
  sortBy = "velocity",
}: {
  family?: string;
  sortBy?: SortField;
}) {
  const { getColor } = useFamilyMeta();
  const familyParam =
    family && family !== "all" ? `&family=${family}` : "";
  const url = `/api/tokens?sort=${sortBy}&limit=50${familyParam}`;

  const { data: tokens, mutate } = useSWR<Token[]>(url, fetcher, {
    refreshInterval: 15_000,
  });

  useEffect(() => {
    const es = new EventSource("/api/stream");
    es.addEventListener("tokens.updated", () => {
      mutate();
    });
    return () => es.close();
  }, [mutate]);

  if (!tokens) {
    return (
      <div className="px-4 py-8 text-center text-troll-dim text-sm">
        <span className="animate-pulse-glow">SCANNING...</span>
      </div>
    );
  }

  if (tokens.length === 0) {
    return (
      <div className="px-4 py-8 text-center text-troll-dim text-sm">
        NO_TOKENS_FOUND // WAITING_FOR_DATA
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="grid grid-cols-[2rem_1fr_4rem_3rem_4rem_4rem_4rem_4rem_4rem_3rem_2rem_2rem] md:grid-cols-[2rem_1fr_4rem_3rem_5rem_5rem_4rem_4rem_4rem_3rem_2rem_2.5rem] gap-2 px-4 py-2 text-[10px] text-troll-dim uppercase tracking-wider border-b border-troll-border">
        <span>#</span>
        <span>TOKEN</span>
        <span>FAM</span>
        <span>AGE</span>
        <span>MCAP</span>
        <span className="hidden md:block">VOL</span>
        <span>1H</span>
        <span className="hidden md:block">6H</span>
        <span className="hidden md:block">24H</span>
        <span>VEL</span>
        <span></span>
        <span></span>
      </div>

      {tokens.map((token, i) => (
        <TokenRow key={token.mint} token={token} rank={i + 1} getColor={getColor} />
      ))}
    </div>
  );
}
