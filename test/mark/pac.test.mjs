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

{
  const svg = createFakeSvg();
  const renderer = new ProportionalAreaChartRenderer({
    ...baseOptions({
      padding: { yInner: 0, yOuter: 0 },
    }),
  });

  const axisConfig = renderer.render(svg, [
    { year: "2000", count: 25 },
    { year: "2004", count: 100 },
  ]);

  assert.deepEqual(axisConfig.linkAnchors.channels, ["y"]);
  assert.deepEqual(axisConfig.linkAnchors.anchors[0], {
    x: 25,
    y: "2000",
    left: { x: 52.5, y: 15 },
    right: { x: 67.5, y: 15 },
    top: { x: 60, y: 7.5 },
    bottom: { x: 60, y: 22.5 },
  });
}

{
  const svg = createFakeSvg();
  const renderer = new ProportionalAreaChartRenderer({
    ...baseOptions({
      encoding: { x: "year", y: "count" },
      padding: { xInner: 0, xOuter: 0 },
    }),
  });

  const axisConfig = renderer.render(svg, [
    { year: "2000", count: 0 },
    { year: "2004", count: 100 },
  ]);

  assert.deepEqual(axisConfig.linkAnchors.channels, ["x"]);
  assert.deepEqual(axisConfig.linkAnchors.anchors[1], {
    x: "2004",
    y: 100,
    left: { x: 60, y: 30 },
    right: { x: 120, y: 30 },
    top: { x: 90, y: 0 },
    bottom: { x: 90, y: 60 },
  });
}

{
  const svg = createFakeSvg();
  const renderer = new ProportionalAreaChartRenderer({
    ...baseOptions({
      mark: "pac",
      shape: "square",
      markStyle: "rounded",
      encoding: { x: "year", y: "count" },
      padding: { xInner: 0, xOuter: 0 },
    }),
  });

  renderer.render(svg, [
    { year: "2000", count: 25 },
    { year: "2004", count: 100 },
  ]);

  const rects = svg.querySelectorAll("rect");
  assert.equal(rects.length, 2);
  rects.forEach((rect) => {
    assert.ok(Number(rect.getAttribute("rx")) > 0);
    assert.equal(rect.getAttribute("rx"), rect.getAttribute("ry"));
  });
}

{
  const svg = createFakeSvg();
  const styleOptions = {};
  const contexts = [];
  const renderer = new ProportionalAreaChartRenderer({
    ...baseOptions({
      mark: "pac",
      markStyle: {
        options: styleOptions,
        circle(context) {
          contexts.push(context);
          return context.container
            .append("circle")
            .attr("cx", context.centerX)
            .attr("cy", context.centerY)
            .attr("r", context.radius)
            .attr("data-role", context.role);
        },
      },
    }),
  });
  const datum = { year: "2000", count: 100 };

  renderer.render(svg, [datum]);

  assert.equal(contexts.length, 1);
  assert.equal(contexts[0].container.node(), svg);
  assert.equal(contexts[0].datum, datum);
  assert.equal(contexts[0].value, 100);
  assert.equal(contexts[0].orientation, "horizontal");
  assert.equal(contexts[0].role, "pac-circle");
  assert.equal(contexts[0].mark, "pac");
  assert.equal(contexts[0].encoding, renderer.encoding);
  assert.equal(contexts[0].styleOptions, styleOptions);
  assert.equal(contexts[0].left, contexts[0].centerX - contexts[0].radius);
  assert.equal(contexts[0].top, contexts[0].centerY - contexts[0].radius);
  assert.equal(contexts[0].width, contexts[0].radius * 2);
  assert.equal(contexts[0].height, contexts[0].radius * 2);
  assert.equal(
    svg.querySelectorAll("circle")[0].getAttribute("data-role"),
    "pac-circle",
  );
}
