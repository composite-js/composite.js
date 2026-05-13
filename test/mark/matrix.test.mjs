import assert from "node:assert/strict";
import { MatrixChartRenderer } from "../../src/mark/matrix.js";
import { createFakeSvg } from "../helpers/fake-svg.mjs";

{
  const svg = createFakeSvg();
  const renderer = new MatrixChartRenderer({
    width: 90,
    height: 60,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    encoding: { x: "id", y: "sets", yDomain: ["B", "A", "C"] },
  });

  const axisConfig = renderer.render(svg, [
    { id: "i1", sets: ["A", "C"] },
    { id: "i2", sets: ["B"] },
  ]);

  const circles = svg.querySelectorAll("circle");
  const lines = svg.querySelectorAll("line");
  const stripes = svg.querySelectorAll("rect");

  assert.equal(axisConfig, null);
  assert.equal(circles.length, 6);
  assert.equal(lines.length, 1);
  assert.equal(stripes.length, 2);
  assert.equal(circles[0].getAttribute("fill"), "#e0e0e0");
  assert.equal(circles[1].getAttribute("fill"), "black");
  assert.equal(circles[2].getAttribute("fill"), "black");
}

{
  const svg = createFakeSvg();
  const renderer = new MatrixChartRenderer({
    width: 90,
    height: 60,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    stripe: false,
    encoding: { x: "id", y: "sets" },
  });

  renderer.render(svg, [
    { id: "i1", sets: ["B", "A"] },
    { id: "i2", sets: ["C"] },
  ]);

  assert.equal(svg.querySelectorAll("rect").length, 0);
  assert.equal(svg.querySelectorAll("circle").length, 6);
}
