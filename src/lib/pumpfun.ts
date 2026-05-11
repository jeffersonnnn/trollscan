import { MemoryCache } from "./cache";

const cache = new MemoryCache<any[]>(45_000);

export interface NewTokenProfile {
  url: string;
  chainId: string;
  tokenAddress: string;
  icon?: string;
  header?: string;
  description?: string;
  links?: { label: string; type: string; url: string }[];
}

export async function fetchNewProfiles(): Promise<NewTokenProfile[]> {
  const cached = cache.get("profiles");
  if (cached) return cached;

  try {
    const res = await fetch(
      "https://api.dexscreener.com/token-profiles/latest/v1",
      {
        headers: { "User-Agent": "TROLLSCAN/1.0" },
        signal: AbortSignal.timeout(10_000),
      }
    );

    if (!res.ok) return [];
    const text = await res.text();
    const data = JSON.parse(text.split("\n")[0]);
    const results = Array.isArray(data)
      ? data.filter((t: any) => t.chainId === "solana")
      : [];
    cache.set("profiles", results);
    return results;
  } catch (err) {
    console.error("[profiles] Fetch failed:", err);
    return [];
  }
}
