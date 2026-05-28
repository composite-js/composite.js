import assert from "node:assert/strict";
import { BubbleChartRenderer } from "../../src/mark/bubble.js";
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

{
  const svg = createFakeSvg();
  const renderer = new BubbleChartRenderer({
    width: 100,
    height: 80,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    xAxisPos: "top",
    yAxisPos: "right",
    encoding: {
      x: "category",
      y: "group",
      xDomain: ["B", "A", "C"],
      yDomain: ["South", "North", "West"],
    },
  });

  const axisConfig = renderer.render(svg, [
    { category: "A", group: "North" },
    { category: "B", group: "South" },
  ]);

  assert.deepEqual(axisConfig.scales.x.domain(), ["B", "A", "C"]);
  assert.deepEqual(axisConfig.scales.y.domain(), ["South", "North", "West"]);
  assert.deepEqual(axisConfig.scales.x.range(), [100, 0]);
  assert.deepEqual(axisConfig.scales.y.range(), [0, 80]);
}

{
  const svg = createFakeSvg();
  const renderer = new BubbleChartRenderer({
    width: 100,
    height: 80,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    mark: "bubble",
    markStyle: "sketch",
    color: "green",
    maxRadius: 20,
    encoding: { x: "x", y: "y", size: "size" },
  });

  renderer.render(svg, [
    { x: 1, y: 10, size: 25 },
    { x: 2, y: 20, size: 100 },
  ]);

  const sketchGroups = svg
    .querySelectorAll("g")
    .filter((node) => node.getAttribute("data-mark-style") === "sketch");
  const paths = svg.querySelectorAll("path");
  assert.equal(svg.querySelectorAll("circle").length, 0);
  assert.equal(sketchGroups.length, 2);
  assert.ok(paths.length > 2);
  assert.match(
    sketchGroups[0].querySelectorAll("path")[0].getAttribute("d"),
    /[MLC]/,
  );
  assert.equal(
    sketchGroups[0].querySelectorAll("path")[0].getAttribute("stroke"),
    "green",
  );

  sketchGroups[0].listeners.get("mouseenter").call(sketchGroups[0], {});
  assert.equal(
    sketchGroups[0].querySelectorAll("path")[0].getAttribute("stroke"),
    "orange",
  );
}
