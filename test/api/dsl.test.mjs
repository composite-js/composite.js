import assert from "node:assert/strict";
import {
  Chart,
  Node,
  chart,
  repeatX,
  repeatY,
  stackX,
  stackY,
} from "../../src/index.js";

{
  const node = chart({
    mark: "bar",
    data: [{ category: "A", value: 1 }],
    encoding: { x: "category", y: "value" },
  });

  assert.ok(node instanceof Node);
  assert.ok(node.element instanceof Chart);
  assert.equal(node.classTag, "chart");
}

{
  const child = chart({
    mark: "bar",
    data: [{ category: "A", value: 1 }],
    encoding: { x: "category", y: "value" },
  });

  assert.equal(stackX([child]).classTag, "stackX");
  assert.equal(stackY([child]).classTag, "stackY");
}

{
  const bareChart = new Chart({
    mark: "bar",
    data: [{ category: "A", value: 1 }],
    encoding: { x: "category", y: "value" },
  });

  assert.throws(() => stackX([bareChart]), /layout node/i);
  assert.throws(() => stackY([bareChart]), /layout node/i);
}

{
  const makeChild = (value) =>
    chart({
      mark: "bar",
      data: [{ category: value, value: 1 }],
      encoding: { x: "category", y: "value" },
    });

  assert.equal(repeatX(["A"], makeChild).classTag, "repeatX");
  assert.equal(repeatY(["A"], makeChild).classTag, "repeatY");
}
