import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { isLayoutNode } from "../src/index.js";

const examplesDir = path.join(process.cwd(), "examples");
const exampleFiles = readdirSync(examplesDir)
  .filter((file) => file.endsWith(".js"))
  .sort();

assert.ok(exampleFiles.includes("country.js"), "country example should exist");
assert.ok(
  exampleFiles.includes("scatterplotmatrix.js"),
  "scatterplotmatrix example should exist",
);

for (const file of exampleFiles) {
  const moduleUrl = pathToFileURL(path.join(examplesDir, file)).href;
  const module = await import(moduleUrl);

  assert.equal(
    typeof module.createExample,
    "function",
    `${file} should export createExample()`,
  );

  const node = await Promise.resolve(module.createExample());
  assert.ok(isLayoutNode(node), `${file} should create a layout node`);

  const svg = await node.export({ format: "svg" });
  assert.ok(svg.startsWith("<svg"), `${file} should export an SVG string`);
  assert.ok(svg.includes("</svg>"), `${file} should export complete SVG`);

  if (file === "country.js") {
    assert.match(svg, /<image\b/, "country should render flag images");
    assert.match(
      svg,
      /https:\/\/kapowaz\.github\.io\/circle-flags\/flags\/us\.svg/,
      "country should use circle-flags flag artwork",
    );
    assert.doesNotMatch(
      svg,
      /https:\/\/flagcdn\.com\//,
      "country should not use rectangular FlagCDN artwork",
    );
    assert.match(svg, /<circle\b/, "country should render PAC circles");
  }

  if (file === "scatterplotmatrix.js") {
    assert.match(
      svg,
      /<circle\b/,
      "scatterplot-matrix should render scatter plot points",
    );
    assert.match(
      svg,
      /class="embed"/,
      "scatterplot-matrix should use an embedded grid layout",
    );
    assert.match(
      svg,
      /Sepal length/,
      "scatterplot-matrix should render variable labels",
    );
  }
}
