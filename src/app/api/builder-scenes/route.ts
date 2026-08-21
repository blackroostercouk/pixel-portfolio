import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import type { LayoutSpriteSnapshot } from "@/lib/game/types";

type BuilderSceneRecord = {
  id: string;
  label: string;
  backgroundSrc: string | null;
  sprites: LayoutSpriteSnapshot[];
};

const FILE_PATH = path.join(process.cwd(), "src", "lib", "game", "builder-scenes.json");

export const runtime = "nodejs";

async function readBuilderScenesFile() {
  const raw = await readFile(FILE_PATH, "utf8");
  return JSON.parse(raw) as BuilderSceneRecord[];
}

export async function GET() {
  const scenes = await readBuilderScenesFile();
  return NextResponse.json({ scenes });
}

export async function PUT(request: Request) {
  const body = (await request.json()) as { scenes?: BuilderSceneRecord[] };

  if (!Array.isArray(body.scenes)) {
    return NextResponse.json({ error: "Invalid scenes payload." }, { status: 400 });
  }

  await writeFile(FILE_PATH, `${JSON.stringify(body.scenes, null, 2)}\n`, "utf8");

  return NextResponse.json({ ok: true });
}
