import assert from "node:assert/strict";
import * as d3 from "d3";
import { AxisRenderer } from "../../src/chart/axis.js";
import { createFakeSvg } from "../helpers/fake-svg.mjs";

{
  const svg = createFakeSvg();
  const renderer = new AxisRenderer({
    showYAxis: false,
    xAxisName: "Participants",
    xAxisPos: "top",
  });
  const x = d3.scaleLinear().domain([0, 9000]).range([120, 0]);

  renderer.render(
    svg,
    { x },
    {
      margin: { top: 30, right: 0, bottom: 0, left: 10 },
      width: 120,
      height: 80,
    },
  );

  const label = svg
    .querySelectorAll("text")
    .find((text) => text.textContent === "Participants");
  assert.ok(label);
  assert.equal(label.getAttribute("x"), "70");
}

{
  const svg = createFakeSvg();
  const mark = svg.ownerDocument.createElementNS(svg.namespaceURI, "rect");
  mark.setAttribute("class", "mark");
  svg.appendChild(mark);
  const renderer = new AxisRenderer({
    showXAxis: false,
    showYGrid: true,
    yTickCount: 2,
    yTickFormat: (value) => `${value}%`,
  });
  const y = d3.scaleLinear().domain([0, 100]).range([80, 0]);

  renderer.render(
    svg,
    { y },
    {
      margin: { top: 0, right: 0, bottom: 0, left: 10 },
      width: 120,
      height: 80,
    },
  );

  const grid = svg.querySelector(".y-grid");
  const axis = svg.querySelector(".y-axis");
  assert.ok(grid);
  assert.ok(axis);
  assert.ok(svg.children.indexOf(grid) < svg.children.indexOf(mark));
  assert.ok(svg.children.indexOf(mark) < svg.children.indexOf(axis));
  assert.equal(grid.querySelectorAll("text").length, 0);
  assert.equal(grid.querySelectorAll(".domain").length, 0);
  assert.ok(
    svg.querySelectorAll("text").some((text) => text.textContent === "100%"),
  );
  assert.ok(
    svg
      .querySelectorAll("line")
      .some((line) => line.getAttribute("x2") === "120"),
  );
}

{
  const svg = createFakeSvg();
  const mark = svg.ownerDocument.createElementNS(svg.namespaceURI, "circle");
  mark.setAttribute("class", "mark");
  svg.appendChild(mark);
  const renderer = new AxisRenderer({
    showYAxis: false,
    showXGrid: true,
    xTickCount: 2,
  });
  const x = d3.scaleLinear().domain([0, 10]).range([0, 120]);

  renderer.render(
    svg,
    { x },
    {
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      width: 120,
      height: 80,
    },
  );

  const grid = svg.querySelector(".x-grid");
  const axis = svg.querySelector(".x-axis");
  assert.ok(svg.children.indexOf(grid) < svg.children.indexOf(mark));
  assert.ok(svg.children.indexOf(mark) < svg.children.indexOf(axis));
}
