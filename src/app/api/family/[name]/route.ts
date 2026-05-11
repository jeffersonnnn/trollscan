import { NextRequest, NextResponse } from "next/server";
import { getTopTokens } from "@/lib/db";
import type { FamilyName } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;
    const family = name.toLowerCase() as FamilyName;

    const tokens = getTopTokens({
      family,
      sortBy: "velocity",
      limit: 100,
    });

    return NextResponse.json(tokens);
  } catch (err) {
    console.error("[api/family]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
