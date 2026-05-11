import assert from "node:assert/strict";
import { ScatterChartRenderer } from "../../src/marks/scatter.js";
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
assert.equal(circles[0].querySelectorAll("title")[0].textContent, "x: 1.00, y: 10.00");
assert.deepEqual(axisConfig.scales.x.domain(), [1, 2]);
assert.deepEqual(axisConfig.scales.y.domain(), [10, 20]);

circles[0].listeners.get("mouseenter").call(circles[0], {});
assert.equal(circles[0].getAttribute("fill"), "orange");
assert.equal(circles[0].getAttribute("r"), "7.5");

circles[0].listeners.get("mouseleave").call(circles[0], {});
assert.equal(circles[0].getAttribute("fill"), "purple");
assert.equal(circles[0].getAttribute("r"), "5");
