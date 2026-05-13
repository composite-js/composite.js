import assert from "node:assert/strict";
import { Chart } from "../../src/chart.js";
import { DumbbellChartRenderer } from "../../src/mark/dumbbell.js";
import { createFakeSvg } from "../helpers/fake-svg.mjs";

function baseOptions(overrides = {}) {
  return {
    width: 120,
    height: 80,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    ...overrides,
  };
}

{
  const svg = createFakeSvg();
  const renderer = new DumbbellChartRenderer({
    ...baseOptions(),
    encoding: { x: "value", y: "year" },
    colors: ["#168aad", "#ff5a5f"],
    lineColor: "#b8c0ff",
  });

  const axisConfig = renderer.render(svg, [
    { year: "2000", value: 20 },
    { year: "2000", value: 80 },
    { year: "2004", value: 40 },
    { year: "2004", value: 100 },
  ]);

  const lines = svg.querySelectorAll("line");
  const circles = svg.querySelectorAll("circle");

  assert.equal(lines.length, 2);
  assert.equal(circles.length, 4);
  assert.equal(lines[0].getAttribute("y1"), lines[0].getAttribute("y2"));
  assert.notEqual(lines[0].getAttribute("x1"), lines[0].getAttribute("x2"));
  assert.equal(circles[0].getAttribute("fill"), "#168aad");
  assert.equal(circles[1].getAttribute("fill"), "#ff5a5f");
  assert.deepEqual(axisConfig.scales.y.domain(), ["2000", "2004"]);
  assert.equal(axisConfig.scales.x.domain()[0], 20);
  assert.equal(axisConfig.scales.x.domain()[1], 100);
}

{
  const svg = createFakeSvg();
  const renderer = new DumbbellChartRenderer({
    ...baseOptions({ direction: "horizontal" }),
    encoding: { x: "group", y: "score" },
  });

  const axisConfig = renderer.render(svg, [
    { group: "A", score: 10 },
    { group: "A", score: 30 },
    { group: "B", score: 20 },
    { group: "B", score: 40 },
  ]);

  const line = svg.querySelectorAll("line")[0];

  assert.equal(line.getAttribute("x1"), line.getAttribute("x2"));
  assert.notEqual(line.getAttribute("y1"), line.getAttribute("y2"));
  assert.deepEqual(axisConfig.scales.x.domain(), ["A", "B"]);
  assert.deepEqual(axisConfig.scales.y.domain(), [10, 40]);
}

{
  const svg = createFakeSvg();
  const renderer = new DumbbellChartRenderer({
    ...baseOptions(),
    encoding: { x: "value", y: "year" },
  });

  assert.throws(
    () =>
      renderer.render(svg, [
        { year: "2000", value: 20 },
        { year: "2000", value: 80 },
        { year: "2000", value: 100 },
      ]),
    /exactly two data points/i,
  );
}

{
  const chart = new Chart({
    mark: "dumbbell",
    data: [
      { year: "2000", value: 20 },
      { year: "2000", value: 80 },
    ],
    encoding: { x: "value", y: "year" },
  });

  assert.equal(chart.mark, "dumbbell");
}

{
  const svg = createFakeSvg();
  const renderer = new DumbbellChartRenderer({
    ...baseOptions({ xAxisPos: "top", yAxisPos: "right" }),
    encoding: {
      x: "value",
      y: "year",
      xDomain: [0, 120],
      yDomain: ["2004", "2000", "2008"],
    },
  });

  const axisConfig = renderer.render(svg, [
    { year: "2000", value: 20 },
    { year: "2000", value: 80 },
    { year: "2004", value: 40 },
    { year: "2004", value: 100 },
  ]);

  assert.deepEqual(axisConfig.scales.x.domain(), [0, 120]);
  assert.deepEqual(axisConfig.scales.y.domain(), ["2004", "2000", "2008"]);
  assert.deepEqual(axisConfig.scales.x.range(), [120, 0]);
  assert.deepEqual(axisConfig.scales.y.range(), [0, 80]);
}

{
  const svg = createFakeSvg();
  const renderer = new DumbbellChartRenderer({
    ...baseOptions({
      direction: "horizontal",
      xAxisPos: "top",
      yAxisPos: "right",
    }),
    encoding: {
      x: "group",
      y: "score",
      xDomain: ["B", "A", "C"],
      yDomain: [0, 50],
    },
  });

  const axisConfig = renderer.render(svg, [
    { group: "A", score: 10 },
    { group: "A", score: 30 },
    { group: "B", score: 20 },
    { group: "B", score: 40 },
  ]);

  assert.deepEqual(axisConfig.scales.x.domain(), ["B", "A", "C"]);
  assert.deepEqual(axisConfig.scales.y.domain(), [0, 50]);
  assert.deepEqual(axisConfig.scales.x.range(), [120, 0]);
  assert.deepEqual(axisConfig.scales.y.range(), [0, 80]);
}
