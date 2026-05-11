"use client";

import { useState } from "react";
import Link from "next/link";

const WALLETS = [
  { label: "SOL", address: "jdxkZVyg9Uqt69SWvjiQoKRHDouuaEjoRWMpEf2dKqr" },
  { label: "ETH", address: "0x30389C5D8804ac653DCA1a492B79b84124e27724" },
  { label: "BTC", address: "bc1qvuumyh8qv0z0rm9ktm0pdwhchwwz3c03gq4yrl" },
];

export function Header() {
  const [showSupport, setShowSupport] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  function copyAddress(label: string, address: string) {
    navigator.clipboard.writeText(address);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <header className="border-b border-troll-border px-4 py-3">
      <div className="flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 glow-hover">
          <span className="text-troll-green text-lg font-bold tracking-wider">
            TROLLSCAN
          </span>
          <span className="text-troll-dim text-xs hidden sm:inline">
            // MEMECOIN_META_TRACKER
          </span>
        </Link>

        <nav className="flex items-center gap-4 text-xs">
          <Link
            href="/"
            className="text-troll-dim hover:text-troll-green transition-colors"
          >
            DASHBOARD
          </Link>
          <Link
            href="/premium"
            className="text-troll-dim hover:text-troll-green transition-colors"
          >
            PREMIUM
          </Link>
          <button
            onClick={() => setShowSupport(!showSupport)}
            className="px-2 py-1 rounded border border-troll-green/40 text-troll-green hover:bg-troll-green/10 transition-colors"
          >
            SUPPORT US
          </button>
          <div className="text-troll-dark hidden sm:block">|</div>
          <span className="text-troll-dim hidden sm:inline">
            v1.0 <span className="animate-blink">_</span>
          </span>
        </nav>
      </div>

      {showSupport && (
        <div className="mt-3 panel p-3 animate-fade-up">
          <div className="text-[10px] text-troll-dim uppercase tracking-widest mb-2">
            SUPPORT_TROLLSCAN // DONATE
          </div>
          <div className="space-y-2">
            {WALLETS.map((w) => (
              <div key={w.label} className="flex items-center gap-2">
                <span className="text-troll-green text-xs font-bold w-8">
                  {w.label}
                </span>
                <code className="flex-1 text-[11px] text-troll-dim bg-black/50 px-2 py-1 rounded border border-troll-border truncate">
                  {w.address}
                </code>
                <button
                  onClick={() => copyAddress(w.label, w.address)}
                  className="text-[10px] px-2 py-1 rounded border border-troll-border text-troll-dim hover:text-troll-green hover:border-troll-green/40 transition-colors whitespace-nowrap"
                >
                  {copied === w.label ? "COPIED" : "COPY"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
