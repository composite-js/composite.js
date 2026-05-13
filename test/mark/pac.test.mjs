import assert from "node:assert/strict";
import { Chart } from "../../src/chart.js";
import { ProportionalAreaChartRenderer } from "../../src/mark/pac.js";
import { createFakeSvg } from "../helpers/fake-svg.mjs";

function baseOptions(overrides = {}) {
  return {
    width: 120,
    height: 60,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    encoding: { category: "year", value: "count" },
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
}

{
  const svg = createFakeSvg();
  const renderer = new ProportionalAreaChartRenderer({
    ...baseOptions({ shape: "square", direction: "horizontal" }),
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
}

{
  const chart = new Chart({
    mark: "pac",
    data: [{ year: "2000", count: 100 }],
    encoding: { category: "year", value: "count" },
  });

  assert.equal(chart.mark, "pac");
}

{
  const svg = createFakeSvg();
  const renderer = new ProportionalAreaChartRenderer({
    width: 80,
    height: 100,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    encoding: { category: "year", value: "count" },
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

  assert.equal(firstRadius, 40);
  assert.equal(secondRadius, 40);
  assert.ok(secondCenter - firstCenter < firstRadius + secondRadius);
  circles.forEach((circle) => {
    const cy = Number(circle.getAttribute("cy"));
    const r = Number(circle.getAttribute("r"));

    assert.ok(cy - r >= 0);
    assert.ok(cy + r <= 100);
  });
}
