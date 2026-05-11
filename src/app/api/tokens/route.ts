import { NextRequest, NextResponse } from "next/server";
import { getTopTokens } from "@/lib/db";
import type { FamilyName, SortField } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;
    const family = params.get("family") as FamilyName | null;
    const sortBy = (params.get("sort") ?? "velocity") as SortField;
    const limit = Math.min(parseInt(params.get("limit") ?? "50", 10), 200);

    const tokens = getTopTokens({
      family: family ?? undefined,
      sortBy,
      limit,
    });

    return NextResponse.json(tokens, {
      headers: {
        "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30",
      },
    });
  } catch (err) {
    console.error("[api/tokens]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
