import assert from "node:assert/strict";
import { PieChartRenderer } from "../../src/mark/pie.js";
import { createFakeSvg } from "../helpers/fake-svg.mjs";

{
  const svg = createFakeSvg();
  const renderer = new PieChartRenderer({
    width: 100,
    height: 100,
    encoding: { category: "category", value: "value" },
    colorScheme: ["red", "blue"],
    showLabels: true,
  });

  const axisConfig = renderer.render(svg, [
    { category: "A", value: 1 },
    { category: "B", value: 2 },
  ]);

  const paths = svg.querySelectorAll("path");
  assert.equal(axisConfig, null);
  assert.equal(paths.length, 2);
  assert.equal(paths[0].getAttribute("fill"), "red");
  assert.equal(paths[1].getAttribute("fill"), "blue");
  assert.equal(paths[0].style.getPropertyValue("stroke-width"), "2px");
  assert.deepEqual(
    svg.querySelectorAll("text").map((text) => text.textContent),
    ["A", "B"],
  );
}

{
  const svg = createFakeSvg();
  const renderer = new PieChartRenderer({
    width: 100,
    height: 100,
    encoding: { category: "category", value: "value" },
  });

  renderer.render(svg, [
    { category: "A", value: 1 },
    { category: "B", value: 2 },
  ]);

  assert.equal(svg.querySelectorAll("path").length, 2);
  assert.equal(svg.querySelectorAll("text").length, 0);
}

{
  const svg = createFakeSvg();
  const renderer = new PieChartRenderer({
    width: 100,
    height: 100,
    innerRadius: 18,
    encoding: { category: "category", value: "value" },
  });

  renderer.render(svg, [
    { category: "A", value: 1 },
    { category: "B", value: 1 },
  ]);

  const firstPath = svg.querySelectorAll("path")[0].getAttribute("d");
  assert.match(firstPath, /A18,18/);
}
