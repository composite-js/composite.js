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

  assert.ok(svg.querySelector(".y-grid"));
  assert.ok(
    svg.querySelectorAll("text").some((text) => text.textContent === "100%"),
  );
  assert.ok(
    svg
      .querySelectorAll("line")
      .some((line) => line.getAttribute("x2") === "120"),
  );
}
