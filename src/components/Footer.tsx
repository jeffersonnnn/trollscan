"use client";

import { useState } from "react";

export default function Footer({ label }: { label?: string }) {
  const [copied, setCopied] = useState(false);
  const ca = "D8VXwanr4B9ep72gB2sCTXSgqnYLracgwMPmPfunpump";

  function copyCA() {
    navigator.clipboard.writeText(ca);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <footer className="border-t border-troll-border px-4 py-3 text-center text-[10px] text-troll-dark space-y-1">
      <div>
        POWERED BY TROLLSCAN // {label ?? "SOLANA MEMECOIN META TRACKER"} // v1.0
      </div>
      <div className="flex items-center justify-center gap-3">
        <a
          href="https://x.com/usetrollscan"
          target="_blank"
          rel="noopener noreferrer"
          className="text-troll-green hover:underline"
        >
          @usetrollscan
        </a>
        <span className="text-troll-border">|</span>
        <span className="inline-flex items-center gap-1">
          <span className="text-troll-dark">CA:</span>
          <button
            onClick={copyCA}
            className="font-mono text-troll-green hover:underline cursor-pointer"
            title="Click to copy"
          >
            {ca.slice(0, 4)}...{ca.slice(-4)}
          </button>
          {copied && <span className="text-troll-green">copied!</span>}
        </span>
      </div>
    </footer>
  );
}
