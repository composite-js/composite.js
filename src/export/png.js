import { mkdir, writeFile } from "node:fs/promises";
import { Buffer } from "node:buffer";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { renderNodeToSvgString } from "./svg.js";

async function importSharp() {
  try {
    return await import("sharp");
  } catch (error) {
    const localStorePath = path.resolve(
      "node_modules",
      ".pnpm",
      "sharp@0.34.5",
      "node_modules",
      "sharp",
      "lib",
      "index.js",
    );

    try {
      return await import(pathToFileURL(localStorePath).href);
    } catch {
      throw new Error(
        `PNG export requires sharp. Install it with "pnpm add -D sharp". Original error: ${error.message}`,
      );
    }
  }
}

export async function exportPng(node, options = {}) {
  const { path: outputPath, ...renderOptions } = options;
  const svg = await renderNodeToSvgString(node, renderOptions);
  const sharpModule = await importSharp();
  const sharp = sharpModule.default || sharpModule;
  const png = await sharp(Buffer.from(svg)).png().toBuffer();

  if (!outputPath) return png;

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, png);
  return outputPath;
}
