import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { LayoutEngine } from "../layout/engine.js";
import { LayoutRenderer } from "../layout/renderer.js";
import { assertLayoutNode } from "../layout/node.js";
import { withExportSvgDocument } from "./svg-dom.js";

function ensureSvgNamespace(svg) {
  if (!svg.getAttribute("xmlns")) {
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  }
  if (!svg.getAttribute("xmlns:xlink")) {
    svg.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
  }
}

export async function renderNodeToSvgString(node, renderOptions = {}) {
  assertLayoutNode(node);

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
