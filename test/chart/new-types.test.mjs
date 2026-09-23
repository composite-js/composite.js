import assert from "node:assert/strict";
import { Chart } from "../../src/chart/chart.js";
import { createFakeSvg } from "../helpers/fake-svg.mjs";

const margin = { top: 0, right: 0, bottom: 0, left: 0 };

{
  const svg = createFakeSvg();
  const axes = new Chart({
    mark: "lollipop",
    data: [
      { category: "A", value: 4 },
      { category: "B", value: 8 },
    ],
    encoding: { x: "category", y: "value" },
    width: 100,
    height: 80,
    margin,
  }).render(svg);
  assert.equal(svg.querySelectorAll(".lollipop-stem").length, 2);
  assert.equal(svg.querySelectorAll("circle").length, 2);
  assert.deepEqual(axes.scales.y.domain(), [0, 8]);
  assert.equal(
    svg.querySelector("circle").querySelector("title").textContent,
    "A: 4",
  );
}

{
  const svg = createFakeSvg();
  const axes = new Chart({
    mark: "lollipop",
    data: [{ category: "A", value: 4 }],
    encoding: { x: "value", y: "category" },
    width: 100,
    height: 80,
    margin,
  }).render(svg);
  assert.deepEqual(axes.scales.x.domain(), [0, 4]);
  assert.equal(svg.querySelectorAll(".lollipop-stem").length, 1);
}

{
  const svg = createFakeSvg();
  new Chart({
    mark: "lollipop",
    data: [
      { category: "A", value: 4 },
      { category: "B", value: 8 },
    ],
    encoding: { x: "value", y: "category" },
    width: 100,
    height: 80,
    margin,
  }).render(svg);
  const dots = svg.querySelectorAll("circle");
  assert.ok(
    Number(dots[0].getAttribute("cy")) < Number(dots[1].getAttribute("cy")),
  );
}

{
  const svg = createFakeSvg();
  new Chart({
    mark: "waffle",
    data: [
      { category: "A", value: 1 },
      { category: "B", value: 2 },
    ],
    encoding: { x: "category", y: "value" },
    width: 120,
    height: 100,
    margin,
  }).render(svg);
  const cells = svg.querySelectorAll("rect");
  assert.equal(cells.length, 100);
  assert.equal(cells[0].getAttribute("width"), cells[0].getAttribute("height"));
  assert.equal(
    cells.filter((cell) => cell.querySelector("title")?.textContent === "A: 1")
      .length,
    33,
  );
  assert.equal(
    cells.filter((cell) => cell.querySelector("title")?.textContent === "B: 2")
      .length,
    67,
  );
}

{
  const svg = createFakeSvg();
  const axes = new Chart({
    mark: "heatmap",
    data: [
      { column: "A", row: "R1", value: -2 },
      { column: "B", row: "R1", value: 2 },
      { column: "A", row: "R2", value: 0 },
    ],
    encoding: { x: "column", group: "row", y: "value" },
    width: 100,
    height: 80,
    margin,
  }).render(svg);
  const cells = svg.querySelectorAll("rect");
  assert.equal(cells.length, 3);
  assert.notEqual(cells[0].getAttribute("fill"), cells[1].getAttribute("fill"));
  assert.deepEqual(axes.scales.x.domain(), ["A", "B"]);
  assert.deepEqual(axes.scales.y.domain(), ["R1", "R2"]);
}

{
  const svg = createFakeSvg();
  const axes = new Chart({
    mark: "histogram",
    data: [{ value: -2 }, { value: -1 }, { value: 0 }, { value: 2 }],
    encoding: { x: "value" },
    binCount: 2,
    width: 100,
    height: 80,
    margin,
  }).render(svg);
  const bins = svg.querySelectorAll("rect");
  assert.equal(bins.length, 2);
  assert.deepEqual(
    bins.map((bin) => bin.querySelector("title")?.textContent),
    ["-2–0: 2", "0–2: 2"],
  );
  assert.deepEqual(axes.scales.x.domain(), [-2, 2]);
  assert.deepEqual(axes.scales.y.domain(), [0, 2]);
}

assert.throws(
  () =>
    new Chart({
      mark: "line",
      data: [{ x: 1, y: 2 }],
      encoding: { x: "x", y: "y" },
      curve: "unknown",
    }),
  /curve for mark/,
);
assert.throws(
  () =>
    new Chart({
      mark: "waffle",
      data: [{ x: "A", y: 0 }],
      encoding: { x: "x", y: "y" },
    }),
  /sum to more than zero/,
);
assert.throws(
  () =>
    new Chart({
      mark: "histogram",
      data: [{ x: 1 }],
      encoding: { x: "x" },
      binCount: 0,
    }),
  /positive integer/,
);
