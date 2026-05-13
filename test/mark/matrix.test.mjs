import assert from "node:assert/strict";
import { MatrixChartRenderer } from "../../src/mark/matrix.js";
import { createFakeSvg } from "../helpers/fake-svg.mjs";

{
  const svg = createFakeSvg();
  const renderer = new MatrixChartRenderer({
    width: 90,
    height: 60,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    encoding: { x: "id", y: "sets", yDomain: ["B", "A", "C"] },
  });

  const axisConfig = renderer.render(svg, [
    { id: "i1", sets: ["A", "C"] },
    { id: "i2", sets: ["B"] },
  ]);

  const circles = svg.querySelectorAll("circle");
  const lines = svg.querySelectorAll("line");
  const stripes = svg.querySelectorAll("rect");

  assert.equal(axisConfig, null);
  assert.equal(circles.length, 6);
  assert.equal(lines.length, 1);
  assert.equal(stripes.length, 2);
  assert.equal(circles[0].getAttribute("fill"), "#e0e0e0");
  assert.equal(circles[1].getAttribute("fill"), "black");
  assert.equal(circles[2].getAttribute("fill"), "black");
}

{
  const svg = createFakeSvg();
  const renderer = new MatrixChartRenderer({
    width: 90,
    height: 60,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    stripe: false,
    encoding: { x: "id", y: "sets" },
  });

  renderer.render(svg, [
    { id: "i1", sets: ["B", "A"] },
    { id: "i2", sets: ["C"] },
  ]);

  assert.equal(svg.querySelectorAll("rect").length, 0);
  assert.equal(svg.querySelectorAll("circle").length, 6);
}

{
  const svg = createFakeSvg();
  const renderer = new MatrixChartRenderer({
    width: 90,
    height: 60,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    color: "tomato",
    encoding: { x: "id", y: "sets", yDomain: ["A", "B"] },
  });

  renderer.render(svg, [{ id: "i1", sets: ["A"] }]);

  const circles = svg.querySelectorAll("circle");
  assert.equal(circles[0].getAttribute("fill"), "tomato");
  assert.equal(circles[1].getAttribute("fill"), "#e0e0e0");
}

{
  const svg = createFakeSvg();
  const renderer = new MatrixChartRenderer({
    width: 90,
    height: 60,
    margin: { top: 10, right: 10, bottom: 10, left: 30 },
    showXAxis: true,
    showYAxis: true,
    xAxisPos: "top",
    yAxisPos: "left",
    encoding: {
      x: "quarter",
      y: "institution",
      value: "score",
      xDomain: ["Q1", "Q2"],
      yDomain: ["Radio", "ONPE"],
    },
  });

  renderer.render(svg, [
    { quarter: "Q1", institution: "Radio", score: 0.2 },
    { quarter: "Q2", institution: "Radio", score: 0.4 },
    { quarter: "Q1", institution: "ONPE", score: 0.6 },
    { quarter: "Q2", institution: "ONPE", score: 0.8 },
  ]);

  const labels = svg.querySelectorAll("text").map((text) => text.textContent);
  assert.deepEqual(labels, ["Q1", "Q2", "Radio", "ONPE"]);
}

{
  const svg = createFakeSvg();
  const renderer = new MatrixChartRenderer({
    width: 90,
    height: 60,
    margin: { top: 10, right: 10, bottom: 10, left: 30 },
    showXAxis: true,
    showYAxis: false,
    encoding: {
      x: "quarter",
      y: "institution",
      value: "score",
      xDomain: ["Q1", "Q2"],
      yDomain: ["Radio", "ONPE"],
    },
  });

  renderer.render(svg, [
    { quarter: "Q1", institution: "Radio", score: 0.2 },
    { quarter: "Q2", institution: "Radio", score: 0.4 },
  ]);

  const labels = svg.querySelectorAll("text").map((text) => text.textContent);
  assert.deepEqual(labels, ["Q1", "Q2"]);
}

{
  const svg = createFakeSvg();
  const renderer = new MatrixChartRenderer({
    width: 80,
    height: 40,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    color: "red",
    encoding: {
      x: "quarter",
      y: "institution",
      value: "score",
      xDomain: ["Q1", "Q2"],
      yDomain: ["Radio"],
    },
  });

  renderer.render(svg, [
    { quarter: "Q1", institution: "Radio", score: 0 },
    { quarter: "Q2", institution: "Radio", score: 1 },
  ]);

  const circles = svg.querySelectorAll("circle");
  assert.equal(circles.length, 2);
  assert.notEqual(
    circles[0].getAttribute("fill"),
    circles[1].getAttribute("fill"),
  );
}

{
  const svg = createFakeSvg();
  const renderer = new MatrixChartRenderer({
    width: 80,
    height: 40,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    color: "black",
    encoding: {
      x: "quarter",
      y: "institution",
      value: "score",
      xDomain: ["Q1", "Q2"],
      yDomain: ["Radio"],
    },
  });

  renderer.render(svg, [
    { quarter: "Q1", institution: "Radio", score: 0 },
    { quarter: "Q2", institution: "Radio", score: 1 },
  ]);

  const fills = svg
    .querySelectorAll("circle")
    .map((circle) => circle.getAttribute("fill"));
  assert.deepEqual(fills, ["rgb(224, 224, 224)", "rgb(0, 0, 0)"]);
}
