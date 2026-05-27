import assert from "node:assert/strict";
import { chart, stackX, stackY } from "../../src/index.js";

const categories = ["A", "B"];
const data = [
  { category: "A", group: "A", value: 40, size: 25 },
  { category: "B", group: "B", value: 80, size: 100 },
];

function horizontalBars(overrides = {}) {
  return chart({
    mark: "bar",
    data,
    width: 100,
    height: 40,
    encoding: {
      x: "value",
      y: "category",
      xDomain: [0, 100],
      yDomain: categories,
    },
    padding: { yInner: 0.22, yOuter: 0.08 },
    ...overrides,
  });
}

function verticalBars(overrides = {}) {
  return chart({
    mark: "bar",
    data,
    width: 40,
    height: 100,
    encoding: {
      x: "category",
      y: "value",
      xDomain: categories,
      yDomain: [0, 100],
    },
    padding: { xInner: 0.31, xOuter: 0.04 },
    ...overrides,
  });
}

function verticalPac(overrides = {}) {
  return chart({
    mark: "pac",
    data,
    width: 40,
    height: 40,
    encoding: {
      x: "size",
      y: "category",
      yDomain: categories,
    },
    ...overrides,
  });
}

function horizontalPac(overrides = {}) {
  return chart({
    mark: "pac",
    data,
    width: 40,
    height: 40,
    encoding: {
      x: "category",
      y: "size",
      xDomain: categories,
    },
    ...overrides,
  });
}

{
  const bars = horizontalBars();
  const pac = verticalPac();

  stackX([bars, pac]);

  assert.equal(pac.element.padding.yInner, 0.22);
  assert.equal(pac.element.padding.yOuter, 0.08);
  assert.equal(pac.element.renderer.padding.yInner, 0.22);
  assert.equal(pac.element.renderer.padding.yOuter, 0.08);
  assert.equal(pac.element.options.padding, undefined);
}

{
  const bars = verticalBars();
  const pac = horizontalPac();

  stackY([bars, pac]);

  assert.equal(pac.element.padding.xInner, 0.31);
  assert.equal(pac.element.padding.xOuter, 0.04);
  assert.equal(pac.element.renderer.padding.xInner, 0.31);
  assert.equal(pac.element.renderer.padding.xOuter, 0.04);
  assert.equal(pac.element.options.padding, undefined);
}

{
  const bars = horizontalBars();
  const pac = verticalPac({
    padding: { yInner: 0.4 },
  });

  stackX([bars, pac]);

  assert.equal(pac.element.padding.yInner, 0.4);
  assert.equal(pac.element.padding.yOuter, 0.08);
  assert.equal(pac.element.renderer.padding.yInner, 0.4);
  assert.equal(pac.element.renderer.padding.yOuter, 0.08);
  assert.deepEqual(pac.element.options.padding, { yInner: 0.4 });
}

{
  const bars = horizontalBars();
  const box = chart({
    mark: "box",
    data: [
      { category: "A", value: 10 },
      { category: "A", value: 20 },
      { category: "B", value: 30 },
      { category: "B", value: 40 },
    ],
    width: 100,
    height: 40,
    encoding: {
      x: "value",
      y: "category",
      xDomain: [0, 100],
      yDomain: categories,
    },
    padding: { yInner: 0.3, yOuter: 0.08 },
  });
  const pac = verticalPac();

  stackX([bars, pac, box]);

  assert.equal(pac.element.padding.yInner, 0.1);
  assert.equal(pac.element.padding.yOuter, 0.08);
  assert.equal(pac.element.renderer.padding.yInner, 0.1);
  assert.equal(pac.element.renderer.padding.yOuter, 0.08);
}

{
  const bars = horizontalBars({
    padding: { yInner: Infinity, yOuter: 0.08 },
  });
  const box = chart({
    mark: "box",
    data: [
      { category: "A", value: 10 },
      { category: "A", value: 20 },
      { category: "B", value: 30 },
      { category: "B", value: 40 },
    ],
    width: 100,
    height: 40,
    encoding: {
      x: "value",
      y: "category",
      xDomain: [0, 100],
      yDomain: categories,
    },
    padding: { yInner: 0.3, yOuter: 0.08 },
  });
  const pac = verticalPac();

  stackX([bars, pac, box]);

  assert.equal(pac.element.padding.yInner, 0.1);
  assert.equal(pac.element.padding.yOuter, 0.08);
  assert.equal(pac.element.renderer.padding.yInner, 0.1);
  assert.equal(pac.element.renderer.padding.yOuter, 0.08);
}

{
  const bars = horizontalBars();
  const bubble = chart({
    mark: "bubble",
    data,
    width: 40,
    height: 40,
    encoding: {
      x: "value",
      y: "category",
      size: "size",
      yDomain: categories,
    },
  });

  stackX([bars, bubble]);

  assert.equal(bubble.element.padding.yInner, 0.1);
  assert.equal(bubble.element.padding.yOuter, 0.1);
  assert.equal(bubble.element.renderer.padding.yInner, 0.1);
  assert.equal(bubble.element.renderer.padding.yOuter, 0.1);
}

{
  const bars = horizontalBars();
  const pac = verticalPac({
    data: [
      { group: "A", size: 25 },
      { group: "B", size: 100 },
    ],
    encoding: {
      x: "size",
      y: "group",
      yDomain: categories,
    },
  });

  stackX([bars, pac]);

  assert.equal(pac.element.padding.yInner, 0.1);
  assert.equal(pac.element.padding.yOuter, 0.1);
  assert.equal(pac.element.renderer.padding.yInner, 0.1);
  assert.equal(pac.element.renderer.padding.yOuter, 0.1);
}

{
  const bars = horizontalBars({
    data: [
      { set: "A", value: 40 },
      { set: "B", value: 80 },
    ],
    encoding: {
      x: "value",
      y: "set",
      xDomain: [0, 100],
      yDomain: categories,
    },
  });
  const matrix = chart({
    mark: "matrix",
    data: [
      { intersection: "I0", set: "A", active: true },
      { intersection: "I0", set: "B", active: false },
    ],
    width: 40,
    height: 40,
    encoding: {
      x: "intersection",
      group: "set",
      y: "active",
    },
  });

  stackX([bars, matrix]);

  assert.equal(matrix.element.padding.yInner, 0.22);
  assert.equal(matrix.element.padding.yOuter, 0.08);
  assert.equal(matrix.element.renderer.padding.yInner, 0.22);
  assert.equal(matrix.element.renderer.padding.yOuter, 0.08);
}
