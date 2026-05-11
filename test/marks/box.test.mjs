import assert from "node:assert/strict";
import { BoxPlotRenderer } from "../../src/marks/box.js";
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
    direction: "horizontal",
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
