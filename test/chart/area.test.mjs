import assert from "node:assert/strict";
import { AreaChartRenderer } from "../../src/chart/type/area.js";
import { createFakeSvg } from "../helpers/fake-svg.mjs";

const svg = createFakeSvg();
const renderer = new AreaChartRenderer({
  width: 120,
  height: 80,
  margin: { top: 0, right: 0, bottom: 0, left: 0 },
  encoding: {
    x: "year",
    y: "age",
    xDomain: [1900, 2020],
    yDomain: [0, 100],
  },
  color: "teal",
  fillOpacity: 0.35,
  strokeWidth: 3,
});

const axisConfig = renderer.render(svg, [
  { year: 1980, age: 62 },
  { year: 1920, age: 51 },
  { year: 1960, age: 58 },
]);

const paths = svg.querySelectorAll("path");
const circles = svg.querySelectorAll("circle");

assert.equal(paths.length, 2);
assert.ok(paths[0].getAttribute("d").startsWith("M"));
assert.equal(paths[0].getAttribute("fill"), "teal");
assert.equal(paths[0].getAttribute("fill-opacity"), "0.35");
assert.equal(paths[1].getAttribute("fill"), "none");
assert.equal(paths[1].getAttribute("stroke"), "teal");
assert.equal(paths[1].getAttribute("stroke-width"), "3");
assert.equal(circles.length, 3);
assert.equal(circles[0].querySelectorAll("title")[0].textContent, "1920: 51");
assert.deepEqual(axisConfig.scales.x.domain(), [1900, 2020]);
assert.deepEqual(axisConfig.scales.y.domain(), [0, 100]);

circles[0].listeners.get("mouseenter").call(circles[0], {});
assert.equal(circles[0].getAttribute("fill"), "orange");
assert.equal(circles[0].getAttribute("r"), "6");

circles[0].listeners.get("mouseleave").call(circles[0], {});
assert.equal(circles[0].getAttribute("fill"), "white");
assert.equal(circles[0].getAttribute("r"), "4");

{
  const reversedSvg = createFakeSvg();
  const reversedRenderer = new AreaChartRenderer({
    width: 120,
    height: 80,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    xAxisPos: "top",
    yAxisPos: "right",
    encoding: {
      x: "year",
      y: "age",
      xDomain: [1900, 2020],
      yDomain: [0, 100],
    },
  });

  const reversedAxisConfig = reversedRenderer.render(reversedSvg, [
    { year: 1980, age: 62 },
    { year: 1920, age: 51 },
    { year: 1960, age: 58 },
  ]);

  assert.deepEqual(reversedAxisConfig.scales.x.range(), [120, 0]);
  assert.deepEqual(reversedAxisConfig.scales.y.range(), [0, 80]);
}
