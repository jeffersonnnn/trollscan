"use client";

import useSWR from "swr";
import type { Token, FamilyStats } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="panel p-3 flex-1 min-w-[140px]">
      <div className="text-[10px] text-troll-dim uppercase tracking-widest mb-1">
        {label}
      </div>
      <div className="text-troll-green text-lg font-bold">{value}</div>
      {sub && <div className="text-troll-dim text-xs mt-0.5">{sub}</div>}
    </div>
  );
}

export function Hero() {
  const { data: tokens } = useSWR<Token[]>("/api/tokens?limit=50", fetcher, {
    refreshInterval: 15_000,
  });
  const { data: families } = useSWR<FamilyStats[]>("/api/families", fetcher, {
    refreshInterval: 30_000,
  });

  const topFamily = families?.[0];
  const hottest = tokens?.[0];
  const freshCount =
    tokens?.filter((t) => t.age_seconds < 3600).length ?? 0;
  const totalVol =
    tokens?.reduce((sum, t) => sum + (t.volume_24h ?? 0), 0) ?? 0;

  return (
    <div className="flex gap-3 overflow-x-auto px-4 py-3">
      <StatCard
        label="TOP META"
        value={topFamily?.name?.toUpperCase() ?? "---"}
        sub={topFamily ? `${topFamily.active_count} active, ${formatNumber(topFamily.total_volume)} vol` : undefined}
      />
      <StatCard
        label="HOTTEST"
        value={hottest?.ticker ?? "---"}
        sub={hottest ? `vel: ${hottest.velocity_score.toFixed(0)}` : undefined}
      />
      <StatCard
        label="FRESH (<1H)"
        value={String(freshCount)}
        sub="launches"
      />
      <StatCard
        label="24H VOLUME"
        value={formatNumber(totalVol)}
        sub="tracked tokens"
      />
    </div>
  );
}
