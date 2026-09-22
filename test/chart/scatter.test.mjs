import assert from "node:assert/strict";
import { ScatterChartRenderer } from "../../src/chart/type/scatter.js";
import { createFakeSvg } from "../helpers/fake-svg.mjs";

const svg = createFakeSvg();
const renderer = new ScatterChartRenderer({
  width: 100,
  height: 80,
  margin: { top: 0, right: 0, bottom: 0, left: 0 },
  color: "purple",
  radius: 5,
  encoding: { x: "x", y: "y" },
});

const axisConfig = renderer.render(svg, [
  { x: 1, y: 10 },
  { x: 2, y: 20 },
]);

const circles = svg.querySelectorAll("circle");
assert.equal(circles.length, 2);
assert.equal(circles[0].getAttribute("r"), "5");
assert.equal(circles[0].getAttribute("fill"), "purple");
assert.equal(
  circles[0].querySelectorAll("title")[0].textContent,
  "x: 1.00, y: 10.00",
);
assert.deepEqual(axisConfig.scales.x.domain(), [1, 2]);
assert.deepEqual(axisConfig.scales.y.domain(), [10, 20]);
assert.deepEqual(axisConfig.linkAnchors.channels, ["x", "y"]);
assert.deepEqual(axisConfig.linkAnchors.anchors[0], {
  x: 1,
  y: 10,
  left: { x: -5, y: 80 },
  right: { x: 5, y: 80 },
  top: { x: 0, y: 75 },
  bottom: { x: 0, y: 85 },
});

circles[0].listeners.get("mouseenter").call(circles[0], {});
assert.equal(circles[0].getAttribute("fill"), "orange");
assert.equal(circles[0].getAttribute("r"), "7.5");

circles[0].listeners.get("mouseleave").call(circles[0], {});
assert.equal(circles[0].getAttribute("fill"), "purple");
assert.equal(circles[0].getAttribute("r"), "5");

{
  const domainSvg = createFakeSvg();
  const domainRenderer = new ScatterChartRenderer({
    width: 100,
    height: 80,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    xAxisPos: "top",
    yAxisPos: "right",
    encoding: { x: "x", y: "y", xDomain: [0, 10], yDomain: [0, 30] },
  });

  const domainAxisConfig = domainRenderer.render(domainSvg, [
    { x: 1, y: 10 },
    { x: 2, y: 20 },
  ]);

  assert.deepEqual(domainAxisConfig.scales.x.domain(), [0, 10]);
  assert.deepEqual(domainAxisConfig.scales.y.domain(), [0, 30]);
  assert.deepEqual(domainAxisConfig.scales.x.range(), [100, 0]);
  assert.deepEqual(domainAxisConfig.scales.y.range(), [0, 80]);
}

{
  const roundedSvg = createFakeSvg();
  const roundedRenderer = new ScatterChartRenderer({
    width: 100,
    height: 80,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    mark: "scatter",
    markStyle: "rounded",
    color: "darkgreen",
    radius: 6,
    encoding: { x: "x", y: "y" },
  });

  roundedRenderer.render(roundedSvg, [
    { x: 1, y: 10 },
    { x: 2, y: 20 },
  ]);

  const circles = roundedSvg.querySelectorAll("circle");
  assert.equal(circles.length, 2);
  assert.equal(circles[0].getAttribute("r"), "6");
  assert.equal(circles[0].getAttribute("fill"), "darkgreen");
}
