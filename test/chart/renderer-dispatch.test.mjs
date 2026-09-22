import assert from "node:assert/strict";
import { Chart } from "../../src/chart/chart.js";
import { CHART_TYPE_REGISTRY } from "../../src/chart/registry.js";
import * as renderers from "../../src/chart/type/index.js";

const rendererByMark = {
  area: "AreaChartRenderer",
  bar: "BarChartRenderer",
  box: "BoxPlotRenderer",
  bubble: "BubbleChartRenderer",
  dumbbell: "DumbbellChartRenderer",
  flow: "FlowDiagramRenderer",
  groupbar: "GroupBarChartRenderer",
  line: "LineChartRenderer",
  matrix: "MatrixChartRenderer",
  pac: "ProportionalAreaChartRenderer",
  pie: "PieChartRenderer",
  scatter: "ScatterChartRenderer",
  stackbar: "StackBarChartRenderer",
  stream: "StreamGraphRenderer",
};

const configByMark = {
  area: {
    mark: "area",
    data: [
      { x: 1, y: 2 },
      { x: 2, y: 4 },
    ],
    encoding: { x: "x", y: "y" },
  },
  bar: {
    mark: "bar",
    data: [{ category: "A", value: 4 }],
    encoding: { x: "category", y: "value" },
  },
  box: {
    mark: "box",
    data: [
      { category: "A", value: 1 },
      { category: "A", value: 3 },
    ],
    encoding: { x: "category", y: "value" },
  },
  bubble: {
    mark: "bubble",
    data: [{ x: 1, y: 2, size: 3 }],
    encoding: { x: "x", y: "y", size: "size" },
  },
  dumbbell: {
    mark: "dumbbell",
    data: [
      { category: "A", value: 1 },
      { category: "A", value: 3 },
    ],
    encoding: { x: "value", y: "category" },
  },
  flow: {
    mark: "flow",
    data: [{ source: "A", target: "B", value: 4 }],
    encoding: { x: "source", group: "target", y: "value" },
  },
  groupbar: {
    mark: "groupbar",
    data: [
      { category: "A", group: "g1", value: 4 },
      { category: "A", group: "g2", value: 2 },
    ],
    encoding: { x: "category", y: "value", group: "group" },
  },
  line: {
    mark: "line",
    data: [
      { x: 1, y: 2 },
      { x: 2, y: 4 },
    ],
    encoding: { x: "x", y: "y" },
  },
  matrix: {
    mark: "matrix",
    data: [{ column: "C1", row: "R1", active: true }],
    encoding: { x: "column", group: "row", y: "active" },
  },
  pac: {
    mark: "pac",
    data: [{ category: "A", value: 4 }],
    encoding: { x: "category", y: "value" },
  },
  pie: {
    mark: "pie",
    data: [{ category: "A", value: 4 }],
    encoding: { x: "category", y: "value" },
  },
  scatter: {
    mark: "scatter",
    data: [{ x: 1, y: 2 }],
    encoding: { x: "x", y: "y" },
  },
  stackbar: {
    mark: "stackbar",
    data: [
      { category: "A", group: "g1", value: 4 },
      { category: "A", group: "g2", value: 2 },
    ],
    encoding: { x: "category", y: "value", group: "group" },
  },
  stream: {
    mark: "stream",
    data: [
      { period: "Q1", series: "A", value: 4 },
      { period: "Q1", series: "B", value: 2 },
    ],
    encoding: { x: "period", y: "value", group: "series" },
  },
};

assert.deepEqual(
  Object.keys(CHART_TYPE_REGISTRY).sort(),
  Object.keys(rendererByMark).sort(),
  "every registered mark should have a renderer dispatch test",
);

Object.entries(CHART_TYPE_REGISTRY).forEach(([mark, definition]) => {
  assert.equal(definition.renderer, rendererByMark[mark]);
  assert.equal(typeof renderers[definition.renderer], "function");
  assert.ok(definition.encoding.requiredEncoding.length > 0);
  assert.ok(definition.sharedDomain);
});

Object.entries(rendererByMark).forEach(([mark, rendererName]) => {
  const chart = new Chart(configByMark[mark]);

  assert.equal(
    chart.renderer.constructor.name,
    rendererName,
    `${mark} should dispatch to ${rendererName}`,
  );
});

for (const padding of [0.25, 0]) {
  const chart = new Chart({
    ...configByMark.bar,
    padding,
  });
  const expected = {
    inner: padding,
    outer: padding,
    xInner: padding,
    xOuter: padding,
    yInner: padding,
    yOuter: padding,
  };

  assert.deepEqual(chart.padding, expected);
  assert.deepEqual(chart.renderer.padding, expected);
}

{
  const chart = new Chart({
    ...configByMark.bar,
    padding: { inner: 0.2, outer: 0.05, xInner: 0.3 },
  });

  assert.deepEqual(chart.padding, {
    inner: 0.2,
    outer: 0.05,
    xInner: 0.3,
    xOuter: 0.05,
    yInner: 0.2,
    yOuter: 0.05,
  });
}
