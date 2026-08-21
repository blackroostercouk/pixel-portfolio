import { glob, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const patterns = [
  "public/assets/**/*.png",
  "public/assets/**/*.jpg",
  "public/assets/**/*.jpeg",
];

const files = new Set();

for (const pattern of patterns) {
  for await (const file of glob(pattern)) {
    if (/\.(png|jpg|jpeg)$/i.test(file)) {
      files.add(file);
    }
  }
}

await Promise.all(
  [...files].map(async (file) => {
    const outputFile = file.replace(/\.(png|jpg|jpeg)$/i, ".webp");

    await sharp(file)
      .webp({
        quality: 82,
        alphaQuality: 95,
        effort: 6,
      })
      .toFile(outputFile);

    const inputStats = await stat(file).catch(() => null);
    const outputStats = await stat(outputFile).catch(() => null);

    if (inputStats && outputStats) {
      const saved = inputStats.size - outputStats.size;
      console.log(
        `${path.relative(process.cwd(), file)} -> ${path.relative(process.cwd(), outputFile)} (-${Math.max(saved, 0)} bytes)`,
      );
    } else {
      console.log(`${path.relative(process.cwd(), file)} -> ${path.relative(process.cwd(), outputFile)}`);
    }
  }),
);
