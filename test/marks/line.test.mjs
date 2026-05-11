import assert from "node:assert/strict";
import { LineChartRenderer } from "../../src/marks/line.js";
import { createFakeSvg } from "../helpers/fake-svg.mjs";

const svg = createFakeSvg();
const renderer = new LineChartRenderer({
  width: 120,
  height: 80,
  margin: { top: 0, right: 0, bottom: 0, left: 0 },
  encoding: { x: "period", y: "value" },
});

const axisConfig = renderer.render(svg, [
  { period: "Q1", value: 10 },
  { period: "Q2", value: 20 },
  { period: "Q3", value: 15 },
]);

const paths = svg.querySelectorAll("path");
const circles = svg.querySelectorAll("circle");

assert.equal(paths.length, 1);
assert.ok(paths[0].getAttribute("d").startsWith("M"));
assert.equal(paths[0].getAttribute("stroke"), "steelblue");
assert.equal(circles.length, 3);
assert.equal(circles[0].querySelectorAll("title")[0].textContent, "Q1: 10");
assert.deepEqual(axisConfig.scales.x.domain(), ["Q1", "Q2", "Q3"]);
assert.deepEqual(axisConfig.scales.y.domain(), [0, 20]);

circles[0].listeners.get("mouseenter").call(circles[0], {});
assert.equal(circles[0].getAttribute("fill"), "orange");
assert.equal(circles[0].getAttribute("r"), "6");

circles[0].listeners.get("mouseleave").call(circles[0], {});
assert.equal(circles[0].getAttribute("fill"), "white");
assert.equal(circles[0].getAttribute("r"), "4");
