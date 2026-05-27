import assert from "node:assert/strict";
import { Chart } from "../../src/chart.js";
import { DumbbellChartRenderer } from "../../src/mark/dumbbell.js";
import { ProportionalAreaChartRenderer } from "../../src/mark/pac.js";
import { createFakeSvg } from "../helpers/fake-svg.mjs";

function baseOptions(overrides = {}) {
  return {
    width: 120,
    height: 60,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    encoding: { x: "count", y: "year" },
    ...overrides,
  };
}

{
  const svg = createFakeSvg();
  const renderer = new ProportionalAreaChartRenderer(baseOptions());

  const axisConfig = renderer.render(svg, [
    { year: "2000", count: 25 },
    { year: "2004", count: 100 },
  ]);

  const circles = svg.querySelectorAll("circle");
  const smallRadius = Number(circles[0].getAttribute("r"));
  const largeRadius = Number(circles[1].getAttribute("r"));

  assert.equal(circles.length, 2);
  assert.equal(largeRadius / smallRadius, 2);
  assert.ok(largeRadius <= 30);
  assert.deepEqual(axisConfig.scales.y.domain(), ["2000", "2004"]);
  assert.equal(typeof axisConfig.scales.y.bandwidth, "function");
}

{
  const svg = createFakeSvg();
  const renderer = new ProportionalAreaChartRenderer({
    ...baseOptions({
      shape: "square",
      encoding: { x: "year", y: "count" },
    }),
  });

  const axisConfig = renderer.render(svg, [
    { year: "2000", count: 0 },
    { year: "2004", count: 100 },
  ]);

  const rects = svg.querySelectorAll("rect");
  const firstSize = Number(rects[0].getAttribute("width"));
  const secondSize = Number(rects[1].getAttribute("width"));

  assert.equal(rects.length, 2);
  assert.equal(firstSize, 0);
  assert.equal(secondSize, Number(rects[1].getAttribute("height")));
  assert.ok(secondSize <= 60);
  assert.deepEqual(axisConfig.scales.x.domain(), ["2000", "2004"]);
  assert.equal(typeof axisConfig.scales.x.bandwidth, "function");
}

{
  const chart = new Chart({
    mark: "pac",
    data: [{ year: "2000", count: 100 }],
    encoding: { x: "count", y: "year" },
  });

  assert.equal(chart.mark, "pac");
}

{
  const svg = createFakeSvg();
  const renderer = new ProportionalAreaChartRenderer({
    width: 80,
    height: 100,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    encoding: { x: "count", y: "year" },
  });

  renderer.render(svg, [
    { year: "2000", count: 100 },
    { year: "2004", count: 100 },
    { year: "2008", count: 100 },
    { year: "2012", count: 100 },
  ]);

  const circles = svg.querySelectorAll("circle");
  const firstRadius = Number(circles[0].getAttribute("r"));
  const secondRadius = Number(circles[1].getAttribute("r"));
  const firstCenter = Number(circles[0].getAttribute("cy"));
  const secondCenter = Number(circles[1].getAttribute("cy"));

  assert.equal(firstRadius, secondRadius);
  assert.ok(secondCenter - firstCenter >= firstRadius + secondRadius);
  circles.forEach((circle) => {
    const cy = Number(circle.getAttribute("cy"));
    const r = Number(circle.getAttribute("r"));

    assert.ok(cy - r >= 0);
    assert.ok(cy + r <= 100);
  });
}

{
  const years = ["2000", "2004", "2008"];
  const padding = { yInner: 0.22, yOuter: 0.05 };
  const pacSvg = createFakeSvg();
  const dumbbellSvg = createFakeSvg();
  const pacRenderer = new ProportionalAreaChartRenderer({
    width: 50,
    height: 90,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    encoding: { x: "count", y: "year", yDomain: years },
    padding,
  });
  const dumbbellRenderer = new DumbbellChartRenderer({
    width: 120,
    height: 90,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    encoding: { x: "athletes", y: "year", xDomain: [0, 100], yDomain: years },
    padding,
  });

  const pacAxisConfig = pacRenderer.render(pacSvg, [
    { year: "2000", count: 20 },
    { year: "2004", count: 40 },
    { year: "2008", count: 80 },
  ]);
  const dumbbellAxisConfig = dumbbellRenderer.render(dumbbellSvg, [
    { year: "2000", athletes: 10 },
    { year: "2000", athletes: 20 },
    { year: "2004", athletes: 30 },
    { year: "2004", athletes: 40 },
    { year: "2008", athletes: 50 },
    { year: "2008", athletes: 60 },
  ]);

  const pacCenter =
    pacAxisConfig.scales.y("2004") + pacAxisConfig.scales.y.bandwidth() / 2;
  const dumbbellCenter =
    dumbbellAxisConfig.scales.y("2004") +
    dumbbellAxisConfig.scales.y.bandwidth() / 2;

  assert.equal(pacCenter, dumbbellCenter);
  assert.equal(pacSvg.querySelectorAll("circle")[1].getAttribute("cy"), "45");
}
