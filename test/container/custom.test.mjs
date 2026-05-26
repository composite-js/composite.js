import assert from "node:assert/strict";
import { customContainer, embed, repeat } from "../../src/index.js";
import {
  LayoutCalculator,
  LayoutEngine,
  LayoutRenderer,
  Node,
} from "../../src/layout.js";
import { createFakeSvg } from "../helpers/fake-svg.mjs";

const zeroMargin = { top: 0, right: 0, bottom: 0, left: 0 };
const originalAdapter = LayoutCalculator.getMeasurementAdapter();

function fakeLeaf(id) {
  const node = new Node();
  node.classTag = "leaf";
  node.element = {
    options: { width: 10, height: 10, margin: zeroMargin },
    render(container) {
      const rect = container.ownerDocument.createElementNS(
        "http://www.w3.org/2000/svg",
        "rect",
      );
      rect.setAttribute("data-id", id);
      rect.setAttribute("width", 10);
      rect.setAttribute("height", 10);
      container.appendChild(rect);
    },
  };
  return node;
}

{
  const container = customContainer({
    slots(data) {
      return data.map((datum, index) => ({
        datum,
        key: datum.id,
        x: index * 10,
        y: index * 20,
      }));
    },
  });

  assert.equal(container.width, 400);
  assert.equal(container.height, 300);
  assert.deepEqual(container.margin, zeroMargin);
}

{
  assert.throws(
    () => customContainer({ width: Number.NaN, slots: () => [] }),
    /width/i,
  );
  assert.throws(() => customContainer({ slots: "bad" }), /slots/i);
  assert.throws(
    () => customContainer({ slots: () => [], render: "bad" }),
    /render/i,
  );
}

try {
  LayoutCalculator.setMeasurementAdapter({
    measureMargin() {
      return zeroMargin;
    },
  });

  const container = customContainer({
    width: 80,
    height: 40,
    render(svg) {
      const line = svg.ownerDocument.createElementNS(
        "http://www.w3.org/2000/svg",
        "line",
      );
      svg.appendChild(line);
    },
    slots(data, mapping) {
      return data.map((datum, index) => ({
        datum,
        key: datum.id,
        x: index === 0 ? 10 : 50,
        y: 20,
        width: mapping.width,
        height: mapping.height,
      }));
    },
  });

  const embedded = embed(
    container,
    repeat([{ id: "a" }, { id: "b" }], (datum) => fakeLeaf(datum.id)),
    { key: "id", width: 10, height: 10 },
  );

  LayoutEngine.computeLayout(embedded);
  assert.equal(embedded.bbox.contentRect().width, 80);
  assert.equal(embedded.bbox.contentRect().height, 40);

  const root = createFakeSvg();
  LayoutRenderer.render(embedded, root);

  assert.equal(root.querySelectorAll("line").length, 1);
  assert.equal(root.querySelectorAll("rect").length, 2);
} finally {
  LayoutCalculator.setMeasurementAdapter(originalAdapter);
}

{
  assert.throws(
    () =>
      embed(
        { width: 10, height: 10 },
        repeat([], () => fakeLeaf("x")),
      ),
    /slots/i,
  );
}
