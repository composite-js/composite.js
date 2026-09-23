import assert from "node:assert/strict";
import { LineChartRenderer } from "../../src/chart/type/line.js";
import { createFakeSvg } from "../helpers/fake-svg.mjs";

const svg = createFakeSvg();
const renderer = new LineChartRenderer({
  width: 120,
  height: 80,
  margin: { top: 0, right: 0, bottom: 0, left: 0 },
  encoding: { x: "year", y: "value" },
});

const axisConfig = renderer.render(svg, [
  { year: 2000, value: 10 },
  { year: 2004, value: 20 },
  { year: 2008, value: 15 },
]);

const paths = svg.querySelectorAll("path");
const circles = svg.querySelectorAll("circle");

assert.equal(paths.length, 1);
assert.ok(paths[0].getAttribute("d").startsWith("M"));
assert.equal(paths[0].getAttribute("stroke"), "steelblue");
assert.equal(circles.length, 3);
assert.equal(circles[0].querySelectorAll("title")[0].textContent, "2000: 10");
assert.deepEqual(axisConfig.scales.x.domain(), [2000, 2008]);
assert.deepEqual(axisConfig.scales.y.domain(), [0, 20]);

circles[0].listeners.get("mouseenter").call(circles[0], {});
assert.equal(circles[0].getAttribute("fill"), "orange");
assert.equal(circles[0].getAttribute("r"), "6");

circles[0].listeners.get("mouseleave").call(circles[0], {});
assert.equal(circles[0].getAttribute("fill"), "white");
assert.equal(circles[0].getAttribute("r"), "4");

for (const [curve, expected] of [
  ["step", /L60,40L60,0/],
  ["spline", /C/],
]) {
  const curveSvg = createFakeSvg();
  new LineChartRenderer({
    width: 120,
    height: 80,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    encoding: { x: "year", y: "value" },
    curve,
  }).render(curveSvg, [
    { year: 2000, value: 10 },
    { year: 2004, value: 20 },
    { year: 2008, value: 15 },
  ]);
  assert.match(
    curveSvg.querySelector(".line-series").getAttribute("d"),
    expected,
  );
}

{
  const domainSvg = createFakeSvg();
  const domainRenderer = new LineChartRenderer({
    width: 120,
    height: 80,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    xAxisPos: "top",
    yAxisPos: "right",
    encoding: {
      x: "year",
      y: "value",
      xDomain: [1996, 2012],
      yDomain: [0, 40],
    },
  });

  const domainAxisConfig = domainRenderer.render(domainSvg, [
    { year: 2000, value: 10 },
    { year: 2004, value: 20 },
    { year: 2008, value: 15 },
  ]);

  assert.deepEqual(domainAxisConfig.scales.x.domain(), [1996, 2012]);
  assert.deepEqual(domainAxisConfig.scales.y.domain(), [0, 40]);
  assert.deepEqual(domainAxisConfig.scales.x.range(), [120, 0]);
  assert.deepEqual(domainAxisConfig.scales.y.range(), [0, 80]);
}

{
  const groupedSvg = createFakeSvg();
  const groupedRenderer = new LineChartRenderer({
    width: 120,
    height: 80,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    colorScheme: ["#b36f4f", "#9cad5b"],
    padding: { xInner: 0.2, xOuter: 0.1 },
    encoding: {
      x: "quarter",
      y: "value",
      group: "series",
      xDomain: ["Q1", "Q2"],
      yDomain: [0, 40],
      groupDomain: ["Base", "Total"],
    },
  });

  const groupedAxisConfig = groupedRenderer.render(groupedSvg, [
    { quarter: "Q1", series: "Base", value: 10 },
    { quarter: "Q2", series: "Base", value: 20 },
    { quarter: "Q1", series: "Total", value: 30 },
    { quarter: "Q2", series: "Total", value: 25 },
  ]);

  const series = groupedSvg.querySelectorAll(".line-series");
  assert.equal(series.length, 2);
  assert.equal(series[0].getAttribute("stroke"), "#b36f4f");
  assert.equal(series[1].getAttribute("stroke"), "#9cad5b");
  assert.equal(groupedSvg.querySelectorAll(".line-point").length, 4);
  assert.deepEqual(groupedAxisConfig.scales.x.domain(), ["Q1", "Q2"]);
  assert.deepEqual(groupedAxisConfig.scales.y.domain(), [0, 40]);
  assert.equal(
    groupedSvg.querySelectorAll("title")[0].textContent,
    "Q1 - Base: 10",
  );
}
