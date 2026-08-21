import { mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { NextResponse } from "next/server";
import { sceneAssetsManifest } from "@/lib/game/asset-manifest";

const PUBLIC_DIR = path.join(process.cwd(), "public");
const SCENE_ASSETS_DIR = path.join(PUBLIC_DIR, "assets", "scene");
const BUILDER_DIR = path.join(SCENE_ASSETS_DIR, "builder");
const BACKGROUNDS_DIR = path.join(BUILDER_DIR, "backgrounds");
const ITEMS_DIR = path.join(BUILDER_DIR, "items");
const ALLOWED_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp"]);
const BUILT_IN_BACKGROUND_ALIASES = new Set([
  "background",
  "backgroundScene2",
  "backgroundScene3",
  "backgroundScene4",
]);
const BUILT_IN_ITEM_EXCLUDED_ALIASES = new Set([
  "scene2Character",
  "character",
  "cat",
  "windTurbine",
  "ufo",
  "bubble",
  "bubbleMouse",
  "infoIcon",
  "collectIcon",
]);
type SceneManifestAsset = {
  alias: string | string[];
  src: string;
};

export const runtime = "nodejs";

function toPublicAssetPath(absolutePath: string) {
  return `/${path.relative(PUBLIC_DIR, absolutePath).split(path.sep).join("/")}`;
}

function sanitizeBaseName(fileName: string) {
  return (
    path
      .basename(fileName, path.extname(fileName))
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "scene-builder-asset"
  );
}

async function collectImages(dir: string): Promise<string[]> {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    const files = await Promise.all(
      entries.map(async (entry) => {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          return collectImages(fullPath);
        }

        const extension = path.extname(entry.name).toLowerCase();

        if (!ALLOWED_EXTENSIONS.has(extension)) {
          return [];
        }

        return [toPublicAssetPath(fullPath)];
      }),
    );

    return files.flat().sort((left, right) => left.localeCompare(right));
  } catch {
    return [];
  }
}

function collectBuiltInSceneAssets(kind: "background" | "item") {
  const sceneBundle = sceneAssetsManifest.bundles.find((bundle) => bundle.name === "scene");

  if (!sceneBundle) {
    return [];
  }

  const assets = (Array.isArray(sceneBundle.assets) ? sceneBundle.assets : []) as SceneManifestAsset[];

  return assets
    .filter((asset) => {
      const aliases = Array.isArray(asset.alias) ? asset.alias : [asset.alias];
      const src = asset.src;

      if (!src || src.includes("/frame_")) {
        return false;
      }

      const isBackground = aliases.some((alias: string) => BUILT_IN_BACKGROUND_ALIASES.has(alias));

      if (kind === "background") {
        return isBackground;
      }

      return !isBackground && !aliases.some((alias: string) => BUILT_IN_ITEM_EXCLUDED_ALIASES.has(alias));
    })
    .map((asset) => asset.src)
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right));
}

export async function GET() {
  const [uploadedBackgrounds, uploadedItems] = await Promise.all([
    collectImages(BACKGROUNDS_DIR),
    collectImages(ITEMS_DIR),
  ]);

  const backgrounds = Array.from(
    new Set([...collectBuiltInSceneAssets("background"), ...uploadedBackgrounds]),
  ).sort((left, right) => left.localeCompare(right));
  const items = Array.from(new Set([...collectBuiltInSceneAssets("item"), ...uploadedItems])).sort(
    (left, right) => left.localeCompare(right),
  );

  return NextResponse.json({ backgrounds, items });
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");
  const kind = formData.get("kind");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file." }, { status: 400 });
  }

  if (kind !== "background" && kind !== "item") {
    return NextResponse.json({ error: "Invalid asset kind." }, { status: 400 });
  }

  const extension = path.extname(file.name).toLowerCase();

  if (!ALLOWED_EXTENSIONS.has(extension)) {
    return NextResponse.json({ error: "Unsupported file type." }, { status: 400 });
  }

  const outputDir = kind === "background" ? BACKGROUNDS_DIR : ITEMS_DIR;
  await mkdir(outputDir, { recursive: true });

  const inputBuffer = Buffer.from(await file.arrayBuffer());
  const fileStem = `${sanitizeBaseName(file.name)}-${Date.now()}`;
  const outputPath = path.join(outputDir, `${fileStem}.webp`);

  await sharp(inputBuffer).webp({ quality: 94 }).toFile(outputPath);
  await writeFile(path.join(outputDir, `${fileStem}.source.txt`), file.name, "utf8");

  return NextResponse.json({
    src: toPublicAssetPath(outputPath),
    kind,
  });
}
