import assert from "node:assert/strict";
import { LineChartRenderer } from "../../src/mark/line.js";
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
