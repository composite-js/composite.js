import assert from "node:assert/strict";
import { Chart } from "../../src/chart/chart.js";
import { createFakeSvg } from "../helpers/fake-svg.mjs";

const margin = { top: 0, right: 0, bottom: 0, left: 0 };

function render(config) {
  const svg = createFakeSvg();
  const axes = new Chart({ width: 120, height: 80, margin, ...config }).render(
    svg,
  );
  return { svg, axes };
}

function assertVerticalBaseline(svg, axes, values) {
  const scale = axes.scales.y;
  const zero = scale(0);
  assert.deepEqual(scale.domain(), [
    Math.min(0, ...values),
    Math.max(0, ...values),
  ]);
  assert.equal(
    svg.querySelector(".x-axis").getAttribute("transform"),
    `translate(0, ${zero})`,
  );
  assert.equal(
    Number(svg.querySelector(".zero-baseline").getAttribute("y1")),
    zero,
  );
}

function categoryTick(svg, axisSelector, category) {
  return svg
    .querySelector(axisSelector)
    .querySelectorAll(".tick")
    .find((tick) => tick.querySelector("text").textContent === category);
}

for (const mark of ["bar", "groupbar", "stackbar"]) {
  const data = [
    { category: "Negative", group: "A", value: -3 },
    { category: "Positive", group: "A", value: 5 },
  ];
  const { svg, axes } = render({
    mark,
    data,
    encoding:
      mark === "bar"
        ? { x: "category", y: "value" }
        : { x: "category", y: "value", group: "group" },
  });
  assertVerticalBaseline(svg, axes, [-3, 5]);
  const zero = axes.scales.y(0);
  const rects = svg.querySelectorAll("rect");
  assert.equal(rects.length, 2);
  const negative = rects.find((rect) =>
    rect.querySelector("title").textContent.includes("Negative"),
  );
  const positive = rects.find((rect) =>
    rect.querySelector("title").textContent.includes("Positive"),
  );
  assert.ok(Number(negative.getAttribute("y")) >= zero);
  assert.ok(
    Number(positive.getAttribute("y")) +
      Number(positive.getAttribute("height")) <=
      zero,
  );

  const right = render({
    mark,
    yAxisPos: "right",
    data,
    encoding:
      mark === "bar"
        ? { x: "category", y: "value" }
        : { x: "category", y: "value", group: "group" },
  });
  assert.deepEqual(right.axes.scales.y.range(), [80, 0]);

  const negativeTick = categoryTick(svg, ".x-axis", "Negative");
  const positiveTick = categoryTick(svg, ".x-axis", "Positive");
  assert.equal(negativeTick.querySelector("line").getAttribute("y2"), "-6");
  assert.equal(negativeTick.querySelector("text").getAttribute("y"), "-9");
  assert.equal(positiveTick.querySelector("line").getAttribute("y2"), "6");
  assert.equal(positiveTick.querySelector("text").getAttribute("y"), "9");
}

{
  const { svg, axes } = render({
    mark: "stackbar",
    yAxisPos: "right",
    data: [
      { category: "Negative", group: "A", value: -3 },
      { category: "Positive", group: "A", value: 5 },
    ],
    encoding: { x: "category", y: "value", group: "group" },
  });
  assert.deepEqual(axes.scales.y.range(), [80, 0]);
  assertVerticalBaseline(svg, axes, [-3, 5]);
}

{
  const { svg, axes } = render({
    mark: "bar",
    xAxisPos: "top",
    data: [
      { category: "Negative", value: -3 },
      { category: "Positive", value: 5 },
    ],
    encoding: { x: "category", y: "value" },
  });
  assert.equal(
    svg.querySelector(".x-axis").getAttribute("transform"),
    "translate(0, 0)",
  );
  assert.equal(
    Number(svg.querySelector(".zero-baseline").getAttribute("y1")),
    axes.scales.y(0),
  );
}

for (const mark of ["bar", "stackbar"]) {
  const { svg, axes } = render({
    mark,
    data: [{ category: "Zero", group: "A", value: 0 }],
    encoding:
      mark === "bar"
        ? { x: "category", y: "value" }
        : { x: "category", y: "value", group: "group" },
  });
  assert.deepEqual(axes.scales.y.domain(), [0, 1]);
  assert.equal(
    svg.querySelector(".x-axis").getAttribute("transform"),
    "translate(0, 80)",
  );
}

for (const mark of ["bar", "groupbar", "stackbar"]) {
  const data = [
    { category: "负值组", group: "A", value: -3 },
    { category: "正值组", group: "A", value: 5 },
    { category: "含零组", group: "A", value: 0 },
  ];
  const { svg, axes } = render({
    mark,
    data,
    encoding:
      mark === "bar"
        ? { x: "value", y: "category" }
        : { x: "value", y: "category", group: "group" },
  });
  const categoryAxis = svg.querySelector(".y-axis");
  assert.equal(
    categoryAxis.getAttribute("transform"),
    `translate(${axes.scales.x(0)}, 0)`,
  );
  assert.equal(categoryAxis.querySelector(".domain"), null);
  const negativeTick = categoryTick(svg, ".y-axis", "负值组");
  const positiveTick = categoryTick(svg, ".y-axis", "正值组");
  assert.equal(negativeTick.querySelector("line").getAttribute("x2"), "6");
  assert.equal(negativeTick.querySelector("text").getAttribute("x"), "9");
  assert.equal(
    negativeTick.querySelector("text").getAttribute("text-anchor"),
    "start",
  );
  assert.equal(positiveTick.querySelector("line").getAttribute("x2"), "-6");
  assert.equal(positiveTick.querySelector("text").getAttribute("x"), "-9");
  assert.equal(
    positiveTick.querySelector("text").getAttribute("text-anchor"),
    "end",
  );
}

{
  const { svg, axes } = render({
    mark: "groupbar",
    data: [
      { category: "Both", group: "A", value: -4 },
      { category: "Both", group: "B", value: 6 },
    ],
    encoding: { x: "value", y: "category", group: "group" },
  });
  const tick = categoryTick(svg, ".y-axis", "Both");
  assert.equal(tick.querySelector("line").getAttribute("x2"), "0");
  assert.equal(
    Number(tick.querySelector("text").getAttribute("x")),
    -axes.scales.x(0) - 9,
  );
}

{
  const { svg, axes } = render({
    mark: "groupbar",
    data: [
      { category: "Both", group: "A", value: -4 },
      { category: "Both", group: "B", value: 6 },
    ],
    encoding: { x: "category", y: "value", group: "group" },
  });
  const tick = categoryTick(svg, ".x-axis", "Both");
  assert.equal(tick.querySelector("line").getAttribute("y2"), "0");
  assert.equal(
    Number(tick.querySelector("text").getAttribute("y")),
    80 - axes.scales.y(0) + 9,
  );
}

{
  const { svg } = render({
    mark: "bar",
    reverseX: true,
    data: [
      { category: "Negative", value: -3 },
      { category: "Positive", value: 5 },
    ],
    encoding: { x: "value", y: "category" },
  });
  assert.equal(
    categoryTick(svg, ".y-axis", "Positive")
      .querySelector("text")
      .getAttribute("x"),
    "9",
  );
  assert.equal(
    categoryTick(svg, ".y-axis", "Negative")
      .querySelector("text")
      .getAttribute("x"),
    "-9",
  );
}

{
  const { svg } = render({
    mark: "bar",
    reverseY: true,
    data: [
      { category: "Negative", value: -3 },
      { category: "Positive", value: 5 },
    ],
    encoding: { x: "category", y: "value" },
  });
  assert.equal(
    categoryTick(svg, ".x-axis", "Positive")
      .querySelector("text")
      .getAttribute("y"),
    "-9",
  );
  assert.equal(
    categoryTick(svg, ".x-axis", "Negative")
      .querySelector("text")
      .getAttribute("y"),
    "9",
  );
}

{
  const { svg, axes } = render({
    mark: "groupbar",
    data: [
      { category: "A", group: "Negative", value: -4 },
      { category: "A", group: "Positive", value: 6 },
    ],
    encoding: { x: "value", y: "category", group: "group" },
  });
  assert.deepEqual(axes.scales.x.domain(), [-4, 6]);
  const zero = axes.scales.x(0);
  assert.equal(
    Number(svg.querySelector(".zero-baseline").getAttribute("x1")),
    zero,
  );
  const rects = svg.querySelectorAll("rect");
  assert.ok(Number(rects[0].getAttribute("width")) > 0);
  assert.ok(
    Number(rects[0].getAttribute("x")) +
      Number(rects[0].getAttribute("width")) <=
      zero,
  );
  assert.ok(Number(rects[1].getAttribute("x")) >= zero);
}

for (const mark of ["line", "area"]) {
  const { svg, axes } = render({
    mark,
    data: [
      { x: -1, y: -4 },
      { x: 1, y: 6 },
    ],
    encoding: { x: "x", y: "y" },
  });
  assertVerticalBaseline(svg, axes, [-4, 6]);
  const points = svg.querySelectorAll("circle");
  assert.equal(points.length, 2);
  assert.ok(Number(points[0].getAttribute("cy")) > axes.scales.y(0));
  assert.ok(Number(points[1].getAttribute("cy")) < axes.scales.y(0));

  const right = render({
    mark,
    yAxisPos: "right",
    data: [
      { x: -1, y: -4 },
      { x: 1, y: 6 },
    ],
    encoding: { x: "x", y: "y" },
  });
  assert.deepEqual(right.axes.scales.y.range(), [80, 0]);
}

{
  const { svg, axes } = render({
    mark: "lollipop",
    data: [
      { category: "Negative", value: -3 },
      { category: "Positive", value: 5 },
    ],
    encoding: { x: "category", y: "value" },
  });
  assertVerticalBaseline(svg, axes, [-3, 5]);
  const zero = axes.scales.y(0);
  const stems = svg.querySelectorAll(".lollipop-stem");
  assert.equal(stems.length, 2);
  assert.equal(Number(stems[0].getAttribute("y1")), zero);
  assert.ok(Number(stems[0].getAttribute("y2")) > zero);
  assert.ok(Number(stems[1].getAttribute("y2")) < zero);
  assert.equal(
    categoryTick(svg, ".x-axis", "Negative")
      .querySelector("text")
      .getAttribute("y"),
    "-9",
  );
  assert.equal(
    categoryTick(svg, ".x-axis", "Positive")
      .querySelector("text")
      .getAttribute("y"),
    "9",
  );
}
