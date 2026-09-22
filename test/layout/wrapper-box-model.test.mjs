import assert from "node:assert/strict";
import { wrapper } from "../../src/index.js";
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

  const wrapped = wrapper(childNode(), {
    padding: { top: 1, right: 4, bottom: 2, left: 3 },
  });

  const computed = LayoutEngine.computeLayout(wrapped);
  assert.equal(computed.bbox.contentRect().width, 127);
  assert.equal(computed.bbox.contentRect().height, 69);

  const root = createFakeSvg();
  LayoutRenderer.render(computed, root);

  assert.deepEqual(childRenderOptions, {
    width: 100,
    height: 50,
    margin: childMargin,
  });

  const border = root.querySelectorAll("rect").at(-1);
  assert.equal(border.getAttribute("x"), "0");
  assert.equal(border.getAttribute("y"), "0");
  assert.equal(border.getAttribute("width"), "127");
  assert.equal(border.getAttribute("height"), "69");

  assert.throws(
    () => wrapped.render(createFakeSvg(), { width: 157, height: 89 }),
    /size is derived from its content/i,
  );
} finally {
  LayoutCalculator.setMeasurementAdapter(originalAdapter);
}
