"use client";

import { Header } from "@/components/Header";
import { PremiumGate } from "@/components/PremiumGate";

export default function PremiumPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="max-w-lg text-center mb-8">
          <h1 className="text-2xl font-bold text-troll-green mb-3">
            PREMIUM ACCESS
          </h1>
          <p className="text-troll-dim text-sm leading-relaxed">
            Hold $TROLLSCAN tokens to unlock premium features including
            Telegram alerts, custom family creation, and priority API access.
          </p>

          <div className="mt-6 space-y-2 text-left">
            <div className="panel p-3 text-xs">
              <span className="text-troll-green">01.</span>
              <span className="text-troll-dim ml-2">
                TELEGRAM_ALERTS // Get notified on new tokens in your tracked families
              </span>
            </div>
            <div className="panel p-3 text-xs">
              <span className="text-troll-green">02.</span>
              <span className="text-troll-dim ml-2">
                CUSTOM_FAMILIES // Create your own meta-groups with custom rules
              </span>
            </div>
            <div className="panel p-3 text-xs">
              <span className="text-troll-green">03.</span>
              <span className="text-troll-dim ml-2">
                WHALE_ALERTS // Instant notification on 5+ SOL buys
              </span>
            </div>
            <div className="panel p-3 text-xs">
              <span className="text-troll-green">04.</span>
              <span className="text-troll-dim ml-2">
                API_ACCESS // Programmatic access to TROLLSCAN data
              </span>
            </div>
          </div>
        </div>

        <PremiumGate />
      </div>

      <footer className="border-t border-troll-border px-4 py-3 text-center text-[10px] text-troll-dark">
        POWERED BY TROLLSCAN // PREMIUM FEATURES
      </footer>
    </div>
  );
}
