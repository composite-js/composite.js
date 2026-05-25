import assert from "node:assert/strict";
import { Chart } from "../../src/chart.js";
import {
  chart,
  custom,
  frame,
  isLayoutNode,
  repeatX,
  repeatY,
  stackX,
  stackY,
  text,
} from "../../src/index.js";

{
  const node = chart({
    mark: "bar",
    data: [{ category: "A", value: 1 }],
    encoding: { x: "category", y: "value" },
  });

  assert.ok(isLayoutNode(node));
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

{
  const node = text({ text: "Label", width: 80, height: 20 });

  assert.ok(isLayoutNode(node));
  assert.equal(node.classTag, "text");
}

{
  const node = frame(text({ text: "Label", width: 80, height: 20 }));

  assert.ok(isLayoutNode(node));
  assert.equal(node.classTag, "frame");
}

{
  const renderable = {
    width: 80,
    height: 40,
    options: { width: 80, height: 40 },
    render() {},
  };
  const node = custom(renderable, { classTag: "custom-test" });

  assert.ok(isLayoutNode(node));
  assert.equal(node.classTag, "custom-test");
  assert.equal(node.element, renderable);
  assert.throws(() => custom({}), /render method/i);
}

{
  const node = chart({
    mark: "area",
    data: [{ year: 2020, age: 61 }],
    encoding: { x: "year", y: "age" },
  });

  assert.equal(node.element.mark, "area");
}

{
  const node = chart({
    mark: "stream",
    data: [
      { period: "Q1", series: "A", value: 1 },
      { period: "Q1", series: "B", value: 2 },
    ],
    encoding: { x: "period", y: "value", group: "series" },
  });

  assert.equal(node.element.mark, "stream");
}

{
  const node = chart({
    mark: "groupbar",
    data: [
      { period: "Q1", series: "A", value: 1 },
      { period: "Q1", series: "B", value: 2 },
    ],
    encoding: { x: "period", y: "value", group: "series" },
  });

  assert.equal(node.element.mark, "groupbar");
}

{
  const node = chart({
    mark: "dumbbell",
    data: [
      { period: "Q1", value: 1 },
      { period: "Q1", value: 2 },
    ],
    encoding: { x: "value", y: "period" },
  });

  assert.equal(node.element.mark, "dumbbell");
}

{
  const node = chart({
    mark: "pac",
    data: [{ period: "Q1", value: 1 }],
    encoding: { x: "period", y: "value" },
  });

  assert.equal(node.element.mark, "pac");
}
