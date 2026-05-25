import assert from "node:assert/strict";
import * as api from "../../src/index.js";

const stableExports = [
  "assertLayoutNode",
  "chart",
  "custom",
  "embed",
  "frame",
  "image",
  "isLayoutNode",
  "repeat",
  "repeatX",
  "repeatY",
  "sequenceContainer",
  "stackX",
  "stackY",
  "text",
  "validateChartConfig",
].sort();

assert.deepEqual(
  Object.keys(api).sort(),
  stableExports,
  "src/index.js should expose only the stable user-facing API",
);

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
  "renderComputedLayout",
].forEach((name) => {
  assert.ok(!(name in api), `src/index.js should not export ${name}`);
});
