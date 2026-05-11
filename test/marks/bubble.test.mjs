import assert from "node:assert/strict";
import { BubbleChartRenderer } from "../../src/marks/bubble.js";
import { createFakeSvg } from "../helpers/fake-svg.mjs";

{
  const svg = createFakeSvg();
  const renderer = new BubbleChartRenderer({
    width: 100,
    height: 80,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    color: "green",
    maxRadius: 20,
    encoding: { x: "x", y: "y", size: "size" },
  });

  const axisConfig = renderer.render(svg, [
    { x: 1, y: 10, size: 25 },
    { x: 2, y: 20, size: 100 },
  ]);

  const circles = svg.querySelectorAll("circle");
  assert.equal(circles.length, 2);
  assert.equal(circles[1].getAttribute("r"), "20");
  assert.equal(
    circles[1].querySelectorAll("title")[0].textContent,
    "x: 2, y: 20, size: 100",
  );
  assert.equal(axisConfig.scales.x.domain()[0], 0.95);
  assert.equal(axisConfig.scales.x.domain()[1], 2.05);
  assert.equal(axisConfig.scales.y.domain()[0], 9.5);
  assert.equal(axisConfig.scales.y.domain()[1], 20.5);

  circles[0].listeners.get("mouseenter").call(circles[0], {});
  assert.equal(circles[0].getAttribute("fill"), "orange");

  circles[0].listeners.get("mouseleave").call(circles[0], {});
  assert.equal(circles[0].getAttribute("fill"), "green");
}

{
  const svg = createFakeSvg();
  const renderer = new BubbleChartRenderer({
    width: 100,
    height: 80,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    encoding: { x: "category", y: "group" },
  });

  const axisConfig = renderer.render(svg, [
    { category: "A", group: "North" },
    { category: "B", group: "South" },
  ]);

  const circles = svg.querySelectorAll("circle");
  assert.equal(circles.length, 2);
  assert.equal(circles[0].getAttribute("r"), "5");
  assert.deepEqual(axisConfig.scales.x.domain(), ["A", "B"]);
  assert.deepEqual(axisConfig.scales.y.domain(), ["North", "South"]);
}
