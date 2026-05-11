"use client";

import { use, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { Header } from "@/components/Header";
import { VelocityBadge } from "@/components/VelocityBadge";
import { WhaleFlag } from "@/components/WhaleFlag";
import type { Token } from "@/types";
import { FAMILY_COLORS } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

function formatAge(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel p-3">
      <div className="text-[10px] text-troll-dim uppercase tracking-widest mb-1">
        {label}
      </div>
      <div className="text-sm font-bold">{value}</div>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className="text-[10px] px-2 py-1 rounded border border-troll-border text-troll-dim hover:text-troll-green hover:border-troll-green/40 transition-colors whitespace-nowrap"
    >
      {copied ? "COPIED" : "COPY CA"}
    </button>
  );
}

export default function TokenPage({
  params,
}: {
  params: Promise<{ mint: string }>;
}) {
  const { mint } = use(params);

  const { data: token, error } = useSWR<Token>(
    `/api/token/${mint}`,
    fetcher,
    { refreshInterval: 30_000 }
  );

  if (error || (!token && error)) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center text-troll-bad">
          TOKEN_NOT_FOUND // ERROR
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center text-troll-dim animate-pulse-glow">
          LOADING_TOKEN_DATA...
        </div>
      </div>
    );
  }

  const familyColor = FAMILY_COLORS[token.family] ?? "#6B7280";
  const pctClass = (n: number) => (n >= 0 ? "price-up" : "price-down");
  const fmtPct = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <div className="px-4 py-4 border-b border-troll-border">
        <Link
          href="/"
          className="text-troll-dim text-xs hover:text-troll-green transition-colors"
        >
          &lt; BACK
        </Link>

        <div className="flex items-center gap-4 mt-3">
          {token.image_url && (
            <img
              src={token.image_url}
              alt=""
              className="w-12 h-12 rounded-full"
            />
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold">{token.ticker}</h1>
              <span
                className="text-[10px] px-1.5 py-0.5 rounded border"
                style={{ color: familyColor, borderColor: familyColor }}
              >
                {token.family.toUpperCase()}
              </span>
              <WhaleFlag active={token.has_whale_flag === 1} />
              <CopyButton text={token.mint} />
            </div>
            <div className="text-troll-dim text-sm">{token.name}</div>
            <div className="text-troll-dark text-[10px] mt-0.5 font-mono truncate">
              {token.mint}
            </div>
          </div>
        </div>

        <div className="flex items-baseline gap-4 mt-3">
          <span className="text-2xl font-bold">
            {formatNumber(token.mcap)}
          </span>
          <span className={pctClass(token.price_change_24h)}>
            {fmtPct(token.price_change_24h)} 24h
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4">
        <StatBox label="MCAP" value={formatNumber(token.mcap)} />
        <StatBox label="LIQUIDITY" value={formatNumber(token.liquidity)} />
        <StatBox label="VOL 24H" value={formatNumber(token.volume_24h)} />
        <StatBox label="AGE" value={formatAge(token.age_seconds)} />
        <StatBox
          label="1H CHANGE"
          value={fmtPct(token.price_change_1h)}
        />
        <StatBox
          label="6H CHANGE"
          value={fmtPct(token.price_change_6h)}
        />
        <StatBox label="TXNS 24H" value={token.txns_24h.toLocaleString()} />
        <StatBox
          label="VELOCITY"
          value={String(Math.round(token.velocity_score))}
        />
      </div>

      <div className="px-4 pb-4">
        <div className="section-header">SECTION_003 // TRADE & LINKS</div>
        <div className="flex flex-wrap gap-2 mt-2">
          <ExternalLink
            href={`https://axiom.trade/meme/${token.pair_address ?? token.mint}?chain=sol`}
            label="AXIOM"
            highlight
          />
          <ExternalLink
            href={`https://dexscreener.com/solana/${token.pair_address ?? token.mint}`}
            label="DEXSCREENER"
          />
          <ExternalLink
            href={`https://solscan.io/token/${token.mint}`}
            label="SOLSCAN"
          />
          {token.twitter && (
            <ExternalLink href={token.twitter} label="TWITTER" />
          )}
          {token.telegram && (
            <ExternalLink href={token.telegram} label="TELEGRAM" />
          )}
          {token.website && (
            <ExternalLink href={token.website} label="WEBSITE" />
          )}
          <Link
            href={`/family/${token.family}`}
            className="text-xs px-3 py-1.5 rounded border border-troll-border text-troll-dim hover:text-troll-green hover:border-troll-dim transition-colors"
          >
            VIEW {token.family.toUpperCase()} FAMILY
          </Link>
        </div>
      </div>

      <footer className="mt-auto border-t border-troll-border px-4 py-3 text-center text-[10px] text-troll-dark">
        POWERED BY TROLLSCAN // TOKEN DETAIL
      </footer>
    </div>
  );
}

function ExternalLink({
  href,
  label,
  highlight,
}: {
  href: string;
  label: string;
  highlight?: boolean;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={
        highlight
          ? "text-xs px-3 py-1.5 rounded border border-troll-green/60 text-troll-green hover:bg-troll-green/10 transition-colors font-bold"
          : "text-xs px-3 py-1.5 rounded border border-troll-border text-troll-dim hover:text-troll-green hover:border-troll-dim transition-colors"
      }
    >
      {label} &rarr;
    </a>
  );
}
