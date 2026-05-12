import { NextResponse } from "next/server";
import { getAllFamilyMeta } from "@/lib/db";

export async function GET() {
  const families = getAllFamilyMeta();
  return NextResponse.json(families, {
    headers: { "Cache-Control": "public, s-maxage=15" },
  });
}
