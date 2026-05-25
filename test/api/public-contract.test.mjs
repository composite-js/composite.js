import assert from "node:assert/strict";
import * as api from "../../src/index.js";

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

Object.entries(rendererByMark).forEach(([mark, rendererName]) => {
  const chart = new api.Chart(configByMark[mark]);

  assert.equal(
    chart.renderer.constructor.name,
    rendererName,
    `${mark} should dispatch to ${rendererName}`,
  );
});

[
  "AreaChartRenderer",
  "AxisRenderer",
  "BBox",
  "BarChartRenderer",
  "BoxPlotRenderer",
  "BubbleChartRenderer",
  "Chart",
  "Composition",
  "DirectionlessRepeat",
  "DumbbellChartRenderer",
  "Embedded",
  "FlowDiagramRenderer",
  "Frame",
  "GroupBarChartRenderer",
  "LayoutCalculator",
  "LayoutEngine",
  "LayoutRenderer",
  "LineChartRenderer",
  "MARK_DEFINITIONS",
  "MarkRenderer",
  "MatrixChartRenderer",
  "Node",
  "PieChartRenderer",
  "ProportionalAreaChartRenderer",
  "Repeat",
  "RepeatX",
  "RepeatY",
  "ScatterChartRenderer",
  "Stack",
  "StackBarChartRenderer",
  "StreamGraphRenderer",
  "assertLayoutNode",
  "chart",
  "embed",
  "frame",
  "image",
  "isLayoutNode",
  "repeat",
  "repeatX",
  "repeatY",
  "renderComputedLayout",
  "sequenceContainer",
  "stackX",
  "stackY",
  "text",
  "validateChartConfig",
].forEach((name) => {
  assert.ok(name in api, `src/index.js should export ${name}`);
});
