import assert from "node:assert/strict";
import { BarChartRenderer, StackBarChartRenderer } from "../../src/mark/bar.js";
import { createFakeSvg, findFirstElement } from "../helpers/fake-svg.mjs";

function baseOptions(overrides = {}) {
  return {
    width: 120,
    height: 80,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    ...overrides,
  };
}

{
  const svg = createFakeSvg();
  const renderer = new BarChartRenderer({
    ...baseOptions(),
    color: "steelblue",
    encoding: { x: "category", y: "value" },
  });

  renderer.render(svg, [{ category: "A", value: 10 }]);

  const rect = findFirstElement(svg, "rect");
  assert.ok(rect, "Expected renderer to create a bar rect");
  assert.equal(rect.getAttribute("fill"), "steelblue");

  rect.listeners.get("mouseenter").call(rect, {});
  assert.equal(rect.getAttribute("fill"), "orange");

  rect.listeners.get("mouseleave").call(rect, {});
  assert.equal(rect.getAttribute("fill"), "steelblue");
}

{
  const svg = createFakeSvg();
  const renderer = new BarChartRenderer({
    ...baseOptions({ direction: "horizontal", showLabels: true }),
    color: "tomato",
    encoding: { x: "value", y: "category" },
  });

  const axisConfig = renderer.render(svg, [
    { category: "A", value: 10 },
    { category: "B", value: 20 },
  ]);

  assert.equal(svg.querySelectorAll("rect").length, 2);
  assert.equal(svg.querySelectorAll("text").length, 2);
  assert.equal(axisConfig.scales.x.domain()[1], 20);
  assert.deepEqual(axisConfig.scales.y.domain(), ["A", "B"]);
  assert.equal(axisConfig.dimensions.width, 120);
}

{
  const svg = createFakeSvg();
  const renderer = new StackBarChartRenderer({
    ...baseOptions({ showLabels: true }),
    colorScheme: ["red", "blue"],
    encoding: { x: "value", y: "category", stack: "group" },
  });

  const axisConfig = renderer.render(svg, [
    { category: "A", group: "g1", value: 10 },
    { category: "A", group: "g2", value: 15 },
    { category: "B", group: "g1", value: 5 },
    { category: "B", group: "g2", value: 8 },
  ]);

  const rects = svg.querySelectorAll("rect");
  assert.equal(rects.length, 4);
  assert.ok(svg.querySelectorAll("text").length > 0);
  assert.deepEqual(axisConfig.scales.x.domain(), ["A", "B"]);
  assert.equal(axisConfig.scales.y.domain()[1], 25);

  rects[0].listeners.get("mouseenter").call(rects[0], {});
  assert.equal(rects[0].getAttribute("opacity"), "0.7");

  rects[0].listeners.get("mouseleave").call(rects[0], {});
  assert.equal(rects[0].getAttribute("opacity"), "1");
}

{
  const svg = createFakeSvg();
  const renderer = new StackBarChartRenderer({
    ...baseOptions({ direction: "horizontal", showLabels: true }),
    colorScheme: ["red", "blue"],
    encoding: { x: "value", y: "category", stack: "group" },
  });

  const axisConfig = renderer.render(svg, [
    { category: "A", group: "g1", value: 10 },
    { category: "A", group: "g2", value: 15 },
    { category: "B", group: "g1", value: 5 },
    { category: "B", group: "g2", value: 8 },
  ]);

  assert.equal(svg.querySelectorAll("rect").length, 4);
  assert.ok(svg.querySelectorAll("text").length > 0);
  assert.equal(axisConfig.scales.x.domain()[1], 25);
  assert.deepEqual(axisConfig.scales.y.domain(), ["A", "B"]);
}
