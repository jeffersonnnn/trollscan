import { NextRequest, NextResponse } from "next/server";
import { addAlert } from "@/lib/db";
import { isPremium } from "@/lib/solana";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { wallet, trigger_type, trigger_value, telegram_chat_id } = body;

    if (!wallet || !trigger_type || !trigger_value) {
      return NextResponse.json(
        { error: "wallet, trigger_type, and trigger_value are required" },
        { status: 400 }
      );
    }

    const premium = await isPremium(wallet);
    if (!premium) {
      return NextResponse.json(
        { error: "Premium required. Hold $TROLLSCAN tokens to access alerts." },
        { status: 403 }
      );
    }

    const id = addAlert({
      user_wallet: wallet,
      trigger_type,
      trigger_value,
      telegram_chat_id: telegram_chat_id ?? null,
      created_at: Date.now(),
      active: 1,
    });

    return NextResponse.json({ id }, { status: 201 });
  } catch (err) {
    console.error("[api/alerts]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
