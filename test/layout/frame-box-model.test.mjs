import assert from "node:assert/strict";
import { frame } from "../../src/index.js";
import {
  LayoutCalculator,
  LayoutEngine,
  LayoutRenderer,
  Node,
} from "../../src/layout.js";
import { createFakeSvg } from "../helpers/fake-svg.mjs";

const childMargin = { top: 5, right: 7, bottom: 11, left: 13 };
const originalAdapter = LayoutCalculator.getMeasurementAdapter();
let childRenderOptions;

function childNode() {
  const node = new Node();
  node.classTag = "leaf";
  node.element = {
    options: { width: 100, height: 50 },
    render(container, options) {
      childRenderOptions = options;
      const rect = container.ownerDocument.createElementNS(
        "http://www.w3.org/2000/svg",
        "rect",
      );
      rect.setAttribute("class", "child-content");
      rect.setAttribute("x", options.margin.left);
      rect.setAttribute("y", options.margin.top);
      rect.setAttribute("width", options.width);
      rect.setAttribute("height", options.height);
      container.appendChild(rect);
    },
  };
  return node;
}

try {
  LayoutCalculator.setMeasurementAdapter({
    measureMargin() {
      return childMargin;
    },
  });

  const framed = frame(childNode(), {
    padding: { top: 1, right: 4, bottom: 2, left: 3 },
  });

  LayoutEngine.computeLayout(framed);
  assert.equal(framed.bbox.contentRect().width, 127);
  assert.equal(framed.bbox.contentRect().height, 69);

  const root = createFakeSvg();
  LayoutRenderer.render(framed, root);

  assert.deepEqual(childRenderOptions, {
    width: 100,
    height: 50,
    margin: childMargin,
  });

  const border = root.querySelectorAll("rect").at(-1);
  assert.equal(border.getAttribute("x"), "3");
  assert.equal(border.getAttribute("y"), "1");
  assert.equal(border.getAttribute("width"), "120");
  assert.equal(border.getAttribute("height"), "66");

  const resizedRoot = createFakeSvg();
  framed.render(resizedRoot, { width: 157, height: 89 });

  assert.deepEqual(childRenderOptions, {
    width: 130,
    height: 70,
    margin: childMargin,
  });

  const resizedBorder = resizedRoot.querySelectorAll("rect").at(-1);
  assert.equal(resizedBorder.getAttribute("width"), "150");
  assert.equal(resizedBorder.getAttribute("height"), "86");
} finally {
  LayoutCalculator.setMeasurementAdapter(originalAdapter);
}
