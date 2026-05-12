import type { FamilyName, FamilyRule, ClassificationResult } from "@/types";
import { getDb, getFamilyRules } from "./db";

export interface RuleEntry {
  family: string;
  ruleType: "regex" | "keyword" | "mint_list";
  pattern: string;
  weight: number;
}

const DEFAULT_RULES: RuleEntry[] = [
  { family: "troll", ruleType: "regex", pattern: "\\btroll\\b|trollface|trolling", weight: 1.0 },
  { family: "troll", ruleType: "regex", pattern: "tepe", weight: 0.6 },
  { family: "troll", ruleType: "regex", pattern: "trollina", weight: 0.8 },
  { family: "troll", ruleType: "regex", pattern: "totus", weight: 0.7 },
  { family: "troll", ruleType: "regex", pattern: "rage(guy)?", weight: 0.5 },
  { family: "hanta", ruleType: "regex", pattern: "hanta", weight: 1.0 },
  { family: "hanta", ruleType: "keyword", pattern: "hantavirus", weight: 1.0 },
  { family: "hanta", ruleType: "keyword", pattern: "outbreak", weight: 0.4 },
  { family: "hanta", ruleType: "keyword", pattern: "lockdown", weight: 0.5 },
  { family: "goblin", ruleType: "regex", pattern: "goblin", weight: 1.0 },
  { family: "goblin", ruleType: "keyword", pattern: "altman", weight: 0.6 },
  { family: "goblin", ruleType: "keyword", pattern: "openai", weight: 0.4 },
  { family: "ai", ruleType: "regex", pattern: "^ai|\\bai\\b", weight: 0.8 },
  { family: "ai", ruleType: "regex", pattern: "\\bagent\\b", weight: 0.6 },
  { family: "ai", ruleType: "keyword", pattern: "pippin", weight: 0.5 },
  { family: "ai", ruleType: "keyword", pattern: "fartcoin", weight: 0.5 },
  { family: "ai", ruleType: "keyword", pattern: "zerebro", weight: 0.5 },
  { family: "ufo", ruleType: "regex", pattern: "uap|ufo|alien|disclosure|saucer|roswell|seti", weight: 1.0 },
  { family: "ufo", ruleType: "keyword", pattern: "pursue", weight: 0.7 },
  { family: "ufo", ruleType: "regex", pattern: "\\bpentagon\\b|\\barea.?51\\b", weight: 0.6 },
  { family: "charity", ruleType: "keyword", pattern: "unicef", weight: 1.0 },
  { family: "charity", ruleType: "keyword", pattern: "red cross", weight: 1.0 },
  { family: "charity", ruleType: "keyword", pattern: "st jude", weight: 1.0 },
  { family: "charity", ruleType: "keyword", pattern: "wish", weight: 0.7 },
  { family: "charity", ruleType: "keyword", pattern: "pengu", weight: 0.6 },
  { family: "brainrot", ruleType: "regex", pattern: "tung|sahur|skibidi|wojak|chud|buttcoin", weight: 0.9 },
  { family: "hanta", ruleType: "keyword", pattern: "virus", weight: 0.4 },
  { family: "hanta", ruleType: "keyword", pattern: "pandemic", weight: 0.5 },
  { family: "hanta", ruleType: "keyword", pattern: "plague", weight: 0.5 },
  { family: "hanta", ruleType: "keyword", pattern: "quarantine", weight: 0.4 },
  { family: "politifi", ruleType: "regex", pattern: "\\btrump\\b|\\bmelania\\b|politifi|\\bmaga\\b", weight: 1.0 },
  { family: "politifi", ruleType: "regex", pattern: "\\bwar\\b|\\belection\\b|\\bpotus\\b|\\bpresident\\b", weight: 0.6 },
  { family: "politifi", ruleType: "keyword", pattern: "burnie senders", weight: 0.8 },
  { family: "politifi", ruleType: "keyword", pattern: "jeo boden", weight: 0.8 },
  { family: "politifi", ruleType: "keyword", pattern: "doland tremp", weight: 0.8 },
  { family: "aura", ruleType: "regex", pattern: "\\baura\\b", weight: 1.0 },
  { family: "aura", ruleType: "keyword", pattern: "culture coin", weight: 0.8 },
  { family: "aura", ruleType: "keyword", pattern: "aura maxxing", weight: 0.9 },
  { family: "animal", ruleType: "regex", pattern: "\\bbonk\\b|\\bwif\\b|dogwifhat|popcat|\\bmew\\b", weight: 0.8 },
  { family: "animal", ruleType: "regex", pattern: "\\bpenguin\\b|\\bpengu\\b|pudgy", weight: 0.7 },
  { family: "animal", ruleType: "regex", pattern: "\\bdolan\\b|\\bduck\\b|\\bhippo\\b|moodeng|moo\\s*deng", weight: 0.7 },
  { family: "satire", ruleType: "regex", pattern: "spx6900|\\buseless\\b|\\bparody\\b", weight: 0.8 },
  { family: "satire", ruleType: "keyword", pattern: "satire", weight: 0.6 },
];

let cachedRules: RuleEntry[] | null = null;
let rulesCachedAt = 0;
const RULES_CACHE_TTL = 60_000;

export function getActiveRules(): RuleEntry[] {
  if (cachedRules && Date.now() - rulesCachedAt < RULES_CACHE_TTL) return cachedRules;

  const dbRules = getFamilyRules();
  const entries: RuleEntry[] = dbRules.map((r) => ({
    family: r.family,
    ruleType: r.rule_type as "regex" | "keyword" | "mint_list",
    pattern: r.pattern,
    weight: r.weight,
  }));

  const seen = new Set(entries.map((r) => `${r.family}:${r.pattern}`));
  for (const rule of DEFAULT_RULES) {
    if (!seen.has(`${rule.family}:${rule.pattern}`)) {
      entries.push(rule);
    }
  }

  cachedRules = entries;
  rulesCachedAt = Date.now();
  return entries;
}

export function invalidateRulesCache(): void {
  cachedRules = null;
  rulesCachedAt = 0;
}

function testRule(rule: RuleEntry, text: string): boolean {
  if (rule.ruleType === "keyword") {
    return text.includes(rule.pattern.toLowerCase());
  }
  if (rule.ruleType === "regex") {
    try {
      return new RegExp(rule.pattern, "i").test(text);
    } catch {
      return false;
    }
  }
  return false;
}

export function classifyToken(token: {
  ticker: string;
  name: string;
  description?: string;
}): ClassificationResult {
  return classifyWithRules(token, getActiveRules());
}

export function classifyWithRules(
  token: { ticker: string; name: string; description?: string },
  rules: RuleEntry[]
): ClassificationResult {
  const text = [token.ticker, token.name, token.description ?? ""]
    .join(" ")
    .toLowerCase();

  const familyScores = new Map<string, number>();

  for (const rule of rules) {
    if (testRule(rule, text)) {
      const current = familyScores.get(rule.family) ?? 0;
      familyScores.set(rule.family, current + rule.weight);
    }
  }

  if (familyScores.size === 0) {
    return { family: "other", confidence: 1.0 };
  }

  let maxFamily: FamilyName = "other";
  let maxScore = 0;
  let totalScore = 0;

  for (const [family, score] of familyScores) {
    totalScore += score;
    if (score > maxScore) {
      maxScore = score;
      maxFamily = family;
    }
  }

  if (maxScore < 0.5) {
    return { family: "other", confidence: 1.0 };
  }

  return {
    family: maxFamily,
    confidence: totalScore > 0 ? maxScore / totalScore : 1.0,
  };
}
