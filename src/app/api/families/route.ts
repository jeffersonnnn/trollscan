import { NextResponse } from "next/server";
import { getFamilies } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const families = getFamilies();
    return NextResponse.json(families);
  } catch (err) {
    console.error("[api/families]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
