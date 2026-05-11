"use client";

import useSWR from "swr";
import type { FamilyName, FamilyStats } from "@/types";
import { FAMILY_COLORS } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function formatVol(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function formatAge(seconds: number): string {
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function MetaWaves({
  onSelect,
}: {
  onSelect: (family: FamilyName) => void;
}) {
  const { data: families } = useSWR<FamilyStats[]>("/api/families", fetcher, {
    refreshInterval: 15_000,
  });

  const active = families?.filter((f) => f.active_count > 0) ?? [];

  if (active.length === 0) {
    return (
      <div className="px-4 py-3 text-troll-dim text-xs">
        SCANNING_FOR_META_WAVES...
      </div>
    );
  }

  return (
    <div className="px-4 py-3">
      <div className="section-header">META_WAVES // ACTIVE_NARRATIVES</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
        {active.map((f, i) => {
          const color = FAMILY_COLORS[f.name] ?? "#6B7280";
          return (
            <button
              key={f.name}
              onClick={() => onSelect(f.name)}
              className="panel p-3 text-left hover:brightness-125 transition-all group"
              style={{ borderColor: `${color}40` }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className="text-sm font-bold tracking-wide"
                  style={{ color }}
                >
                  {i === 0 && "🔥 "}
                  {f.name.toUpperCase()}
                </span>
                <span className="text-[10px] text-troll-dim">
                  {f.token_count} tokens
                </span>
              </div>

              <div className="text-[11px] text-troll-dim space-y-0.5">
                <div className="flex justify-between">
                  <span>LEADER</span>
                  <span style={{ color }}>{f.top_token ?? "---"}</span>
                </div>
                <div className="flex justify-between">
                  <span>24H VOL</span>
                  <span className="text-troll-green">
                    {formatVol(f.total_volume)}
                  </span>
                </div>
                {f.fresh_count > 0 && (
                  <div className="flex justify-between">
                    <span>FRESH (&lt;2H)</span>
                    <span className="text-troll-warn">
                      {f.fresh_count} new
                    </span>
                  </div>
                )}
                {f.freshest_token && f.freshest_age != null && (
                  <div className="flex justify-between">
                    <span>NEWEST</span>
                    <span style={{ color }}>
                      {f.freshest_token}{" "}
                      <span className="text-troll-dim">
                        {formatAge(f.freshest_age)}
                      </span>
                    </span>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
