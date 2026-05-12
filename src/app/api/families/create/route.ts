import { NextRequest, NextResponse } from "next/server";
import { getFamilyMeta, upsertFamily, getDb, reclassifyTokens, getOtherTokensSince } from "@/lib/db";
import { invalidateRulesCache } from "@/lib/families";
import { generateColor } from "@/lib/auto-detect";
import { emitter } from "@/lib/events";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { keyword, label, color, admin_key } = body;

  if (process.env.ADMIN_KEY && admin_key !== process.env.ADMIN_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const name = (keyword ?? "").toLowerCase().trim();
  if (!name || name.length < 2 || name.length > 30) {
    return NextResponse.json({ error: "Keyword must be 2-30 chars" }, { status: 400 });
  }

  const existing = getFamilyMeta(name);
  if (existing) {
    return NextResponse.json({ error: "Family already exists", family: existing }, { status: 409 });
  }

  const familyColor = color ?? generateColor(name);
  upsertFamily({
    name,
    label: label ?? name.toUpperCase(),
    color: familyColor,
    search_terms: name,
    source: "admin",
  });

  getDb()
    .prepare(
      "INSERT OR IGNORE INTO family_rules (family, rule_type, pattern, weight, active) VALUES (?, 'keyword', ?, 1.0, 1)"
    )
    .run(name, name);

  invalidateRulesCache();

  const recentOthers = getOtherTokensSince(Date.now() - 24 * 60 * 60 * 1000);
  const matching = recentOthers.filter((t) => {
    const text = `${t.ticker} ${t.name}`.toLowerCase();
    return text.includes(name);
  });

  if (matching.length > 0) {
    reclassifyTokens(matching.map((t) => t.mint), name);
  }

  emitter.emit("tokens.updated", { source: "admin_create", family: name });

  return NextResponse.json(
    { ok: true, family: name, color: familyColor, reclassified: matching.length },
    { status: 201 }
  );
}
