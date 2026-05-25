import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { chart, image } from "../../src/index.js";

const node = chart({
  mark: "bar",
  data: [
    { category: "A", value: 4 },
    { category: "B", value: 7 },
  ],
  encoding: { x: "category", y: "value" },
  width: 180,
  height: 120,
  xAxisName: "Category",
  yAxisName: "Value",
});

{
  const svg = await node.export({ format: "svg" });

  assert.ok(svg.startsWith("<svg"), "export() should return serialized SVG");
  assert.ok(svg.includes("<rect"), "serialized SVG should contain chart marks");
  assert.ok(
    svg.includes("Category"),
    "serialized SVG should include axis labels",
  );
}

{
  const flag = image({
    url: "https://example.com/flag.svg",
    width: 24,
    height: 24,
  });
  const svg = await flag.export({ format: "svg" });

  assert.match(
    svg,
    /\sxmlns:xlink="http:\/\/www\.w3\.org\/1999\/xlink"/,
    "serialized SVG should declare the xlink namespace when image hrefs use xlink:href",
  );
}

{
  const directory = mkdtempSync(path.join(tmpdir(), "composite-export-"));
  const outputPath = path.join(directory, "chart.svg");
  const result = await node.export({ format: "svg", path: outputPath });
  const written = readFileSync(outputPath, "utf8");

  assert.equal(result, outputPath);
  assert.ok(written.includes("<svg"));
  assert.ok(written.includes("<rect"));
}

{
  await assert.rejects(
    () => node.export({ format: "jpeg" }),
    /Unsupported export format: jpeg/,
  );
}

{
  const pngSource = readFileSync(
    path.join(process.cwd(), "src", "export", "png.js"),
    "utf8",
  );

  assert.doesNotMatch(
    pngSource,
    /\.pnpm|sharp@0\.34\.5/,
    "PNG export should not hard-code pnpm store paths or sharp versions",
  );
  assert.doesNotMatch(
    pngSource,
    /pnpm add -D sharp/,
    "PNG export error should not tell consumers to install sharp as a dev dependency",
  );
}

{
  const nodeSource = readFileSync(
    path.join(process.cwd(), "src", "layout", "node.js"),
    "utf8",
  );

  assert.match(
    nodeSource,
    /import\(\s*\/\*\s*@vite-ignore\s*\*\/\s*exportModulePath\s*\)/,
    "Node-only export import should be ignored by Vite import analysis",
  );
}
