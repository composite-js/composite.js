import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { Node } from "../src/index.js";

const examplesDir = path.join(process.cwd(), "examples");
const exampleFiles = readdirSync(examplesDir)
  .filter((file) => file.endsWith(".js"))
  .sort();

for (const file of exampleFiles) {
  const moduleUrl = pathToFileURL(path.join(examplesDir, file)).href;
  const module = await import(moduleUrl);

  assert.equal(
    typeof module.createExample,
    "function",
    `${file} should export createExample()`,
  );

  const node = module.createExample();
  assert.ok(node instanceof Node, `${file} should create a layout node`);

  const svg = await node.export({ format: "svg" });
  assert.ok(svg.startsWith("<svg"), `${file} should export an SVG string`);
  assert.ok(svg.includes("</svg>"), `${file} should export complete SVG`);
}
