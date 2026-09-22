import assert from "node:assert/strict";
import { sequenceContainer } from "../../src/container/sequence.js";
import { createFakeSvg } from "../helpers/fake-svg.mjs";

const margin = { top: 0, right: 0, bottom: 0, left: 0 };

{
  const container = sequenceContainer({
    width: 120,
    height: 80,
    xDomain: [0, 1, 2],
    yDomain: ["learner-a", "learner-b"],
    tracks: ["learner-a", "learner-b"],
    missing: [{ week: 2, learner: "learner-b" }],
    events: [{ week: 1, learner: "learner-a", type: "dropout" }],
  });

  const slots = container.slots(
    [
      { id: "a0", week: 0, learner: "learner-a" },
      { id: "b2", week: 2, learner: "learner-b" },
    ],
    { x: "week", y: "learner", key: "id" },
  );

  assert.equal(slots.length, 2);
  assert.equal(slots[0].key, "a0");
  assert.equal(slots[0].x, 20);
  assert.equal(slots[0].y, 20);
  assert.equal(slots[1].x, 100);
  assert.equal(slots[1].y, 60);
}

{
  const svg = createFakeSvg();
  const container = sequenceContainer({
    width: 120,
    height: 80,
    xDomain: [0, 1, 2],
    yDomain: ["learner-a", "learner-b"],
    tracks: ["learner-a", "learner-b"],
    missing: [{ week: 2, learner: "learner-b" }],
    events: [{ week: 1, learner: "learner-a", type: "dropout" }],
  });

  container.render(svg, { width: 120, height: 80, margin });

  assert.equal(svg.querySelectorAll("line").length, 2);
  assert.equal(svg.querySelectorAll("circle").length, 2);
  assert.equal(svg.querySelectorAll("rect").length, 0);
}

{
  const svg = createFakeSvg();
  const container = sequenceContainer({
    width: 100,
    height: 50,
    xDomain: ["A", "B"],
    yDomain: ["row"],
    missing: [{ week: "B", learner: "row" }],
  });

  container.render(svg, { width: 200, margin });

  const missing = svg.querySelector("circle");
  assert.equal(Number(missing.getAttribute("cx")), 150);
  assert.equal(Number(missing.getAttribute("cy")), 25);
}

{
  const svg = createFakeSvg();
  const container = sequenceContainer({
    width: 100,
    height: 100,
    xDomain: ["week"],
    yDomain: ["first", "second"],
    events: [{ week: "week", learner: "second" }],
  });

  container.render(svg, { height: 200, margin });

  const event = svg.querySelector("circle");
  assert.equal(Number(event.getAttribute("cx")), 50);
  assert.equal(Number(event.getAttribute("cy")), 150);
}
