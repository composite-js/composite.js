import assert from "node:assert/strict";
import { gridContainer } from "../../src/index.js";
import { createFakeSvg } from "../helpers/fake-svg.mjs";

const zeroMargin = { top: 0, right: 0, bottom: 0, left: 0 };

{
  const container = gridContainer({
    width: 200,
    height: 100,
    rowDomain: ["top", "bottom"],
    columnDomain: ["left", "right"],
    row: "row",
    column: "column",
    paddingInner: 0,
    paddingOuter: 0,
  });

  const slots = container.slots(
    [
      { id: "a", row: "top", column: "left" },
      { id: "b", row: "bottom", column: "right" },
      { id: "skip", row: "missing", column: "right" },
    ],
    { key: "id" },
  );

  assert.equal(slots.length, 2);
  assert.equal(slots[0].key, "a");
  assert.equal(slots[0].x, 50);
  assert.equal(slots[0].y, 25);
  assert.equal(slots[0].width, 100);
  assert.equal(slots[0].height, 50);
  assert.equal(slots[1].key, "b");
  assert.equal(slots[1].x, 150);
  assert.equal(slots[1].y, 75);
  assert.equal(slots[1].width, 100);
  assert.equal(slots[1].height, 50);
}

{
  const container = gridContainer({
    width: 200,
    height: 100,
    rowDomain: ["top"],
    columnDomain: ["left"],
    row: "row",
    column: "column",
    cellSizing: "intrinsic",
  });

  const slots = container.slots([{ id: "a", row: "top", column: "left" }], {
    key: "id",
    width: 24,
    height: 18,
  });

  assert.equal(slots[0].x, 100);
  assert.equal(slots[0].y, 50);
  assert.equal(slots[0].width, 24);
  assert.equal(slots[0].height, 18);

  const intrinsic = container.slots([{ id: "a", row: "top", column: "left" }], {
    key: "id",
  });

  assert.equal(intrinsic[0].width, undefined);
  assert.equal(intrinsic[0].height, undefined);
}

{
  const svg = createFakeSvg();
  const container = gridContainer({
    width: 120,
    height: 80,
    margin: zeroMargin,
    rowDomain: ["r1", "r2"],
    columnDomain: ["c1", "c2", "c3"],
    showGrid: true,
    stroke: "#999",
    fill: "#fff",
  });

  container.render(svg, { width: 120, height: 80, margin: zeroMargin });

  const rects = svg.querySelectorAll("rect");
  assert.equal(rects.length, 6);
  assert.ok(rects.every((rect) => rect.getAttribute("fill") === "#fff"));
  assert.ok(rects.every((rect) => rect.getAttribute("stroke") === "#999"));
}
