"use client";

import { useState, useCallback } from "react";
import { useSWRConfig } from "swr";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { MetaWaves } from "@/components/MetaWaves";
import { FamilyTabs } from "@/components/FamilyTabs";
import { TokenTable } from "@/components/TokenTable";
import { RadarFeed } from "@/components/RadarFeed";
import type { FamilyName } from "@/types";

export default function Home() {
  const [activeFamily, setActiveFamily] = useState<FamilyName | "all">("all");
  const [refreshing, setRefreshing] = useState(false);
  const { mutate } = useSWRConfig();

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetch("/api/refresh", { method: "POST" });
      mutate(() => true);
    } catch {}
    setRefreshing(false);
  }, [mutate]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <Hero />

      <div className="px-4 py-2 flex items-center justify-between">
        <div />
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="text-xs px-3 py-1.5 rounded border border-troll-green/40 text-troll-green hover:bg-troll-green/10 transition-colors disabled:opacity-50"
        >
          {refreshing ? "SCANNING..." : "REFRESH ENGINE"}
        </button>
      </div>

      <MetaWaves onSelect={(f) => setActiveFamily(f)} />
      <FamilyTabs active={activeFamily} onSelect={setActiveFamily} />

      <div className="flex-1 flex flex-col lg:flex-row">
        <div className="flex-1 min-w-0">
          <div className="section-header px-4 pt-4">
            {activeFamily === "all"
              ? "SECTION_001 // ALL_TOKENS"
              : `SECTION_001 // ${activeFamily.toUpperCase()}_FAMILY`}
          </div>
          <TokenTable
            family={activeFamily === "all" ? undefined : activeFamily}
          />
        </div>

        <div className="w-full lg:w-72 xl:w-80 flex-shrink-0 p-3">
          <RadarFeed />
        </div>
      </div>

      <footer className="border-t border-troll-border px-4 py-3 text-center text-[10px] text-troll-dark">
        POWERED BY TROLLSCAN // SOLANA MEMECOIN META TRACKER // v1.0
      </footer>
    </div>
  );
}
