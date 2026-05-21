import path from "node:path";
import { exportPng } from "./png.js";
import { exportSvg } from "./svg.js";

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
