import { NextRequest, NextResponse } from "next/server";
import { getTokenByMint } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ mint: string }> }
) {
  try {
    const { mint } = await params;
    const token = getTokenByMint(mint);

    if (!token) {
      return NextResponse.json({ error: "Token not found" }, { status: 404 });
    }

    return NextResponse.json(token);
  } catch (err) {
    console.error("[api/token]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
