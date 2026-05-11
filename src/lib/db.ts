import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import type { Token, FamilyRule, Alert, FamilyName, SortField, FamilyStats } from "@/types";

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;

  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  db = new Database(path.join(dataDir, "trollscan.db"));
  db.pragma("journal_mode = WAL");
  db.pragma("busy_timeout = 5000");

  db.exec(`
    CREATE TABLE IF NOT EXISTS tokens (
      mint TEXT PRIMARY KEY,
      ticker TEXT NOT NULL,
      name TEXT NOT NULL,
      pair_address TEXT,
      chain TEXT DEFAULT 'solana',
      dex TEXT,
      family TEXT DEFAULT 'other',
      age_seconds INTEGER DEFAULT 0,
      mcap REAL DEFAULT 0,
      liquidity REAL DEFAULT 0,
      volume_24h REAL DEFAULT 0,
      txns_24h INTEGER DEFAULT 0,
      price_change_1h REAL DEFAULT 0,
      price_change_6h REAL DEFAULT 0,
      price_change_24h REAL DEFAULT 0,
      velocity_score REAL DEFAULT 0,
      has_whale_flag INTEGER DEFAULT 0,
      image_url TEXT,
      website TEXT,
      twitter TEXT,
      telegram TEXT,
      first_seen_at INTEGER,
      last_updated_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS family_rules (
      family TEXT NOT NULL,
      rule_type TEXT NOT NULL,
      pattern TEXT NOT NULL,
      weight REAL DEFAULT 1.0,
      active INTEGER DEFAULT 1,
      PRIMARY KEY (family, pattern)
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_wallet TEXT NOT NULL,
      trigger_type TEXT NOT NULL,
      trigger_value TEXT NOT NULL,
      telegram_chat_id TEXT,
      created_at INTEGER,
      active INTEGER DEFAULT 1
    );

    CREATE INDEX IF NOT EXISTS idx_tokens_family ON tokens(family);
    CREATE INDEX IF NOT EXISTS idx_tokens_mcap ON tokens(mcap DESC);
    CREATE INDEX IF NOT EXISTS idx_tokens_velocity ON tokens(velocity_score DESC);
    CREATE INDEX IF NOT EXISTS idx_tokens_age ON tokens(age_seconds);
  `);

  return db;
}

const upsertStmt = () =>
  getDb().prepare(`
    INSERT OR REPLACE INTO tokens (
      mint, ticker, name, pair_address, chain, dex, family,
      age_seconds, mcap, liquidity, volume_24h, txns_24h,
      price_change_1h, price_change_6h, price_change_24h,
      velocity_score, has_whale_flag, image_url, website, twitter, telegram,
      first_seen_at, last_updated_at
    ) VALUES (
      @mint, @ticker, @name, @pair_address, @chain, @dex, @family,
      @age_seconds, @mcap, @liquidity, @volume_24h, @txns_24h,
      @price_change_1h, @price_change_6h, @price_change_24h,
      @velocity_score, @has_whale_flag, @image_url, @website, @twitter, @telegram,
      COALESCE((SELECT first_seen_at FROM tokens WHERE mint = @mint), @first_seen_at),
      @last_updated_at
    )
  `);

export function upsertToken(token: Token): void {
  upsertStmt().run(token);
}

export function upsertTokens(tokens: Token[]): void {
  const stmt = upsertStmt();
  const tx = getDb().transaction((items: Token[]) => {
    for (const t of items) stmt.run(t);
  });
  tx(tokens);
}

export function getTopTokens(opts: {
  family?: FamilyName;
  limit?: number;
  sortBy?: SortField;
}): Token[] {
  const { family, limit = 50, sortBy = "velocity" } = opts;
  const orderCol =
    sortBy === "mcap"
      ? "mcap DESC"
      : sortBy === "age"
        ? "age_seconds ASC"
        : "velocity_score DESC";

  if (family && family !== "other") {
    return getDb()
      .prepare(`SELECT * FROM tokens WHERE family = ? ORDER BY ${orderCol} LIMIT ?`)
      .all(family, limit) as Token[];
  }

  return getDb()
    .prepare(`SELECT * FROM tokens ORDER BY ${orderCol} LIMIT ?`)
    .all(limit) as Token[];
}

export function getRadarTokens(maxAgeSeconds = 7200, minMcap = 20000): Token[] {
  return getDb()
    .prepare(
      `SELECT * FROM tokens
       WHERE age_seconds < ? AND mcap >= ?
       ORDER BY velocity_score DESC`
    )
    .all(maxAgeSeconds, minMcap) as Token[];
}

export function getTokenByMint(mint: string): Token | null {
  return (
    (getDb().prepare("SELECT * FROM tokens WHERE mint = ?").get(mint) as Token | undefined) ?? null
  );
}

export function getFamilyRules(): FamilyRule[] {
  return getDb().prepare("SELECT * FROM family_rules WHERE active = 1").all() as FamilyRule[];
}

export function getFamilies(): FamilyStats[] {
  return getDb()
    .prepare(
      `SELECT
        family as name,
        COUNT(*) as token_count,
        SUM(mcap) as total_mcap,
        SUM(volume_24h) as total_volume,
        SUM(CASE WHEN velocity_score > 0 AND volume_24h > 0 THEN 1 ELSE 0 END) as active_count,
        SUM(CASE WHEN age_seconds < 7200 THEN 1 ELSE 0 END) as fresh_count,
        (SELECT ticker FROM tokens t2 WHERE t2.family = tokens.family ORDER BY velocity_score DESC LIMIT 1) as top_token,
        MAX(velocity_score) as top_velocity,
        (SELECT ticker FROM tokens t3 WHERE t3.family = tokens.family ORDER BY age_seconds ASC LIMIT 1) as freshest_token,
        (SELECT MIN(age_seconds) FROM tokens t4 WHERE t4.family = tokens.family) as freshest_age
       FROM tokens
       WHERE family != 'other'
       GROUP BY family
       ORDER BY total_volume DESC`
    )
    .all() as FamilyStats[];
}

export function addAlert(alert: Omit<Alert, "id">): number {
  const result = getDb()
    .prepare(
      `INSERT INTO alerts (user_wallet, trigger_type, trigger_value, telegram_chat_id, created_at, active)
       VALUES (@user_wallet, @trigger_type, @trigger_value, @telegram_chat_id, @created_at, @active)`
    )
    .run(alert);
  return Number(result.lastInsertRowid);
}

export function getTokenCount(): number {
  const row = getDb().prepare("SELECT COUNT(*) as count FROM tokens").get() as { count: number };
  return row.count;
}
