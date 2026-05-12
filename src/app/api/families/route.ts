import { NextResponse } from "next/server";
import { getFamilies, getAllFamilyMeta } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const families = getFamilies();
    const meta = getAllFamilyMeta();
    const colorMap = new Map(meta.map((m) => [m.name, m.color]));
    const labelMap = new Map(meta.map((m) => [m.name, m.label]));

    const enriched = families.map((f) => ({
      ...f,
      color: colorMap.get(f.name) ?? "#6B7280",
      label: labelMap.get(f.name) ?? f.name.toUpperCase(),
    }));

    return NextResponse.json(enriched);
  } catch (err) {
    console.error("[api/families]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
