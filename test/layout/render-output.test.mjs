import assert from "node:assert/strict";
import { LayoutRenderer } from "../../src/layout/renderer.js";
import { Node, repeatY, computeLayout } from "../../src/layout.js";
import { createFakeSvg, withFakeSvgDocument } from "../helpers/fake-svg.mjs";

function createMeasuredLeaf() {
  const node = new Node();
  node.classTag = "chart";
  node.element = {
    options: {
      width: 100,
      height: 50,
      margin: { top: 5, right: 7, bottom: 11, left: 13 },
    },
    render() {},
  };
  return computeLayout(node);
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

await withFakeSvgDocument(async (document) => {
  const container = document.createElement("div");
  const repeated = repeatY(
    ["A", "B"],
    (id) => {
      const node = new Node();
      node.classTag = "chart";
      node.element = {
        render(target) {
          const rect = target.ownerDocument.createElementNS(
            "http://www.w3.org/2000/svg",
            "rect",
          );
          rect.setAttribute("data-id", id);
          rect.setAttribute("width", 10);
          rect.setAttribute("height", 10);
          target.appendChild(rect);
        },
      };
      return node;
    },
    { width: 80, height: 60, paddingInner: 0, paddingOuter: 0 },
  );

  repeated.render(container);

  const svg = container.firstElementChild;
  assert.equal(svg.tagName, "svg");
  assert.equal(svg.getAttribute("width"), "80");
  assert.equal(svg.getAttribute("height"), "60");
  assert.equal(container.querySelectorAll("rect").length, 2);
});
