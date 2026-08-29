import { readdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import sharp from "sharp";

const sourceDirectory = path.resolve(
  process.cwd(),
  "design-refonte/product-logo-concepts",
);

const sources = (await readdir(sourceDirectory))
  .filter((name) => name.endsWith(".svg"))
  .sort();

for (const source of sources) {
  const input = path.join(sourceDirectory, source);
  const output = path.join(
    sourceDirectory,
    source.replace(/\.svg$/u, ".png"),
  );
  await sharp(input, { density: 144 }).png().toFile(output);
  process.stdout.write(`${path.basename(output)}\n`);
}
