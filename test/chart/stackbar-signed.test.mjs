import assert from "node:assert/strict";
import { Chart } from "../../src/chart/chart.js";
import { createFakeSvg } from "../helpers/fake-svg.mjs";

const rows = [
  { category: "Negative", group: "a", value: -2 },
  { category: "Negative", group: "b", value: -3 },
  { category: "Positive", group: "a", value: 1 },
  { category: "Positive", group: "b", value: 4 },
];

function makeChart(data, horizontal = false) {
  return new Chart({
    mark: "stackbar",
    data,
    encoding: horizontal
      ? { x: "value", y: "category", group: "group" }
      : { x: "category", y: "value", group: "group" },
    width: 120,
    height: 80,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  });
}

for (const horizontal of [false, true]) {
  const svg = createFakeSvg();
  const axes = makeChart(rows, horizontal).render(svg);
  const scale = horizontal ? axes.scales.x : axes.scales.y;
  const rects = svg.querySelectorAll("rect");
  const zero = scale(0);

  assert.deepEqual(scale.domain(), [-5, 5]);
  assert.equal(rects.length, 4);
  rects.forEach((rect) => {
    const title = rect.querySelector("title").textContent;
    const start = Number(rect.getAttribute(horizontal ? "x" : "y"));
    const size = Number(rect.getAttribute(horizontal ? "width" : "height"));
    assert.ok(size > 0);
    if (horizontal) {
      if (title.startsWith("Negative")) assert.ok(start + size <= zero);
      else assert.ok(start >= zero);
    } else if (title.startsWith("Negative")) {
      assert.ok(start >= zero);
    } else {
      assert.ok(start + size <= zero);
    }
  });

  assert.doesNotThrow(() =>
    makeChart(
      rows.map((row) => (row.group === "a" ? { ...row, value: 0 } : row)),
      horizontal,
    ),
  );
  assert.throws(
    () =>
      makeChart(
        rows.map((row) =>
          row.category === "Negative" && row.group === "b"
            ? { ...row, value: 3 }
            : row,
        ),
        horizontal,
      ),
    /must not mix positive and negative numbers/,
  );
  assert.throws(
    () => makeChart([...rows, { ...rows[0] }], horizontal),
    /Duplicate category and group/,
  );

  const negativeSvg = createFakeSvg();
  const negativeAxes = makeChart(rows.slice(0, 2), horizontal).render(
    negativeSvg,
  );
  const negativeScale = horizontal
    ? negativeAxes.scales.x
    : negativeAxes.scales.y;
  assert.deepEqual(negativeScale.domain(), [-5, 0]);
  assert.equal(negativeSvg.querySelectorAll("rect").length, 2);
  if (!horizontal) {
    assert.equal(
      negativeSvg.querySelector(".x-axis").getAttribute("transform"),
      "translate(0, 0)",
    );
  }
}
