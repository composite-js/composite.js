import assert from "node:assert/strict";
import { FlowDiagramRenderer } from "../../src/chart/type/flow.js";
import { createFakeSvg } from "../helpers/fake-svg.mjs";

const svg = createFakeSvg();
const renderer = new FlowDiagramRenderer({
  width: 160,
  height: 100,
  margin: { top: 0, right: 0, bottom: 0, left: 0 },
  encoding: {
    x: "cohort",
    group: "date",
    y: "count",
    xDomain: ["active", "at-risk"],
    groupDomain: ["Jun 22", "Jun 29"],
  },
  minStrokeWidth: 1,
  maxStrokeWidth: 9,
  color: "#f5b27c",
  opacity: 0.25,
});

const axisConfig = renderer.render(svg, [
  { cohort: "active", date: "Jun 22", count: 5 },
  { cohort: "at-risk", date: "Jun 29", count: 20 },
]);

const paths = svg.querySelectorAll("path");

assert.equal(axisConfig, null);
assert.equal(paths.length, 2);
assert.equal(paths[0].getAttribute("fill"), "none");
assert.equal(paths[0].getAttribute("stroke"), "#f5b27c");
assert.equal(paths[0].getAttribute("opacity"), "0.25");
assert.equal(paths[0].getAttribute("stroke-width"), "1");
assert.equal(paths[1].getAttribute("stroke-width"), "9");
assert.ok(paths[0].getAttribute("d").startsWith("M0,25C"));

{
  const labeledSvg = createFakeSvg();
  const labeledRenderer = new FlowDiagramRenderer({
    width: 160,
    height: 100,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    encoding: {
      x: "cohort",
      group: "date",
      y: "count",
      xDomain: ["active", "at-risk"],
      groupDomain: ["Jun 22", "Jun 29"],
    },
    color: ["#1f77b4", "#ff7f0e"],
    colorBy: "group",
    xLabelName: "Cohort",
    groupLabelName: "Week",
    showLabels: true,
  });

  labeledRenderer.render(labeledSvg, [
    { cohort: "active", date: "Jun 22", count: 5 },
    { cohort: "at-risk", date: "Jun 29", count: 20 },
  ]);

  const labeledPaths = labeledSvg.querySelectorAll("path");
  const labels = labeledSvg
    .querySelectorAll("text")
    .map((text) => text.textContent);

  assert.equal(labeledPaths[0].getAttribute("stroke"), "#1f77b4");
  assert.equal(labeledPaths[1].getAttribute("stroke"), "#ff7f0e");
  assert.ok(labels.includes("Cohort"));
  assert.ok(labels.includes("Week"));
  assert.ok(labels.includes("active"));
  assert.ok(labels.includes("Jun 29"));
}

{
  const verticalSvg = createFakeSvg();
  const verticalRenderer = new FlowDiagramRenderer({
    width: 100,
    height: 160,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    direction: "vertical",
    encoding: {
      x: "cohort",
      group: "date",
      y: "count",
      xDomain: ["active", "at-risk"],
      groupDomain: ["Jun 22", "Jun 29"],
    },
    minStrokeWidth: 1,
    maxStrokeWidth: 9,
  });

  verticalRenderer.render(verticalSvg, [
    { cohort: "active", date: "Jun 22", count: 5 },
    { cohort: "at-risk", date: "Jun 29", count: 20 },
  ]);

  const verticalPaths = verticalSvg.querySelectorAll("path");

  assert.equal(verticalPaths.length, 2);
  assert.equal(verticalPaths[0].getAttribute("stroke-width"), "1");
  assert.equal(verticalPaths[1].getAttribute("stroke-width"), "9");
  assert.ok(verticalPaths[0].getAttribute("d").startsWith("M25,0C"));
}

{
  const sourceColorSvg = createFakeSvg();
  const sourceColorRenderer = new FlowDiagramRenderer({
    width: 100,
    height: 160,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    direction: "vertical",
    encoding: {
      x: "cohort",
      group: "date",
      y: "count",
      xDomain: ["active", "at-risk"],
      groupDomain: ["Jun 22", "Jun 29"],
    },
    colors: ["#2ca02c", "#d62728"],
    colorBy: "x",
  });

  sourceColorRenderer.render(sourceColorSvg, [
    { cohort: "active", date: "Jun 29", count: 5 },
    { cohort: "at-risk", date: "Jun 22", count: 20 },
  ]);

  const sourceColorPaths = sourceColorSvg.querySelectorAll("path");

  assert.equal(sourceColorPaths[0].getAttribute("stroke"), "#2ca02c");
  assert.equal(sourceColorPaths[1].getAttribute("stroke"), "#d62728");
}
