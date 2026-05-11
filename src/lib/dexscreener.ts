import type { DexScreenerPair, DexScreenerBoostToken } from "@/types";

const BASE_URL = "https://api.dexscreener.com";
const USER_AGENT = "TROLLSCAN/1.0";
const TIMEOUT_MS = 10_000;
const MAX_RETRIES = 3;
const RETRY_DELAYS = [500, 1500, 4500];

async function fetchWithRetry(url: string): Promise<any> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { "User-Agent": USER_AGENT },
      });

      clearTimeout(timer);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${url}`);
      }

      return await res.json();
    } catch (err) {
      clearTimeout(timer);

      if (attempt < MAX_RETRIES - 1) {
        await new Promise((r) => setTimeout(r, RETRY_DELAYS[attempt]));
        continue;
      }
      throw err;
    }
  }
}

export async function fetchTokens(mints: string[]): Promise<DexScreenerPair[]> {
  const allPairs: DexScreenerPair[] = [];

  for (let i = 0; i < mints.length; i += 30) {
    const chunk = mints.slice(i, i + 30);
    const joined = chunk.join(",");
    const data = await fetchWithRetry(
      `${BASE_URL}/tokens/v1/solana/${joined}`
    );

    if (Array.isArray(data)) {
      allPairs.push(...data);
    }
  }

  return pickBestPairs(allPairs);
}

function pickBestPairs(pairs: DexScreenerPair[]): DexScreenerPair[] {
  const byMint = new Map<string, DexScreenerPair>();

  for (const pair of pairs) {
    const mint = pair.baseToken?.address;
    if (!mint) continue;

    const existing = byMint.get(mint);
    if (!existing) {
      byMint.set(mint, pair);
      continue;
    }

    const newLiq = pair.liquidity?.usd ?? 0;
    const oldLiq = existing.liquidity?.usd ?? 0;
    const newVol = pair.volume?.h24 ?? 0;
    const oldVol = existing.volume?.h24 ?? 0;

    if (newLiq > oldLiq || (newLiq === oldLiq && newVol > oldVol)) {
      byMint.set(mint, pair);
    }
  }

  return Array.from(byMint.values());
}

export async function searchTokens(query: string): Promise<DexScreenerPair[]> {
  const data = await fetchWithRetry(
    `${BASE_URL}/latest/dex/search?q=${encodeURIComponent(query)}`
  );
  return (data?.pairs ?? []) as DexScreenerPair[];
}

export async function fetchPair(
  pairAddress: string
): Promise<DexScreenerPair | null> {
  const data = await fetchWithRetry(
    `${BASE_URL}/latest/dex/pairs/solana/${pairAddress}`
  );
  return (data?.pair ?? data?.pairs?.[0] ?? null) as DexScreenerPair | null;
}

export async function fetchBoosted(): Promise<DexScreenerBoostToken[]> {
  const data = await fetchWithRetry(
    `${BASE_URL}/token-boosts/top/v1`
  );
  return Array.isArray(data) ? data : [];
}
