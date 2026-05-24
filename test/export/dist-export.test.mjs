import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);

function createConfig() {
  return {
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
  };
}

{
  const distExportPath = path.join(process.cwd(), "dist", "export", "index.js");

  assert.ok(
    existsSync(distExportPath),
    "build output should include the Node export bundle used by packaged layout nodes",
  );
}

{
  const { chart } = await import("../../dist/esm/index.js");
  const svg = await chart(createConfig()).export({ format: "svg" });

  assert.ok(
    svg.startsWith("<svg"),
    "ESM dist export() should return serialized SVG",
  );
  assert.ok(
    svg.includes("<rect"),
    "ESM dist serialized SVG should contain chart marks",
  );
}

{
  const { chart } = require("../../dist/cjs/index.cjs");
  const svg = await chart(createConfig()).export({ format: "svg" });

  assert.ok(
    svg.startsWith("<svg"),
    "CJS dist export() should return serialized SVG",
  );
  assert.ok(
    svg.includes("<rect"),
    "CJS dist serialized SVG should contain chart marks",
  );
}
