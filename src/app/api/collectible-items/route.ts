import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { CollectibleItemDefinition } from "@/lib/game/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("collectible_items")
    .select("data")
    .eq("id", "singleton")
    .single();

  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const items: CollectibleItemDefinition[] = data?.data ?? [];
  return NextResponse.json({ items });
}

export async function PUT(request: Request) {
  const body = (await request.json()) as { items?: CollectibleItemDefinition[] };

  if (!Array.isArray(body.items)) {
    return NextResponse.json({ error: "Invalid items payload." }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("collectible_items")
    .upsert({ id: "singleton", data: body.items }, { onConflict: "id" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
