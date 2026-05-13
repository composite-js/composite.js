import assert from "node:assert/strict";
import { StreamGraphRenderer } from "../../src/mark/stream.js";
import { createFakeSvg } from "../helpers/fake-svg.mjs";

const data = [
  { week: "18-Jun", type: "Assessment", value: 12 },
  { week: "18-Jun", type: "Course Content", value: 8 },
  { week: "25-Jun", type: "Assessment", value: 18 },
  { week: "25-Jun", type: "Course Content", value: 11 },
  { week: "02-Jul", type: "Assessment", value: 14 },
  { week: "02-Jul", type: "Course Content", value: 16 },
];

const svg = createFakeSvg();
const renderer = new StreamGraphRenderer({
  width: 180,
  height: 90,
  margin: { top: 0, right: 0, bottom: 0, left: 0 },
  encoding: { x: "week", y: "value", color: "type" },
  colors: ["#fbb4ae", "#b3cde3"],
  opacity: 0.6,
});

const axisConfig = renderer.render(svg, data);
const paths = svg.querySelectorAll("path");

assert.equal(paths.length, 2);
assert.ok(paths[0].getAttribute("d").startsWith("M"));
assert.equal(paths[0].getAttribute("fill"), "#fbb4ae");
assert.equal(paths[0].getAttribute("opacity"), "0.6");
assert.equal(paths[0].querySelectorAll("title")[0].textContent, "Assessment");
assert.deepEqual(axisConfig.scales.x.domain(), ["18-Jun", "25-Jun", "02-Jul"]);
assert.equal(axisConfig.scales.y.domain().length, 2);

{
  const verticalSvg = createFakeSvg();
  const verticalRenderer = new StreamGraphRenderer({
    width: 90,
    height: 180,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    direction: "vertical",
    encoding: { x: "week", y: "value", color: "type" },
    colors: ["#fbb4ae", "#b3cde3"],
  });

  const verticalAxisConfig = verticalRenderer.render(verticalSvg, data);

  assert.equal(verticalSvg.querySelectorAll("path").length, 2);
  assert.equal(verticalAxisConfig.scales.x.domain().length, 2);
  assert.deepEqual(verticalAxisConfig.scales.y.domain(), [
    "18-Jun",
    "25-Jun",
    "02-Jul",
  ]);
}
