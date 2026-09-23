import assert from "node:assert/strict";
import { chart, Node, repeatX, repeatY } from "../../src/layout.js";
import { withFakeSvgDocument } from "../helpers/fake-svg.mjs";

function numericAttribute(element, name) {
  return Number(element.getAttribute(name));
}

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
  const values = [10, 100];

  repeatX(
    values,
    (value) =>
      chart({
        mark: "bar",
        data: [{ category: "A", value }],
        encoding: { x: "category", y: "value" },
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
      }),
    { width: 200, height: 100, paddingInner: 0, paddingOuter: 0 },
  ).render(svg, { width: 200, height: 100 });

  const heights = svg
    .querySelectorAll("rect")
    .map((rect) => numericAttribute(rect, "height"));

  assert.deepEqual(heights, [10, 100]);
});

await withFakeSvgDocument(async (document) => {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const ranges = [
    { open: 9, high: 12, low: 8, close: 11 },
    { open: 90, high: 120, low: 80, close: 110 },
  ];

  repeatX(
    ranges,
    (prices) =>
      chart({
        mark: "candlestick",
        data: [{ period: "A", ...prices }],
        encoding: {
          x: "period",
          open: "open",
          high: "high",
          low: "low",
          close: "close",
        },
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
      }),
    { width: 200, height: 100, paddingInner: 0, paddingOuter: 0 },
  ).render(svg, { width: 200, height: 100 });

  const wickHeights = svg
    .querySelectorAll(".candlestick-wick")
    .map((wick) => numericAttribute(wick, "y2") - numericAttribute(wick, "y1"));

  assert.equal(wickHeights.length, 2);
  assert.ok(wickHeights[0] < wickHeights[1]);
});

await withFakeSvgDocument(async (document) => {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const slices = [
    [
      { category: "A", value: 1 },
      { category: "B", value: 1 },
    ],
    [
      { category: "B", value: 1 },
      { category: "C", value: 1 },
    ],
  ];

  repeatX(
    slices,
    (data) =>
      chart({
        mark: "pie",
        data,
        encoding: { x: "category", y: "value" },
        colorScheme: ["red", "blue", "green"],
      }),
    { width: 200, height: 100, paddingInner: 0, paddingOuter: 0 },
  ).render(svg, { width: 200, height: 100 });

  const fills = svg
    .querySelectorAll("path")
    .map((path) => path.getAttribute("fill"));

  assert.deepEqual(fills, ["red", "blue", "blue", "green"]);
});

await withFakeSvgDocument(async (document) => {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const values = [10, 100];

  repeatX(
    values,
    (count) =>
      chart({
        mark: "pac",
        data: [{ category: "A", count }],
        encoding: { x: "count", y: "category" },
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
      }),
    { width: 200, height: 100, paddingInner: 0, paddingOuter: 0 },
  ).render(svg, { width: 200, height: 100 });

  const radii = svg
    .querySelectorAll("circle")
    .map((circle) => numericAttribute(circle, "r"));

  assert.equal(radii.length, 2);
  assert.ok(radii[0] < radii[1]);
});

await withFakeSvgDocument(async (document) => {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const values = [10, 100];

  repeatX(
    values,
    (value, index) =>
      chart({
        mark: "bar",
        data: [{ category: "A", value }],
        encoding: {
          x: "category",
          y: "value",
          ...(index === 0 ? { yDomain: [0, 20] } : {}),
        },
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
      }),
    { width: 200, height: 100, paddingInner: 0, paddingOuter: 0 },
  ).render(svg, { width: 200, height: 100 });

  const heights = svg
    .querySelectorAll("rect")
    .map((rect) => numericAttribute(rect, "height"));

  assert.deepEqual(heights, [50, 100]);
});

await withFakeSvgDocument(async (document) => {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const values = [10, 100];

  repeatX(
    values,
    (value) =>
      chart({
        mark: "bar",
        data: [{ category: "A", value }],
        encoding: { x: "category", y: "value" },
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
      }),
    {
      width: 200,
      height: 100,
      paddingInner: 0,
      paddingOuter: 0,
      shareDomains: false,
    },
  ).render(svg, { width: 200, height: 100 });

  const heights = svg
    .querySelectorAll("rect")
    .map((rect) => numericAttribute(rect, "height"));

  assert.deepEqual(heights, [100, 100]);
});

await withFakeSvgDocument(async (document) => {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");

  repeatY(["A", "B"], (value) => leaf(value), {
    width: 40,
    height: 20,
    paddingInner: 0,
    paddingOuter: 0,
  }).render(svg, { width: 40, height: 20 });

  assert.deepEqual(
    svg.querySelectorAll("rect").map((rect) => rect.getAttribute("data-id")),
    ["A", "B"],
  );
});
