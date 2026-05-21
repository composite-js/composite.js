import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { chart } from "../../src/index.js";

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
