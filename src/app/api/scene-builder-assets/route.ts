import sharp from "sharp";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { sceneAssetsManifest } from "@/lib/game/asset-manifest";

const BUCKET = "scene-builder";
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

function getExtension(fileName: string) {
  const dot = fileName.lastIndexOf(".");
  return dot === -1 ? "" : fileName.slice(dot).toLowerCase();
}

function sanitizeBaseName(fileName: string) {
  const dot = fileName.lastIndexOf(".");
  const stem = dot === -1 ? fileName : fileName.slice(0, dot);
  return (
    stem
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "scene-builder-asset"
  );
}

function collectBuiltInSceneAssets(kind: "background" | "item") {
  const sceneBundle = sceneAssetsManifest.bundles.find((bundle) => bundle.name === "scene");
  if (!sceneBundle) return [];

  const assets = (Array.isArray(sceneBundle.assets) ? sceneBundle.assets : []) as SceneManifestAsset[];

  return assets
    .filter((asset) => {
      const aliases = Array.isArray(asset.alias) ? asset.alias : [asset.alias];
      const src = asset.src;
      if (!src || src.includes("/frame_")) return false;
      const isBackground = aliases.some((alias) => BUILT_IN_BACKGROUND_ALIASES.has(alias));
      if (kind === "background") return isBackground;
      return !isBackground && !aliases.some((alias) => BUILT_IN_ITEM_EXCLUDED_ALIASES.has(alias));
    })
    .map((asset) => asset.src)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
}

async function listStorageImages(folder: string): Promise<string[]> {
  const { data, error } = await supabaseAdmin.storage.from(BUCKET).list(folder, {
    limit: 1000,
    sortBy: { column: "name", order: "asc" },
  });

  if (error || !data) return [];

  const {
    data: { publicUrl: baseUrl },
  } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(`${folder}/`);

  return data
    .filter((file) => ALLOWED_EXTENSIONS.has(getExtension(file.name)))
    .map((file) => `${baseUrl}${file.name}`);
}

export async function GET() {
  const [uploadedBackgrounds, uploadedItems] = await Promise.all([
    listStorageImages("backgrounds"),
    listStorageImages("items"),
  ]);

  const backgrounds = Array.from(
    new Set([...collectBuiltInSceneAssets("background"), ...uploadedBackgrounds]),
  ).sort((a, b) => a.localeCompare(b));

  const items = Array.from(
    new Set([...collectBuiltInSceneAssets("item"), ...uploadedItems]),
  ).sort((a, b) => a.localeCompare(b));

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

  const extension = getExtension(file.name);
  if (!ALLOWED_EXTENSIONS.has(extension)) {
    return NextResponse.json({ error: "Unsupported file type." }, { status: 400 });
  }

  const inputBuffer = Buffer.from(await file.arrayBuffer());
  const webpBuffer = await sharp(inputBuffer).webp({ quality: 94 }).toBuffer();
  const fileStem = `${sanitizeBaseName(file.name)}-${Date.now()}`;
  const folder = kind === "background" ? "backgrounds" : "items";
  const storagePath = `${folder}/${fileStem}.webp`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(storagePath, webpBuffer, { contentType: "image/webp", upsert: false });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const {
    data: { publicUrl },
  } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(storagePath);

  return NextResponse.json({ src: publicUrl, kind });
}
