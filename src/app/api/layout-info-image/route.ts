import { mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { NextResponse } from "next/server";

const PUBLIC_DIR = path.join(process.cwd(), "public");
const ASSETS_DIR = path.join(PUBLIC_DIR, "assets");
const OUTPUT_DIR = path.join(ASSETS_DIR, "layout-info");
const ALLOWED_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp"]);
const IGNORED_SEGMENTS = ["frame_", "trash-mouse-idle", "character-idle", "character-close-laptop"];

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
      .slice(0, 48) || "layout-info-image"
  );
}

async function collectImages(dir: string): Promise<string[]> {
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

      const publicPath = toPublicAssetPath(fullPath);

      if (IGNORED_SEGMENTS.some((segment) => publicPath.includes(segment))) {
        return [];
      }

      return [publicPath];
    }),
  );

  return files.flat().sort((left, right) => left.localeCompare(right));
}

export async function GET() {
  const images = await collectImages(ASSETS_DIR);

  return NextResponse.json({ images });
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file." }, { status: 400 });
  }

  const extension = path.extname(file.name).toLowerCase();

  if (!ALLOWED_EXTENSIONS.has(extension)) {
    return NextResponse.json({ error: "Unsupported file type." }, { status: 400 });
  }

  await mkdir(OUTPUT_DIR, { recursive: true });

  const inputBuffer = Buffer.from(await file.arrayBuffer());
  const fileStem = `${sanitizeBaseName(file.name)}-${Date.now()}`;
  const outputPath = path.join(OUTPUT_DIR, `${fileStem}.webp`);

  await sharp(inputBuffer).webp({ quality: 92 }).toFile(outputPath);
  await writeFile(path.join(OUTPUT_DIR, `${fileStem}.source.txt`), file.name, "utf8");

  return NextResponse.json({
    src: toPublicAssetPath(outputPath),
  });
}
