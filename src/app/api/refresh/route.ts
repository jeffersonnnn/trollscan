import { NextResponse } from "next/server";
import { pollAll } from "@/lib/poller";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const result = await pollAll();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[api/refresh]", err);
    return NextResponse.json({ error: "Refresh failed" }, { status: 500 });
  }
}
