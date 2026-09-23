import assert from "node:assert/strict";
import { Chart } from "../../src/chart/chart.js";
import { createFakeSvg } from "../helpers/fake-svg.mjs";

function render(mark, data, encoding) {
  const svg = createFakeSvg();
  const axes = new Chart({
    mark,
    data,
    encoding,
    width: 120,
    height: 80,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  }).render(svg);
  return { svg, axes };
}

function containsValues(domain, values) {
  assert.ok(domain[0] <= Math.min(...values));
  assert.ok(domain[1] >= Math.max(...values));
}

{
  const { svg, axes } = render(
    "scatter",
    [
      { x: -2, y: 3 },
      { x: 4, y: -5 },
    ],
    { x: "x", y: "y" },
  );
  containsValues(axes.scales.x.domain(), [-2, 4]);
  containsValues(axes.scales.y.domain(), [-5, 3]);
  assert.equal(svg.querySelectorAll("circle").length, 2);
}

{
  const { svg, axes } = render(
    "bubble",
    [
      { x: -2, y: 3, size: 4 },
      { x: 4, y: -5, size: 9 },
    ],
    { x: "x", y: "y", size: "size" },
  );
  containsValues(axes.scales.x.domain(), [-2, 4]);
  containsValues(axes.scales.y.domain(), [-5, 3]);
  assert.equal(svg.querySelectorAll("circle").length, 2);
}

for (const encoding of [
  { x: "value", y: "category" },
  { x: "category", y: "value" },
]) {
  const { svg, axes } = render(
    "dumbbell",
    [
      { category: "A", value: -4 },
      { category: "A", value: 6 },
    ],
    encoding,
  );
  const scale = encoding.x === "value" ? axes.scales.x : axes.scales.y;
  containsValues(scale.domain(), [-4, 6]);
  assert.equal(svg.querySelectorAll("circle").length, 2);
  assert.equal(
    svg
      .querySelectorAll("line")
      .filter((line) => line.getAttribute("stroke") === "#b8c0ff").length,
    1,
  );
}

{
  const { svg, axes } = render(
    "candlestick",
    [
      { period: -2, open: -3, high: 1, low: -5, close: -1 },
      { period: 2, open: -1, high: 2, low: -4, close: -3 },
    ],
    { x: "period", open: "open", high: "high", low: "low", close: "close" },
  );
  containsValues(axes.scales.x.domain(), [-2, 2]);
  containsValues(axes.scales.y.domain(), [-5, 2]);
  assert.equal(svg.querySelectorAll(".candlestick-body").length, 2);
  assert.equal(svg.querySelectorAll(".candlestick-wick").length, 2);
}

for (const mark of ["line", "area"]) {
  const { svg, axes } = render(
    mark,
    [
      { x: -2, y: 3 },
      { x: 4, y: 5 },
    ],
    { x: "x", y: "y" },
  );
  containsValues(axes.scales.x.domain(), [-2, 4]);
  assert.deepEqual(axes.scales.y.domain(), [0, 5]);
  assert.equal(svg.querySelectorAll("circle").length, 2);
}
