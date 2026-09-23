import assert from "node:assert/strict";
import { chart, stackX, stackY, computeLayout } from "../../src/index.js";

const measurementAdapter = {
  measureMargin: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
};
function resolved(layout, spec) {
  return layout.children.find((child) => child.spec === spec).element;
}

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

  const computed = computeLayout(stackX([bars, pac]), { measurementAdapter });

  assert.equal(resolved(computed, pac).padding.yInner, 0.22);
  assert.equal(resolved(computed, pac).padding.yOuter, 0.08);
  assert.equal(resolved(computed, pac)._createRenderer().padding.yInner, 0.22);
  assert.equal(resolved(computed, pac)._createRenderer().padding.yOuter, 0.08);
  assert.equal(resolved(computed, pac).options.padding, undefined);
}

{
  const bars = horizontalBars({ padding: 0 });
  const pac = verticalPac();

  const computed = computeLayout(stackX([bars, pac]), { measurementAdapter });

  assert.equal(resolved(computed, bars).padding.yInner, 0);
  assert.equal(resolved(computed, bars).padding.yOuter, 0);
  assert.equal(resolved(computed, pac).padding.yInner, 0);
  assert.equal(resolved(computed, pac).padding.yOuter, 0);
  assert.equal(resolved(computed, pac)._createRenderer().padding.yInner, 0);
  assert.equal(resolved(computed, pac)._createRenderer().padding.yOuter, 0);
  assert.equal(resolved(computed, bars).options.padding, 0);
  assert.equal(resolved(computed, pac).options.padding, undefined);
}

{
  const bars = verticalBars();
  const pac = horizontalPac();

  const computed = computeLayout(stackY([bars, pac]), { measurementAdapter });

  assert.equal(resolved(computed, pac).padding.xInner, 0.31);
  assert.equal(resolved(computed, pac).padding.xOuter, 0.04);
  assert.equal(resolved(computed, pac)._createRenderer().padding.xInner, 0.31);
  assert.equal(resolved(computed, pac)._createRenderer().padding.xOuter, 0.04);
  assert.equal(resolved(computed, pac).options.padding, undefined);
}

{
  const bars = horizontalBars();
  const pac = verticalPac({
    padding: { yInner: 0.4 },
  });

  const computed = computeLayout(stackX([bars, pac]), { measurementAdapter });

  assert.equal(resolved(computed, pac).padding.yInner, 0.4);
  assert.equal(resolved(computed, pac).padding.yOuter, 0.08);
  assert.equal(resolved(computed, pac)._createRenderer().padding.yInner, 0.4);
  assert.equal(resolved(computed, pac)._createRenderer().padding.yOuter, 0.08);
  assert.deepEqual(resolved(computed, pac).options.padding, { yInner: 0.4 });
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

  const computed = computeLayout(stackX([bars, pac, box]), {
    measurementAdapter,
  });

  assert.equal(resolved(computed, pac).padding.yInner, 0.1);
  assert.equal(resolved(computed, pac).padding.yOuter, 0.08);
  assert.equal(resolved(computed, pac)._createRenderer().padding.yInner, 0.1);
  assert.equal(resolved(computed, pac)._createRenderer().padding.yOuter, 0.08);
}

{
  assert.throws(
    () =>
      horizontalBars({
        padding: { yInner: Infinity, yOuter: 0.08 },
      }),
    /padding\.yInner must be a finite number/,
  );
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

  const computed = computeLayout(stackX([bars, bubble]), {
    measurementAdapter,
  });

  assert.equal(resolved(computed, bubble).padding.yInner, 0.1);
  assert.equal(resolved(computed, bubble).padding.yOuter, 0.1);
  assert.equal(
    resolved(computed, bubble)._createRenderer().padding.yInner,
    0.1,
  );
  assert.equal(
    resolved(computed, bubble)._createRenderer().padding.yOuter,
    0.1,
  );
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

  const computed = computeLayout(stackX([bars, pac]), { measurementAdapter });

  assert.equal(resolved(computed, pac).padding.yInner, 0.1);
  assert.equal(resolved(computed, pac).padding.yOuter, 0.1);
  assert.equal(resolved(computed, pac)._createRenderer().padding.yInner, 0.1);
  assert.equal(resolved(computed, pac)._createRenderer().padding.yOuter, 0.1);
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

  const computed = computeLayout(stackX([bars, matrix]), {
    measurementAdapter,
  });

  assert.equal(resolved(computed, matrix).padding.yInner, 0.22);
  assert.equal(resolved(computed, matrix).padding.yOuter, 0.08);
  assert.equal(
    resolved(computed, matrix)._createRenderer().padding.yInner,
    0.22,
  );
  assert.equal(
    resolved(computed, matrix)._createRenderer().padding.yOuter,
    0.08,
  );
}
