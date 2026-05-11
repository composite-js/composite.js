import assert from "node:assert/strict";
import { BarChartRenderer } from "../../src/marks/bar.js";
import { createFakeSvg, findFirstElement } from "../helpers/fake-svg.mjs";

{
  const svg = createFakeSvg();
  const renderer = new BarChartRenderer({
    width: 120,
    height: 80,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
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
