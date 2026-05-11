"use client";

import { useState } from "react";

export function PremiumGate({
  onVerified,
}: {
  onVerified?: (wallet: string) => void;
}) {
  const [wallet, setWallet] = useState("");
  const [status, setStatus] = useState<"idle" | "checking" | "premium" | "denied">("idle");
  const [balance, setBalance] = useState<number | null>(null);

  async function checkAccess() {
    if (!wallet.trim()) return;
    setStatus("checking");

    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet: wallet.trim(),
          trigger_type: "family_new",
          trigger_value: "test",
        }),
      });

      if (res.status === 201) {
        setStatus("premium");
        onVerified?.(wallet.trim());
      } else {
        setStatus("denied");
      }
    } catch {
      setStatus("denied");
    }
  }

  return (
    <div className="panel p-4 max-w-md">
      <div className="section-header">PREMIUM_ACCESS // TOKEN_GATE</div>

      <div className="space-y-3">
        <input
          type="text"
          placeholder="Paste Solana wallet address..."
          value={wallet}
          onChange={(e) => setWallet(e.target.value)}
          className="w-full bg-black border border-troll-border rounded px-3 py-2 text-sm text-troll-green placeholder:text-troll-dark focus:border-troll-dim focus:outline-none"
        />

        <button
          onClick={checkAccess}
          disabled={status === "checking" || !wallet.trim()}
          className="w-full bg-troll-dark hover:bg-troll-dim/20 text-troll-green border border-troll-border rounded px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50"
        >
          {status === "checking" ? "VERIFYING..." : "CHECK ACCESS"}
        </button>

        {status === "premium" && (
          <div className="text-troll-green text-sm">
            ACCESS_GRANTED // PREMIUM_ACTIVE
          </div>
        )}

        {status === "denied" && (
          <div className="text-troll-bad text-sm">
            ACCESS_DENIED // HOLD $TROLLSCAN TO UNLOCK
          </div>
        )}
      </div>
    </div>
  );
}
