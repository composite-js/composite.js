import assert from "node:assert/strict";
import {
  LayoutCalculator,
  LayoutEngine,
  Node,
  wrapper,
} from "../../src/layout.js";

const originalAdapter = LayoutCalculator.getMeasurementAdapter();

try {
  let measuredElement;
  let measuredSize;

  LayoutCalculator.setMeasurementAdapter({
    measureMargin(element, size) {
      measuredElement = element;
      measuredSize = size;
      return { top: 1, right: 2, bottom: 3, left: 4 };
    },
  });

  const node = new Node();
  node.classTag = "chart";
  node.element = {
    options: {
      width: 120,
      height: 80,
      data: [],
      encoding: { x: "category", y: "value" },
      mark: "bar",
    },
    render() {},
  };

  const computed = LayoutEngine.computeLayout(wrapper(node)).children[0];

  assert.equal(measuredElement, node.element);
  assert.deepEqual(measuredSize, { width: 120, height: 80 });
  assert.deepEqual(computed.bbox.getMargin(), {
    top: 1,
    right: 2,
    bottom: 3,
    left: 4,
  });
} finally {
  LayoutCalculator.setMeasurementAdapter(originalAdapter);
}
