import assert from "node:assert/strict";
import { BoxPlotRenderer } from "../../src/mark/box.js";
import { createFakeSvg, findFirstElement } from "../helpers/fake-svg.mjs";

const data = [
  { category: "A", value: 1 },
  { category: "A", value: 2 },
  { category: "A", value: 3 },
  { category: "A", value: 4 },
  { category: "A", value: 100 },
  { category: "B", value: 2 },
  { category: "B", value: 3 },
  { category: "B", value: 4 },
  { category: "B", value: 5 },
  { category: "B", value: 6 },
];

{
  const svg = createFakeSvg();
  const renderer = new BoxPlotRenderer({
    width: 120,
    height: 80,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    color: "teal",
    encoding: { x: "category", y: "value" },
  });

  const axisConfig = renderer.render(svg, data);
  const rect = findFirstElement(svg, "rect");

  assert.equal(svg.querySelectorAll("rect").length, 2);
  assert.equal(svg.querySelectorAll("line").length, 8);
  assert.equal(svg.querySelectorAll("circle").length, 1);
  assert.ok(rect.querySelectorAll("title")[0].textContent.includes("Median"));
  assert.deepEqual(axisConfig.scales.x.domain(), ["A", "B"]);
  assert.deepEqual(axisConfig.scales.y.domain(), [0, 100]);

  rect.listeners.get("mouseenter").call(rect, {});
  assert.equal(rect.getAttribute("fill"), "orange");

  rect.listeners.get("mouseleave").call(rect, {});
  assert.equal(rect.getAttribute("fill"), "teal");
}

{
  const svg = createFakeSvg();
  const renderer = new BoxPlotRenderer({
    width: 120,
    height: 80,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    color: "teal",
    encoding: { x: "value", y: "category" },
  });

  const axisConfig = renderer.render(svg, data);

  assert.equal(svg.querySelectorAll("rect").length, 2);
  assert.equal(svg.querySelectorAll("line").length, 8);
  assert.equal(svg.querySelectorAll("circle").length, 1);
  assert.equal(axisConfig.scales.x.domain()[0], 0);
  assert.equal(axisConfig.scales.x.domain()[1], 100);
  assert.deepEqual(axisConfig.scales.y.domain(), ["A", "B"]);
}

{
  const svg = createFakeSvg();
  const renderer = new BoxPlotRenderer({
    width: 120,
    height: 80,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    color: "teal",
    whiskerStrokeDasharray: "3 3",
    outlierFill: "teal",
    outlierOpacity: 0.5,
    encoding: { x: "value", y: "category" },
  });

  renderer.render(svg, data);

  assert.equal(
    svg.querySelectorAll("line")[0].getAttribute("stroke-dasharray"),
    "3 3",
  );
  assert.equal(svg.querySelectorAll("circle")[0].getAttribute("fill"), "teal");
  assert.equal(
    svg.querySelectorAll("circle")[0].getAttribute("opacity"),
    "0.5",
  );
}

{
  const svg = createFakeSvg();
  const renderer = new BoxPlotRenderer({
    width: 120,
    height: 80,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    encoding: { x: "value", y: "category", xDomain: [0, 120] },
  });

  const axisConfig = renderer.render(svg, data);

  assert.deepEqual(axisConfig.scales.x.domain(), [0, 120]);
}

{
  const svg = createFakeSvg();
  const renderer = new BoxPlotRenderer({
    width: 120,
    height: 80,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    valueRangePadding: 5,
    encoding: { x: "value", y: "category", xDomain: [0, 100] },
  });

  renderer.render(svg, data);

  assert.equal(svg.querySelectorAll("circle")[0].getAttribute("cx"), "115");
}

{
  const svg = createFakeSvg();
  const renderer = new BoxPlotRenderer({
    width: 120,
    height: 80,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    xAxisPos: "top",
    yAxisPos: "right",
    encoding: {
      x: "category",
      y: "value",
      xDomain: ["B", "A", "C"],
      yDomain: [0, 120],
    },
  });

  const axisConfig = renderer.render(svg, data);

  assert.deepEqual(axisConfig.scales.x.domain(), ["B", "A", "C"]);
  assert.deepEqual(axisConfig.scales.y.domain(), [0, 120]);
  assert.deepEqual(axisConfig.scales.x.range(), [120, 0]);
  assert.deepEqual(axisConfig.scales.y.range(), [0, 80]);
  svg.querySelectorAll("rect").forEach((rect) => {
    assert.ok(Number(rect.getAttribute("width")) >= 0);
    assert.ok(Number(rect.getAttribute("height")) >= 0);
  });
}

{
  const svg = createFakeSvg();
  const renderer = new BoxPlotRenderer({
    width: 120,
    height: 80,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    xAxisPos: "top",
    yAxisPos: "right",
    encoding: {
      x: "value",
      y: "category",
      xDomain: [0, 120],
      yDomain: ["B", "A", "C"],
    },
  });

  const axisConfig = renderer.render(svg, data);

  assert.deepEqual(axisConfig.scales.x.domain(), [0, 120]);
  assert.deepEqual(axisConfig.scales.y.domain(), ["B", "A", "C"]);
  assert.deepEqual(axisConfig.scales.x.range(), [120, 0]);
  assert.deepEqual(axisConfig.scales.y.range(), [80, 0]);
  svg.querySelectorAll("rect").forEach((rect) => {
    assert.ok(Number(rect.getAttribute("width")) >= 0);
    assert.ok(Number(rect.getAttribute("height")) >= 0);
  });
}
