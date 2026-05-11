import { fetchBoosted, fetchTokens, searchTokens } from "./dexscreener";
import { fetchNewProfiles } from "./pumpfun";
import { classifyToken } from "./families";
import { computeVelocity, hasWhaleFlag } from "./velocity";
import { upsertTokens, getTokenByMint } from "./db";
import { emitter } from "./events";
import type { Token, DexScreenerPair } from "@/types";

const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL_MS ?? "30000", 10);
const SEARCH_INTERVAL = 5 * 60 * 1000;
const PUMP_INTERVAL = 60_000;
const FAMILIES_TO_SEARCH = ["troll", "hanta", "goblin", "ai", "ufo", "brainrot"];
const MIN_LIQUIDITY = 5_000;
const MAX_MCAP_LIQ_RATIO = 500;

function isValidPair(pair: DexScreenerPair): boolean {
  const mcap = pair.marketCap ?? 0;
  const liq = pair.liquidity?.usd ?? 0;
  const vol24 = pair.volume?.h24 ?? 0;

  if (mcap < 20_000) return false;
  if (liq < MIN_LIQUIDITY) return false;
  if (liq > 0 && mcap / liq > MAX_MCAP_LIQ_RATIO) return false;
  if (vol24 <= 0) return false;

  return true;
}

function pairToToken(pair: DexScreenerPair): Token {
  const classification = classifyToken({
    ticker: pair.baseToken.symbol,
    name: pair.baseToken.name,
  });

  const velocity = computeVelocity(pair);
  const whale = hasWhaleFlag(pair);
  const ageSeconds = Math.floor((Date.now() - pair.pairCreatedAt) / 1000);

  const website = pair.info?.websites?.[0]?.url ?? null;
  const twitter =
    pair.info?.socials?.find((s) => s.type === "twitter")?.url ?? null;
  const telegram =
    pair.info?.socials?.find((s) => s.type === "telegram")?.url ?? null;

  return {
    mint: pair.baseToken.address,
    ticker: pair.baseToken.symbol,
    name: pair.baseToken.name,
    pair_address: pair.pairAddress,
    chain: "solana",
    dex: pair.dexId,
    family: classification.family,
    age_seconds: ageSeconds,
    mcap: pair.marketCap ?? 0,
    liquidity: pair.liquidity?.usd ?? 0,
    volume_24h: pair.volume?.h24 ?? 0,
    txns_24h: (pair.txns?.h24?.buys ?? 0) + (pair.txns?.h24?.sells ?? 0),
    price_change_1h: pair.priceChange?.h1 ?? 0,
    price_change_6h: pair.priceChange?.h6 ?? 0,
    price_change_24h: pair.priceChange?.h24 ?? 0,
    velocity_score: velocity,
    has_whale_flag: whale ? 1 : 0,
    image_url: pair.info?.imageUrl ?? null,
    website,
    twitter,
    telegram,
    first_seen_at: Date.now(),
    last_updated_at: Date.now(),
  };
}


async function pollBoosted(): Promise<void> {
  try {
    const boosted = await fetchBoosted();
    const solanaAddresses = boosted
      .filter((t) => t.chainId === "solana")
      .map((t) => t.tokenAddress);

    if (solanaAddresses.length === 0) return;

    const pairs = await fetchTokens(solanaAddresses);
    const solanaPairs = pairs.filter(
      (p) => p.chainId === "solana" && isValidPair(p)
    );

    if (solanaPairs.length === 0) return;

    const tokens = solanaPairs.map(pairToToken);
    upsertTokens(tokens);

    emitter.emit("tokens.updated", {
      count: tokens.length,
      mints: tokens.map((t) => t.mint),
    });

    console.log(`[poller] Updated ${tokens.length} tokens from boosted`);
  } catch (err) {
    console.error("[poller] Boosted poll failed:", err);
  }
}

async function pollFamilySearch(): Promise<void> {
  for (const family of FAMILIES_TO_SEARCH) {
    try {
      const pairs = await searchTokens(family);
      const solanaPairs = pairs.filter(
        (p) => p.chainId === "solana" && isValidPair(p)
      );

      if (solanaPairs.length === 0) continue;

      const tokens = solanaPairs.map(pairToToken);
      upsertTokens(tokens);

      console.log(`[poller] Search "${family}" found ${tokens.length} tokens`);
    } catch (err) {
      console.error(`[poller] Search "${family}" failed:`, err);
    }
  }

  emitter.emit("tokens.updated", { source: "search" });
}

async function pollNewProfiles(): Promise<void> {
  try {
    const profiles = await fetchNewProfiles();
    if (profiles.length === 0) return;

    const mints = profiles.map((p) => p.tokenAddress);
    const alreadyKnown = mints.filter((m) => getTokenByMint(m) !== null);
    const newMints = mints.filter((m) => !alreadyKnown.includes(m));

    if (newMints.length === 0) return;

    const pairs = await fetchTokens(newMints);
    const valid = pairs.filter(
      (p) => p.chainId === "solana" && isValidPair(p)
    );

    if (valid.length === 0) return;

    const tokens = valid.map(pairToToken);
    upsertTokens(tokens);

    emitter.emit("tokens.updated", {
      source: "new_profiles",
      count: tokens.length,
      mints: tokens.map((t) => t.mint),
    });

    console.log(`[poller] New profiles: ${tokens.length} fresh tokens`);
  } catch (err) {
    console.error("[poller] New profiles poll failed:", err);
  }
}

let primaryTimer: ReturnType<typeof setInterval> | null = null;
let searchTimer: ReturnType<typeof setInterval> | null = null;
let pumpTimer: ReturnType<typeof setInterval> | null = null;

export async function pollAll(): Promise<{ boosted: number; searched: number }> {
  let boosted = 0;
  let searched = 0;

  try {
    await pollBoosted();
    boosted = 1;
  } catch {}

  try {
    await pollFamilySearch();
    searched = 1;
  } catch {}

  try {
    await pollNewProfiles();
  } catch {}

  return { boosted, searched };
}

export function startPoller(): void {
  console.log(`[poller] Starting: boosted=${POLL_INTERVAL}ms, search=${SEARCH_INTERVAL}ms, pump=${PUMP_INTERVAL}ms`);

  pollBoosted();
  primaryTimer = setInterval(pollBoosted, POLL_INTERVAL);

  setTimeout(() => {
    pollFamilySearch();
    searchTimer = setInterval(pollFamilySearch, SEARCH_INTERVAL);
  }, 10_000);

  setTimeout(() => {
    pollNewProfiles();
    pumpTimer = setInterval(pollNewProfiles, PUMP_INTERVAL);
  }, 5_000);

  const cleanup = () => {
    if (primaryTimer) clearInterval(primaryTimer);
    if (searchTimer) clearInterval(searchTimer);
    if (pumpTimer) clearInterval(pumpTimer);
    console.log("[poller] Stopped");
  };

  process.on("SIGTERM", cleanup);
  process.on("SIGINT", cleanup);
}
