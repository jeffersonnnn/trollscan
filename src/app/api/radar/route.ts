import { NextResponse } from "next/server";
import { getRadarTokens } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const tokens = getRadarTokens(7200, 20000);
    return NextResponse.json(tokens);
  } catch (err) {
    console.error("[api/radar]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
