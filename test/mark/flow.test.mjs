import assert from "node:assert/strict";
import { FlowDiagramRenderer } from "../../src/mark/flow.js";
import { createFakeSvg } from "../helpers/fake-svg.mjs";

const svg = createFakeSvg();
const renderer = new FlowDiagramRenderer({
  width: 160,
  height: 100,
  margin: { top: 0, right: 0, bottom: 0, left: 0 },
  encoding: { source: "cohort", target: "date", value: "count" },
  sourceDomain: ["active", "at-risk"],
  targetDomain: ["Jun 22", "Jun 29"],
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
