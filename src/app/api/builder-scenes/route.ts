import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { LayoutSpriteSnapshot } from "@/lib/game/types";

type BuilderSceneRecord = {
  id: string;
  label: string;
  backgroundSrc: string | null;
  sprites: LayoutSpriteSnapshot[];
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("builder_scenes")
    .select("data")
    .eq("id", "singleton")
    .single();

  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const scenes: BuilderSceneRecord[] = data?.data ?? [];
  return NextResponse.json({ scenes });
}

export async function PUT(request: Request) {
  const body = (await request.json()) as { scenes?: BuilderSceneRecord[] };

  if (!Array.isArray(body.scenes)) {
    return NextResponse.json({ error: "Invalid scenes payload." }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("builder_scenes")
    .upsert({ id: "singleton", data: body.scenes }, { onConflict: "id" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
