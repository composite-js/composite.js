import assert from "node:assert/strict";
import { Node, repeatX, repeatY } from "../../src/layout.js";
import { withFakeSvgDocument } from "../helpers/fake-svg.mjs";

function leaf(id) {
  const node = new Node();
  node.classTag = "leaf";
  node.element = {
    render(container) {
      const rect = container.ownerDocument.createElementNS(
        "http://www.w3.org/2000/svg",
        "rect",
      );
      rect.setAttribute("data-id", id);
      rect.setAttribute("width", 10);
      rect.setAttribute("height", 10);
      container.appendChild(rect);
    },
  };
  return node;
}

await withFakeSvgDocument(async (document) => {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");

  repeatX([], () => leaf("unused")).render(svg, { width: 40, height: 20 });
  assert.equal(svg.querySelectorAll("*").length, 0);
});

await withFakeSvgDocument(async (document) => {
  const xSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const ySvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const xCalls = [];
  const yCalls = [];

  repeatX(["A", "B"], (value, index) => {
    xCalls.push([value, index]);
    return leaf(value);
  }).render(xSvg, { width: 40, height: 20 });

  repeatY(["C", "D"], (value, index) => {
    yCalls.push([value, index]);
    return leaf(value);
  }).render(ySvg, { width: 40, height: 20 });

  assert.deepEqual(xCalls, [
    ["A", 0],
    ["B", 1],
  ]);
  assert.deepEqual(yCalls, [
    ["C", 0],
    ["D", 1],
  ]);
});

await withFakeSvgDocument(async (document) => {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");

  assert.throws(
    () => repeatX(["bad"], () => ({ bad: true })).render(svg),
    /repeatX child 0/i,
  );
});

{
  assert.throws(
    () => repeatX(["A", "A"], () => leaf("duplicate")),
    /repeat domain values must be unique.*indices 0 and 1/i,
  );

  assert.throws(
    () =>
      repeatY([new Date("2024-01-01"), new Date("2024-01-01")], () =>
        leaf("duplicate-date"),
      ),
    /repeat domain values must be unique.*indices 0 and 1/i,
  );
}
