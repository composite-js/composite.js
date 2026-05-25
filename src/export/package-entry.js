import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { Buffer } from "node:buffer";
import * as esmRuntime from "composite-js-esm-entry";
import cjsRuntime from "composite-js-cjs-entry";
import { LayoutEngine } from "../layout/engine.js";
import { LayoutRenderer } from "../layout/renderer.js";
import { withExportSvgDocument } from "./svg-dom.js";

function ensureSvgNamespace(svg) {
  if (!svg.getAttribute("xmlns")) {
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  }
  if (!svg.getAttribute("xmlns:xlink")) {
    svg.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
  }
}

function assertRuntimeLayoutNode(node) {
  let firstError;

  for (const runtime of [esmRuntime, cjsRuntime]) {
    if (!runtime?.assertLayoutNode) continue;

    try {
      runtime.assertLayoutNode(node);
      return;
    } catch (error) {
      firstError ??= error;
    }
  }

  if (firstError) throw firstError;
  throw new TypeError("node must be a layout node.");
}

export async function renderNodeToSvgString(node, renderOptions = {}) {
  assertRuntimeLayoutNode(node);

  return withExportSvgDocument(async (document) => {
    const container = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "svg",
    );

    LayoutEngine.computeLayout(node);
    const svg = LayoutRenderer.render(node, container, renderOptions);
    ensureSvgNamespace(svg);
    return svg.toString();
  });
}

export async function exportSvg(node, options = {}) {
  const { path: outputPath, ...renderOptions } = options;
  const svg = await renderNodeToSvgString(node, renderOptions);

  if (!outputPath) return svg;

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${svg}\n`, "utf8");
  return outputPath;
}

async function importSharp() {
  try {
    return await import("sharp");
  } catch (error) {
    throw new Error(
      `PNG export requires sharp. Install it with "pnpm add sharp" or enable the optional sharp dependency. Original error: ${error.message}`,
    );
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

function inferFormat(options) {
  if (options.format) return options.format;
  if (options.path) {
    const extension = path.extname(options.path).slice(1);
    if (extension) return extension;
  }
  return "svg";
}

export async function exportNode(node, options = {}) {
  const format = inferFormat(options).toLowerCase();

  if (format === "svg") return exportSvg(node, options);
  if (format === "png") return exportPng(node, options);

  throw new Error(`Unsupported export format: ${format}`);
}
