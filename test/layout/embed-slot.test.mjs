import assert from "node:assert/strict";
import {
  customContainer,
  embed,
  gridContainer,
  repeat,
} from "../../src/index.js";
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

function computeAndRender(container, data, mapping = { key: "id" }) {
  const embedded = embed(
    container,
    repeat(data, (datum) => fakeLeaf(datum.id)),
    mapping,
  );
  LayoutEngine.computeLayout(embedded);
  const root = createFakeSvg();
  LayoutRenderer.render(embedded, root);
  return root;
}

function findLeaf(root, id) {
  return root
    .querySelectorAll("rect")
    .find((rect) => rect.getAttribute("data-id") === id);
}

try {
  LayoutCalculator.setMeasurementAdapter({
    measureMargin() {
      return zeroMargin;
    },
  });

  {
    const data = [{ id: "a" }, { id: "b" }];
    const container = customContainer({
      width: 80,
      height: 40,
      slots(rows) {
        return [
          { datum: rows[1], key: "b", x: 70, y: 20, width: 10, height: 10 },
          { datum: rows[0], key: "a", x: 10, y: 20, width: 10, height: 10 },
        ];
      },
    });

    const root = computeAndRender(container, data);
    const a = findLeaf(root, "a");
    const b = findLeaf(root, "b");

    assert.equal(a.parentNode.getAttribute("transform"), "translate(5, 15)");
    assert.equal(b.parentNode.getAttribute("transform"), "translate(65, 15)");
  }

  {
    const root = computeAndRender(
      gridContainer({
        width: 100,
        height: 80,
        margin: { top: 20, right: 0, bottom: 0, left: 10 },
        rowDomain: ["r"],
        columnDomain: ["c"],
        cellSizing: "intrinsic",
      }),
      [
        { id: "skip", row: "r", column: "missing" },
        { id: "keep", row: "r", column: "c" },
      ],
      { key: "id", row: "row", column: "column", width: 10, height: 10 },
    );

    assert.equal(findLeaf(root, "skip"), undefined);
    const kept = findLeaf(root, "keep");
    assert.equal(
      kept.parentNode.getAttribute("transform"),
      "translate(55, 55)",
    );

    const gridCell = root
      .querySelectorAll("rect")
      .find((rect) => rect.getAttribute("data-id") === null);
    assert.equal(gridCell.getAttribute("x"), "10");
    assert.equal(gridCell.getAttribute("y"), "20");
  }

  {
    const duplicateSlots = customContainer({
      slots: (rows) => [
        { datum: rows[0], key: "a", x: 0, y: 0 },
        { datum: rows[0], key: "a", x: 1, y: 1 },
      ],
    });

    assert.throws(
      () => computeAndRender(duplicateSlots, [{ id: "a" }]),
      /slot key.*duplicated/i,
    );
  }

  {
    const invalidSlot = customContainer({
      slots: (rows) => [{ datum: rows[0], key: "a", x: Number.NaN, y: 0 }],
    });

    assert.throws(
      () => computeAndRender(invalidSlot, [{ id: "a" }]),
      /slot 0\.x must be a finite number/i,
    );
  }

  {
    const unknownSlot = customContainer({
      slots: (rows) => [{ datum: rows[0], key: "unknown", x: 0, y: 0 }],
    });

    assert.throws(
      () => computeAndRender(unknownSlot, [{ id: "a" }]),
      /unknown key/i,
    );
  }
} finally {
  LayoutCalculator.setMeasurementAdapter(originalAdapter);
}
