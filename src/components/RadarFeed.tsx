"use client";

import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import type { Token } from "@/types";
import { VelocityBadge } from "./VelocityBadge";
import { FAMILY_COLORS } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function formatAge(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  return `${Math.floor(seconds / 3600)}h`;
}

function formatMcap(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toFixed(0);
}

function CopyMint({ mint }: { mint: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(mint);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      onClick={handleCopy}
      className="text-[8px] px-1 py-0.5 rounded border border-troll-border text-troll-dim hover:text-troll-green hover:border-troll-green/40 transition-colors"
      title={mint}
    >
      {copied ? "OK" : "CA"}
    </button>
  );
}

export function RadarFeed() {
  const { data: tokens } = useSWR<Token[]>("/api/radar", fetcher, {
    refreshInterval: 15_000,
  });
  const { data: newest } = useSWR<Token[]>(
    "/api/tokens?sort=age&limit=15",
    fetcher,
    { refreshInterval: 15_000 }
  );

  const fresh = newest?.filter((t) => t.age_seconds < 86400).slice(0, 10) ?? [];
  const radar = tokens ?? [];

  return (
    <div className="panel p-3 h-full space-y-4">
      {fresh.length > 0 && (
        <div>
          <div className="section-header">FRESH_DROPS // NEWEST</div>
          <div className="space-y-1 max-h-[250px] overflow-y-auto">
            {fresh.map((token) => {
              const color = FAMILY_COLORS[token.family] ?? "#6B7280";
              return (
                <div
                  key={`new-${token.mint}`}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded hover:bg-troll-dark/50 transition-colors text-xs animate-fade-up"
                >
                  <Link
                    href={`/token/${token.mint}`}
                    className="flex-1 min-w-0"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] px-1 py-0.5 rounded bg-troll-warn/20 text-troll-warn">
                          NEW
                        </span>
                        <span className="font-bold" style={{ color }}>
                          {token.ticker}
                        </span>
                      </div>
                      <span className="text-troll-dim">
                        {formatAge(token.age_seconds)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-troll-dim">
                        ${formatMcap(token.mcap)}
                      </span>
                      <VelocityBadge score={token.velocity_score} />
                    </div>
                  </Link>
                  <CopyMint mint={token.mint} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <div className="section-header">RADAR_FEED // HOT_UNDER_2H</div>

        {!tokens && (
          <div className="text-troll-dim text-xs py-4 text-center animate-pulse-glow">
            SCANNING...
          </div>
        )}

        {tokens && radar.length === 0 && (
          <div className="text-troll-dim text-xs py-4 text-center">
            NO_TOKENS_UNDER_2H
          </div>
        )}

        <div className="space-y-1 max-h-[250px] overflow-y-auto">
          {radar.map((token) => (
            <div
              key={token.mint}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded hover:bg-troll-dark/50 transition-colors text-xs animate-fade-up"
            >
              <Link
                href={`/token/${token.mint}`}
                className="flex-1 min-w-0"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-troll-green">
                    {token.ticker}
                  </span>
                  <span className="text-troll-dim">
                    {formatAge(token.age_seconds)}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-troll-dim">
                    ${formatMcap(token.mcap)}
                  </span>
                  <VelocityBadge score={token.velocity_score} />
                </div>
              </Link>
              <CopyMint mint={token.mint} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
