import path from "path";
import fs from "fs";
import Database from "better-sqlite3";

const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(path.join(dataDir, "trollscan.db"));
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS family_rules (
    family TEXT NOT NULL,
    rule_type TEXT NOT NULL,
    pattern TEXT NOT NULL,
    weight REAL DEFAULT 1.0,
    active INTEGER DEFAULT 1,
    PRIMARY KEY (family, pattern)
  );
`);

const rules = [
  { family: "troll", rule_type: "regex", pattern: "troll", weight: 1.0 },
  { family: "troll", rule_type: "regex", pattern: "tepe", weight: 0.6 },
  { family: "troll", rule_type: "regex", pattern: "trollina", weight: 0.8 },
  { family: "troll", rule_type: "regex", pattern: "totus", weight: 0.7 },
  { family: "troll", rule_type: "regex", pattern: "rage(guy)?", weight: 0.5 },

  { family: "hanta", rule_type: "regex", pattern: "hanta", weight: 1.0 },
  { family: "hanta", rule_type: "keyword", pattern: "hantavirus", weight: 1.0 },
  { family: "hanta", rule_type: "keyword", pattern: "outbreak", weight: 0.4 },
  { family: "hanta", rule_type: "keyword", pattern: "lockdown", weight: 0.5 },

  { family: "goblin", rule_type: "regex", pattern: "goblin", weight: 1.0 },
  { family: "goblin", rule_type: "keyword", pattern: "altman", weight: 0.6 },
  { family: "goblin", rule_type: "keyword", pattern: "openai", weight: 0.4 },

  { family: "ai", rule_type: "regex", pattern: "^ai", weight: 0.8 },
  { family: "ai", rule_type: "regex", pattern: "agent", weight: 0.6 },
  { family: "ai", rule_type: "keyword", pattern: "pippin", weight: 0.5 },
  { family: "ai", rule_type: "keyword", pattern: "fartcoin", weight: 0.5 },
  { family: "ai", rule_type: "keyword", pattern: "zerebro", weight: 0.5 },

  { family: "ufo", rule_type: "regex", pattern: "uap|ufo|alien|disclosure|saucer|roswell|seti", weight: 1.0 },

  { family: "charity", rule_type: "keyword", pattern: "unicef", weight: 1.0 },
  { family: "charity", rule_type: "keyword", pattern: "red cross", weight: 1.0 },
  { family: "charity", rule_type: "keyword", pattern: "st jude", weight: 1.0 },
  { family: "charity", rule_type: "keyword", pattern: "wish", weight: 0.7 },
  { family: "charity", rule_type: "keyword", pattern: "pengu", weight: 0.6 },

  { family: "brainrot", rule_type: "regex", pattern: "tung|sahur|skibidi|wojak|chud|buttcoin", weight: 0.9 },
];

const stmt = db.prepare(
  "INSERT OR REPLACE INTO family_rules (family, rule_type, pattern, weight, active) VALUES (?, ?, ?, ?, 1)"
);

const tx = db.transaction(() => {
  for (const r of rules) {
    stmt.run(r.family, r.rule_type, r.pattern, r.weight);
  }
});

tx();
console.log(`Seeded ${rules.length} family rules`);

const rows = db.prepare("SELECT * FROM family_rules").all();
console.log("Families:", [...new Set((rows as any[]).map((r) => r.family))].join(", "));

db.close();
