import assert from "node:assert/strict";
import { createRequire } from "node:module";

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
  };
}

{
  const { chart, isLayoutNode } = await import("../dist/esm/index.js");
  const node = chart(createConfig());

  assert.ok(isLayoutNode(node), "ESM dist should create layout nodes");
  assert.equal(typeof node.render, "function");
  assert.equal(node.export, undefined);
}

{
  const { chart, isLayoutNode } = require("../dist/cjs/index.cjs");
  const node = chart(createConfig());

  assert.ok(isLayoutNode(node), "CJS dist should create layout nodes");
  assert.equal(typeof node.render, "function");
  assert.equal(node.export, undefined);
}
