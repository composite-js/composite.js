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
