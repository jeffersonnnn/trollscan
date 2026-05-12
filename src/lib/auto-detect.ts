import { getOtherTokensSince, upsertFamily, reclassifyTokens, getAllFamilyMeta, getDb } from "./db";
import { invalidateRulesCache } from "./families";
import { emitter } from "./events";

const MIN_TOKENS = parseInt(process.env.AUTO_DETECT_MIN_TOKENS ?? "3", 10);
const LOOKBACK_MS = 6 * 60 * 60 * 1000;

const STOPWORDS = new Set([
  "sol", "solana", "token", "coin", "meme", "pump", "inu", "doge", "the",
  "of", "and", "for", "new", "baby", "mini", "super", "mega", "king",
  "queen", "lord", "god", "moon", "sun", "star", "pro", "max", "dao",
  "finance", "swap", "protocol", "network", "chain", "defi", "nft",
  "cat", "dog", "pepe", "wojak", "based", "sigma", "alpha", "beta",
]);

export function generateColor(name: string): string {
  let hash = 0;
  for (const ch of name) hash = ((hash << 5) - hash + ch.charCodeAt(0)) | 0;
  const hue = ((hash % 360) + 360) % 360;
  return `hsl(${hue}, 70%, 60%)`;
}

function extractKeywords(ticker: string, name: string): string[] {
  const text = `${ticker} ${name}`.toLowerCase();
  const words = text.split(/[^a-z]+/).filter(Boolean);
  return words.filter((w) => w.length >= 3 && !STOPWORDS.has(w));
}

export function runAutoDetection(): void {
  try {
    const since = Date.now() - LOOKBACK_MS;
    const otherTokens = getOtherTokensSince(since);

    if (otherTokens.length < MIN_TOKENS) return;

    const existingFamilies = new Set(getAllFamilyMeta().map((f) => f.name));
    const existingRules = getDb()
      .prepare("SELECT pattern FROM family_rules WHERE active = 1")
      .all() as { pattern: string }[];
    const existingPatterns = new Set(existingRules.map((r) => r.pattern.toLowerCase()));

    const keywordToMints = new Map<string, Set<string>>();

    for (const token of otherTokens) {
      const keywords = extractKeywords(token.ticker, token.name);
      for (const kw of keywords) {
        if (existingFamilies.has(kw) || existingPatterns.has(kw)) continue;
        if (!keywordToMints.has(kw)) keywordToMints.set(kw, new Set());
        keywordToMints.get(kw)!.add(token.mint);
      }
    }

    for (const [keyword, mints] of keywordToMints) {
      if (mints.size < MIN_TOKENS) continue;

      const color = generateColor(keyword);
      upsertFamily({
        name: keyword,
        label: keyword.toUpperCase(),
        color,
        search_terms: keyword,
        source: "auto_detected",
      });

      getDb()
        .prepare(
          "INSERT OR IGNORE INTO family_rules (family, rule_type, pattern, weight, active) VALUES (?, 'keyword', ?, 1.0, 1)"
        )
        .run(keyword, keyword);

      reclassifyTokens([...mints], keyword);
      invalidateRulesCache();

      emitter.emit("tokens.updated", { source: "auto_detect", family: keyword });

      console.log(
        `[auto-detect] New family "${keyword}" with ${mints.size} tokens (color: ${color})`
      );
    }
  } catch (err) {
    console.error("[auto-detect] Failed:", err);
  }
}
