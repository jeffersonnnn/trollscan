import { getDb, upsertFamily, getOtherTokensSince, reclassifyTokens, getAllFamilyMeta } from "./db";
import { invalidateRulesCache } from "./families";
import { generateColor } from "./auto-detect";
import { emitter } from "./events";

const CT_BUZZ_THRESHOLD = parseInt(process.env.CT_BUZZ_THRESHOLD ?? "5", 10);
const CT_ACCOUNTS = (process.env.CT_ACCOUNTS ?? "").split(",").filter(Boolean);

interface TweetSignal {
  keyword: string;
  tweetId?: string;
  author: string;
  text: string;
  engagement: number;
}

let scraper: any = null;

async function getScraper() {
  if (scraper) return scraper;

  try {
    const { Scraper } = await import("agent-twitter-client");
    scraper = new Scraper();
    await scraper.login(
      process.env.TWITTER_USERNAME!,
      process.env.TWITTER_PASSWORD!,
      process.env.TWITTER_EMAIL
    );
    console.log("[twitter] Logged in successfully");
    return scraper;
  } catch (err) {
    console.error("[twitter] Login failed:", err);
    return null;
  }
}

const CRYPTO_STOPWORDS = new Set([
  "the", "and", "for", "are", "but", "not", "you", "all", "can", "had",
  "her", "was", "one", "our", "out", "has", "his", "how", "its", "let",
  "may", "new", "now", "old", "see", "way", "who", "did", "get", "got",
  "him", "hit", "too", "use", "sol", "solana", "just", "like", "this",
  "that", "what", "with", "from", "been", "have", "will", "your", "than",
  "them", "then", "they", "when", "more", "some", "time", "very", "into",
  "coin", "token", "pump", "buy", "sell", "crypto", "market", "price",
]);

function extractKeywordsFromText(text: string): string[] {
  const words = text.toLowerCase()
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[^a-z\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !CRYPTO_STOPWORDS.has(w));
  return [...new Set(words)];
}

async function scrapeCtTimeline(): Promise<TweetSignal[]> {
  const s = await getScraper();
  if (!s) return [];

  const signals: TweetSignal[] = [];

  try {
    const searchTerms = ["memecoin solana", "solana meta", "sol pump"];
    for (const query of searchTerms) {
      const tweets = s.searchTweets(query, 20);
      for await (const tweet of tweets) {
        if (!tweet.text) continue;
        const keywords = extractKeywordsFromText(tweet.text);
        for (const kw of keywords) {
          signals.push({
            keyword: kw,
            tweetId: tweet.id,
            author: tweet.username ?? "unknown",
            text: tweet.text.slice(0, 200),
            engagement: (tweet.likes ?? 0) + (tweet.retweets ?? 0) * 3,
          });
        }
      }
    }

    for (const account of CT_ACCOUNTS) {
      try {
        const tweets = s.getTweets(account, 10);
        for await (const tweet of tweets) {
          if (!tweet.text) continue;
          const keywords = extractKeywordsFromText(tweet.text);
          for (const kw of keywords) {
            signals.push({
              keyword: kw,
              author: account,
              text: tweet.text.slice(0, 200),
              engagement: (tweet.likes ?? 0) + (tweet.retweets ?? 0) * 3,
            });
          }
        }
      } catch (err) {
        console.error(`[twitter] Failed to fetch @${account}:`, err);
      }
    }
  } catch (err) {
    console.error("[twitter] Scrape failed:", err);
  }

  return signals;
}

function aggregateSignals(signals: TweetSignal[]): Map<string, { count: number; engagement: number }> {
  const agg = new Map<string, { count: number; engagement: number }>();
  for (const s of signals) {
    const existing = agg.get(s.keyword) ?? { count: 0, engagement: 0 };
    existing.count++;
    existing.engagement += s.engagement;
    agg.set(s.keyword, existing);
  }
  return agg;
}

export async function runCtMonitor(): Promise<void> {
  if (!process.env.TWITTER_USERNAME) return;

  try {
    console.log("[ct-monitor] Starting CT scan...");
    const signals = await scrapeCtTimeline();

    if (signals.length === 0) {
      console.log("[ct-monitor] No signals found");
      return;
    }

    const trending = aggregateSignals(signals);
    const existingFamilies = new Set(getAllFamilyMeta().map((f) => f.name));

    for (const [keyword, stats] of trending) {
      if (stats.count < CT_BUZZ_THRESHOLD) continue;
      if (existingFamilies.has(keyword)) continue;

      const recentOthers = getOtherTokensSince(Date.now() - 24 * 60 * 60 * 1000);
      const matching = recentOthers.filter((t) => {
        const text = `${t.ticker} ${t.name}`.toLowerCase();
        return text.includes(keyword);
      });

      if (matching.length >= 2) {
        const color = generateColor(keyword);
        upsertFamily({
          name: keyword,
          label: keyword.toUpperCase(),
          color,
          search_terms: keyword,
          source: "ct_monitor",
        });

        getDb()
          .prepare(
            "INSERT OR IGNORE INTO family_rules (family, rule_type, pattern, weight, active) VALUES (?, 'keyword', ?, 1.0, 1)"
          )
          .run(keyword, keyword);

        reclassifyTokens(matching.map((t) => t.mint), keyword);
        invalidateRulesCache();

        emitter.emit("tokens.updated", { source: "ct_monitor", family: keyword });

        console.log(
          `[ct-monitor] New family "${keyword}" from CT buzz (${stats.count} mentions, ${matching.length} tokens)`
        );
      }
    }

    console.log(`[ct-monitor] Processed ${signals.length} signals, ${trending.size} unique keywords`);
  } catch (err) {
    console.error("[ct-monitor] Failed:", err);
  }
}
