import assert from "node:assert/strict";
import {
  computeLayout,
  renderComputedLayout,
  customContainer,
  embed,
  repeat,
  repeatX,
  stackX,
  wrapper,
} from "../../src/index.js";
import { LayoutCalculator, LayoutEngine, Node } from "../../src/layout.js";
import { createFakeSvg, withFakeSvgDocument } from "../helpers/fake-svg.mjs";

const zeroMargin = { top: 0, right: 0, bottom: 0, left: 0 };
const originalAdapter = LayoutCalculator.getMeasurementAdapter();

function leaf(id, width, height, renders = []) {
  const node = new Node();
  node.classTag = "leaf";
  node.element = {
    options: { width, height, margin: zeroMargin },
    render(container, options) {
      renders.push({ id, ...options });
      const rect = container.ownerDocument.createElementNS(
        "http://www.w3.org/2000/svg",
        "rect",
      );
      rect.setAttribute("data-id", id);
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
      return zeroMargin;
    },
  });

  {
    assert.throws(
      () => stackX([leaf("a", 10, 10)], { width: 100 }),
      /size is derived from its content/i,
    );
    assert.throws(
      () => wrapper(leaf("child", 10, 10), { height: 100 }),
      /size is derived from its content/i,
    );

    const stack = stackX([leaf("a", 10, 10), leaf("b", 10, 10)]);
    assert.throws(
      () => stack.render(createFakeSvg(), { width: 100 }),
      /size is derived from its content/i,
    );
    assert.throws(
      () =>
        wrapper(leaf("child", 10, 10)).render(createFakeSvg(), {
          height: 100,
        }),
      /size is derived from its content/i,
    );
  }

  {
    const repeated = repeatX(
      ["small", "large"],
      (value) =>
        value === "small" ? leaf(value, 10, 20) : leaf(value, 30, 40),
      { paddingInner: 0, paddingOuter: 0 },
    );

    const computed = LayoutEngine.computeLayout(repeated);
    assert.deepEqual(computed.bbox.contentRect(), {
      x: 0,
      y: 0,
      width: 60,
      height: 40,
    });
  }

  await withFakeSvgDocument(async (document) => {
    const renders = [];
    const container = document.createElement("div");
    const repeated = repeatX(
      ["a", "b"],
      (value) => leaf(value, 30, 20, renders),
      { width: 80, height: 40, paddingInner: 0, paddingOuter: 0 },
    );

    const computed = computeLayout(repeated, { width: 120, height: 50 });
    renderComputedLayout(computed, container);

    const svg = container.firstElementChild;
    assert.equal(svg.getAttribute("width"), "120");
    assert.equal(svg.getAttribute("height"), "50");
    assert.equal(computed.bbox.contentRect().width, 120);
    assert.equal(computed.bbox.contentRect().height, 50);
    assert.deepEqual(
      renders.map(({ width, height }) => ({ width, height })),
      [
        { width: 60, height: 50 },
        { width: 60, height: 50 },
      ],
    );
  });

  await withFakeSvgDocument(async (document) => {
    let resolvedSize;
    const container = document.createElement("div");
    const spatialContainer = customContainer({
      width: 80,
      height: 40,
      slots(data, _mapping, size) {
        resolvedSize = size;
        return data.map((datum) => ({
          datum,
          key: datum.id,
          x: size.width / 2,
          y: size.height / 2,
          width: 10,
          height: 10,
        }));
      },
    });
    const embedded = embed(
      spatialContainer,
      repeat([{ id: "a" }], ({ id }) => leaf(id, 10, 10)),
      { key: "id" },
    );

    const computed = computeLayout(embedded, { width: 200, height: 100 });
    renderComputedLayout(computed, container);

    const svg = container.firstElementChild;
    assert.equal(svg.getAttribute("width"), "200");
    assert.equal(svg.getAttribute("height"), "100");
    assert.deepEqual(resolvedSize, { width: 200, height: 100 });
    assert.equal(computed.bbox.contentRect().width, 200);
    assert.equal(computed.bbox.contentRect().height, 100);
  });
} finally {
  LayoutCalculator.setMeasurementAdapter(originalAdapter);
}
