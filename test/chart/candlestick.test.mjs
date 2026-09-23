import assert from "node:assert/strict";
import { CandlestickChartRenderer } from "../../src/chart/type/candlestick.js";
import { createFakeSvg } from "../helpers/fake-svg.mjs";

const svg = createFakeSvg();
const renderer = new CandlestickChartRenderer({
  width: 120,
  height: 80,
  margin: { top: 0, right: 0, bottom: 0, left: 0 },
  padding: { xInner: 0, xOuter: 0 },
  candleWidthRatio: 0.5,
  upColor: "#e11d48",
  downColor: "#16a34a",
  encoding: {
    x: "period",
    open: "open",
    high: "high",
    low: "low",
    close: "close",
    yDomain: [0, 20],
  },
});

const axisConfig = renderer.render(svg, [
  { period: "A", open: 10, high: 15, low: 8, close: 14 },
  { period: "B", open: 14, high: 16, low: 11, close: 12 },
]);

const wicks = svg.querySelectorAll(".candlestick-wick");
const bodies = svg.querySelectorAll(".candlestick-body");

assert.equal(wicks.length, 2);
assert.equal(bodies.length, 2);
assert.equal(wicks[0].getAttribute("stroke"), "#e11d48");
assert.equal(wicks[1].getAttribute("stroke"), "#16a34a");
assert.equal(bodies[0].getAttribute("data-direction"), "up");
assert.equal(bodies[1].getAttribute("data-direction"), "down");
assert.equal(bodies[0].getAttribute("x"), "15");
assert.equal(bodies[0].getAttribute("width"), "30");
assert.ok(Math.abs(Number(bodies[0].getAttribute("y")) - 24) < 1e-9);
assert.ok(Math.abs(Number(bodies[0].getAttribute("height")) - 16) < 1e-9);
assert.equal(
  bodies[0].querySelector("title").textContent,
  "A — open: 10, high: 15, low: 8, close: 14",
);
assert.deepEqual(axisConfig.scales.x.domain(), ["A", "B"]);
assert.deepEqual(axisConfig.scales.y.domain(), [0, 20]);

bodies[0].listeners.get("mouseenter").call(bodies[0], {});
assert.equal(bodies[0].getAttribute("fill"), "orange");
bodies[0].listeners.get("mouseleave").call(bodies[0], {});
assert.equal(bodies[0].getAttribute("fill"), "#e11d48");

{
  const numericSvg = createFakeSvg();
  const numericRenderer = new CandlestickChartRenderer({
    width: 100,
    height: 100,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    encoding: {
      x: "period",
      open: "open",
      high: "high",
      low: "low",
      close: "close",
    },
  });
  const numericAxis = numericRenderer.render(numericSvg, [
    { period: 1, open: 10, high: 15, low: 8, close: 14 },
    { period: 2, open: 14, high: 16, low: 11, close: 12 },
  ]);

  assert.deepEqual(numericAxis.scales.x.domain(), [1, 2]);
  assert.deepEqual(numericAxis.scales.y.domain(), [7.6, 16.4]);
}
