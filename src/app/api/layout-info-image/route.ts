import sharp from "sharp";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

const BUCKET = "layout-info";
const ALLOWED_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp"]);
const IGNORED_SEGMENTS = ["frame_", "trash-mouse-idle", "character-idle", "character-close-laptop"];

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
      .slice(0, 48) || "layout-info-image"
  );
}

export async function GET() {
  const { data, error } = await supabaseAdmin.storage.from(BUCKET).list("", {
    limit: 1000,
    sortBy: { column: "name", order: "asc" },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const {
    data: { publicUrl: baseUrl },
  } = supabaseAdmin.storage.from(BUCKET).getPublicUrl("");

  const images = (data ?? [])
    .filter((file) => {
      const ext = getExtension(file.name);
      if (!ALLOWED_EXTENSIONS.has(ext)) return false;
      if (IGNORED_SEGMENTS.some((seg) => file.name.includes(seg))) return false;
      return true;
    })
    .map((file) => `${baseUrl}${file.name}`);

  return NextResponse.json({ images });
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file." }, { status: 400 });
  }

  const extension = getExtension(file.name);

  if (!ALLOWED_EXTENSIONS.has(extension)) {
    return NextResponse.json({ error: "Unsupported file type." }, { status: 400 });
  }

  const inputBuffer = Buffer.from(await file.arrayBuffer());
  const webpBuffer = await sharp(inputBuffer).webp({ quality: 92 }).toBuffer();
  const fileStem = `${sanitizeBaseName(file.name)}-${Date.now()}`;
  const storagePath = `${fileStem}.webp`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(storagePath, webpBuffer, { contentType: "image/webp", upsert: false });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const {
    data: { publicUrl },
  } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(storagePath);

  return NextResponse.json({ src: publicUrl });
}
