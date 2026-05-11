"use client";

import { use } from "react";
import Link from "next/link";
import useSWR from "swr";
import { Header } from "@/components/Header";
import { TokenTable } from "@/components/TokenTable";
import type { FamilyName, Token } from "@/types";
import { FAMILY_COLORS, FAMILY_LABELS } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function formatMcap(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

export default function FamilyPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = use(params);
  const family = name.toLowerCase() as FamilyName;
  const color = FAMILY_COLORS[family] ?? "#6B7280";
  const label = FAMILY_LABELS[family] ?? name.toUpperCase();

  const { data: tokens } = useSWR<Token[]>(
    `/api/family/${family}`,
    fetcher,
    { refreshInterval: 15_000 }
  );

  const totalMcap = tokens?.reduce((s, t) => s + t.mcap, 0) ?? 0;
  const topMover = tokens?.[0];
  const freshest = tokens
    ? [...tokens].sort((a, b) => a.age_seconds - b.age_seconds)[0]
    : null;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <div className="px-4 py-4" style={{ borderBottom: `1px solid ${color}30` }}>
        <Link
          href="/"
          className="text-troll-dim text-xs hover:text-troll-green transition-colors"
        >
          &lt; BACK
        </Link>

        <h1 className="text-2xl font-bold mt-2" style={{ color }}>
          {label} FAMILY
        </h1>

        <div className="flex gap-4 mt-3 text-xs">
          <div>
            <span className="text-troll-dim">TOKENS: </span>
            <span style={{ color }}>{tokens?.length ?? 0}</span>
          </div>
          <div>
            <span className="text-troll-dim">TOTAL MCAP: </span>
            <span style={{ color }}>{formatMcap(totalMcap)}</span>
          </div>
          {topMover && (
            <div>
              <span className="text-troll-dim">TOP MOVER: </span>
              <span style={{ color }}>{topMover.ticker}</span>
            </div>
          )}
          {freshest && (
            <div>
              <span className="text-troll-dim">FRESHEST: </span>
              <span style={{ color }}>{freshest.ticker}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1">
        <TokenTable family={family} />
      </div>

      <footer className="border-t border-troll-border px-4 py-3 text-center text-[10px] text-troll-dark">
        POWERED BY TROLLSCAN // {label} FAMILY VIEW
      </footer>
    </div>
  );
}
