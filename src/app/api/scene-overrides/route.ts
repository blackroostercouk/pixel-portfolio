import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { LayoutSpriteSnapshot } from "@/lib/game/types";
import type { SceneId } from "@/lib/game/core/game-state";

type SceneOverrideRecord = {
  backgroundSrc?: string | null;
  sprites?: LayoutSpriteSnapshot[];
};

type SceneOverridesPayload = Partial<Record<SceneId, SceneOverrideRecord>>;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("scene_overrides")
    .select("data")
    .eq("id", "singleton")
    .single();

  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: error.message }, { status: 500, headers: NO_CACHE_HEADERS });
  }

  const overrides: SceneOverridesPayload = data?.data ?? {};
  return NextResponse.json({ overrides }, { headers: NO_CACHE_HEADERS });
}

export async function PUT(request: Request) {
  const body = (await request.json()) as { overrides?: SceneOverridesPayload };

  if (!body.overrides || typeof body.overrides !== "object" || Array.isArray(body.overrides)) {
    return NextResponse.json({ error: "Invalid overrides payload." }, { status: 400, headers: NO_CACHE_HEADERS });
  }

  const { error } = await supabaseAdmin
    .from("scene_overrides")
    .upsert({ id: "singleton", data: body.overrides }, { onConflict: "id" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: NO_CACHE_HEADERS });
  }

  return NextResponse.json({ ok: true }, { headers: NO_CACHE_HEADERS });
}
