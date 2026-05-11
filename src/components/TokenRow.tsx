"use client";

import { useState } from "react";
import Link from "next/link";
import type { Token } from "@/types";
import { FAMILY_COLORS } from "@/types";
import { VelocityBadge } from "./VelocityBadge";
import { WhaleFlag } from "./WhaleFlag";

function formatAge(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

function formatMcap(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toFixed(0);
}

function formatPct(n: number): string {
  const sign = n >= 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}%`;
}

function CopyCA({ mint }: { mint: string }) {
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
      className="text-[9px] px-1.5 py-0.5 rounded border border-troll-border text-troll-dim hover:text-troll-green hover:border-troll-green/40 transition-colors"
      title={mint}
    >
      {copied ? "COPIED" : "CA"}
    </button>
  );
}

export function TokenRow({ token, rank }: { token: Token; rank: number }) {
  const familyColor = FAMILY_COLORS[token.family] ?? "#6B7280";

  return (
    <div className="grid grid-cols-[2rem_1fr_4rem_3rem_4rem_4rem_4rem_4rem_4rem_3rem_2rem_2rem] md:grid-cols-[2rem_1fr_4rem_3rem_5rem_5rem_4rem_4rem_4rem_3rem_2rem_2.5rem] gap-2 items-center px-4 py-2 text-xs hover:bg-troll-dark/30 transition-colors border-b border-troll-border/30 glow-hover">
      <span className="text-troll-dim tabular-nums">{rank}</span>

      <Link
        href={`/token/${token.mint}`}
        className="flex items-center gap-2 min-w-0"
      >
        {token.image_url && (
          <img
            src={token.image_url}
            alt=""
            className="w-5 h-5 rounded-full flex-shrink-0"
          />
        )}
        <span className="truncate">
          <span className="font-bold text-troll-green">{token.ticker}</span>
          <span className="text-troll-dim ml-1 hidden md:inline">
            {token.name}
          </span>
        </span>
      </Link>

      <span
        className="text-[10px] font-medium px-1 py-0.5 rounded text-center"
        style={{ color: familyColor, borderColor: familyColor, border: "1px solid" }}
      >
        {token.family.toUpperCase()}
      </span>

      <span className="text-troll-dim tabular-nums">{formatAge(token.age_seconds)}</span>

      <span className="tabular-nums">${formatMcap(token.mcap)}</span>

      <span className="tabular-nums hidden md:block text-troll-dim">
        ${formatMcap(token.volume_24h)}
      </span>

      <span className={token.price_change_1h >= 0 ? "price-up" : "price-down"}>
        {formatPct(token.price_change_1h)}
      </span>

      <span
        className={`hidden md:block ${token.price_change_6h >= 0 ? "price-up" : "price-down"}`}
      >
        {formatPct(token.price_change_6h)}
      </span>

      <span
        className={`hidden md:block ${token.price_change_24h >= 0 ? "price-up" : "price-down"}`}
      >
        {formatPct(token.price_change_24h)}
      </span>

      <VelocityBadge score={token.velocity_score} />

      <WhaleFlag active={token.has_whale_flag === 1} />

      <CopyCA mint={token.mint} />
    </div>
  );
}
