import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import type { LayoutSpriteSnapshot } from "@/lib/game/types";
import type { SceneId } from "@/lib/game/core/game-state";

type SceneOverrideRecord = {
  backgroundSrc?: string | null;
  sprites?: LayoutSpriteSnapshot[];
};

type SceneOverridesPayload = Partial<Record<SceneId, SceneOverrideRecord>>;

const FILE_PATH = path.join(process.cwd(), "src", "lib", "game", "scene-overrides.json");
const DEBUG_FILE_PATH = path.join(process.cwd(), "src", "lib", "game", "scene-overrides.debug.json");

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

async function readSceneOverridesFile() {
  const raw = await readFile(FILE_PATH, "utf8");
  return JSON.parse(raw) as SceneOverridesPayload;
}

export async function GET() {
  const overrides = await readSceneOverridesFile();
  return NextResponse.json(
    { overrides },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    },
  );
}

export async function PUT(request: Request) {
  const body = (await request.json()) as { overrides?: SceneOverridesPayload };

  if (!body.overrides || typeof body.overrides !== "object" || Array.isArray(body.overrides)) {
    return NextResponse.json({ error: "Invalid overrides payload." }, { status: 400 });
  }

  await writeFile(
    DEBUG_FILE_PATH,
    `${JSON.stringify(
      {
        savedAt: new Date().toISOString(),
        overrides: body.overrides,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
  await writeFile(FILE_PATH, `${JSON.stringify(body.overrides, null, 2)}\n`, "utf8");

  return NextResponse.json(
    { ok: true },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    },
  );
}
