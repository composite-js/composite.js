import assert from "node:assert/strict";
import { LayoutRenderer } from "../../src/layout/renderer.js";
import { Node } from "../../src/layout.js";
import { BBox } from "../../src/utils/bbox.js";
import { createFakeSvg } from "../helpers/fake-svg.mjs";

function createMeasuredLeaf() {
  const node = new Node();
  node.classTag = "chart";
  node.bbox = new BBox(0, 0, 100, 50);
  node.bbox.setMargin({ top: 5, right: 7, bottom: 11, left: 13 });
  node.element = { render() {} };
  return node;
}

{
  const container = createFakeSvg();
  const svg = LayoutRenderer.render(createMeasuredLeaf(), container);

  assert.equal(svg.getAttribute("width"), "120");
  assert.equal(svg.getAttribute("height"), "66");
  assert.equal(container.querySelectorAll("rect").length, 0);
}

{
  const container = createFakeSvg();
  LayoutRenderer.render(createMeasuredLeaf(), container, { debugBBox: true });

  assert.equal(container.querySelectorAll("rect").length, 2);
}
