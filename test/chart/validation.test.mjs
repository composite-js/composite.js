import assert from "node:assert/strict";
import { validateChartConfig as publicValidateChartConfig } from "../../src/index.js";
import { Chart } from "../../src/chart/chart.js";
import { BarChartRenderer } from "../../src/chart/type/bar.js";
import {
  CHART_TYPE_DEFINITIONS,
  validateChartConfig,
} from "../../src/chart/validation.js";

function assertValid(config) {
  assert.doesNotThrow(() => validateChartConfig(config));
}

function assertInvalid(config, pattern) {
  assert.throws(() => validateChartConfig(config), pattern);
}

{
  assert.equal(publicValidateChartConfig, validateChartConfig);
  assert.ok(CHART_TYPE_DEFINITIONS.bar);
  assert.deepEqual(CHART_TYPE_DEFINITIONS.stackbar.requiredEncoding, [
    "x",
    "y",
    "group",
  ]);
  assert.deepEqual(CHART_TYPE_DEFINITIONS.flow.requiredEncoding, [
    "x",
    "group",
    "y",
  ]);
  assert.deepEqual(CHART_TYPE_DEFINITIONS.pac.optionalEncoding, [
    "xDomain",
    "yDomain",
  ]);
}

{
  assertValid({
    mark: "bar",
    data: [{ category: "A", value: 4 }],
    encoding: { x: "category", y: "value" },
  });

  assertValid({
    mark: "stackbar",
    data: [
      { category: "A", segment: "s1", value: 4 },
      { category: "A", segment: "s2", value: 2 },
    ],
    encoding: { x: "category", y: "value", group: "segment" },
  });

  assertValid({
    mark: "flow",
    data: [{ source: "A", target: "B", count: 4 }],
    encoding: { x: "source", group: "target", y: "count" },
  });

  assertValid({
    mark: "pie",
    data: [{ category: "A", value: 4 }],
    encoding: { x: "category", y: "value" },
  });

  assertValid({
    mark: "pac",
    data: [{ category: "A", value: 4 }],
    encoding: { x: "category", y: "value", xDomain: ["A", "B"] },
  });

  assertValid({
    mark: "pac",
    data: [{ category: "A", value: 4 }],
    encoding: { x: "value", y: "category", yDomain: ["A", "B"] },
  });

  assertValid({
    mark: "matrix",
    data: [
      { column: "C1", row: "R1", active: true },
      { column: "C2", row: "R1", active: false },
    ],
    encoding: { x: "column", group: "row", y: "active" },
  });

  assertValid({
    mark: "bar",
    markStyle: {
      type: "rounded",
      options: {},
      rect(context) {
        return context.container.append("rect");
      },
    },
    data: [{ category: "A", value: 4 }],
    encoding: { x: "category", y: "value" },
  });
}

{
  assertInvalid(
    {
      mark: "groupbar",
      data: [{ category: "A", value: 4 }],
      encoding: { x: "category", y: "value" },
    },
    /Invalid encoding for mark "groupbar": missing encoding\.group/,
  );

  assertInvalid(
    {
      mark: "bar",
      data: [{ category: "A", value: 4 }],
      encoding: { x: "category", y: "value", extra: "ignored" },
    },
    /Unsupported encoding field "extra" for mark "bar"/,
  );

  assertInvalid(
    {
      mark: "bar",
      direction: "horizontal",
      data: [{ category: "A", value: 4 }],
      encoding: { x: "value", y: "category" },
    },
    /direction is not supported for mark "bar"/,
  );

  assertInvalid(
    {
      mark: "bar",
      markStyle: "glossy",
      data: [{ category: "A", value: 4 }],
      encoding: { x: "category", y: "value" },
    },
    /Unsupported markStyle "glossy"/,
  );

  assertInvalid(
    {
      mark: "bar",
      markStyle: { rect: "rounded" },
      data: [{ category: "A", value: 4 }],
      encoding: { x: "category", y: "value" },
    },
    /markStyle\.rect must be a function/,
  );
}

{
  const base = {
    mark: "bar",
    data: [{ category: "A", value: 4 }],
    encoding: { x: "category", y: "value" },
  };

  assertInvalid({ ...base, width: -1 }, /width must be non-negative/);
  assertInvalid(
    { ...base, height: Infinity },
    /height must be a finite number/,
  );
  assertInvalid(
    { ...base, margin: { left: NaN } },
    /margin\.left must be a finite number/,
  );
  assertInvalid(
    { ...base, margin: { left: -1 } },
    /margin\.left must be non-negative/,
  );
  assertInvalid(
    { ...base, padding: { yInner: Infinity } },
    /padding\.yInner must be a finite number/,
  );
  assertInvalid({ ...base, padding: -0.1 }, /padding must be non-negative/);

  const zeroSized = new Chart({ ...base, width: 0, height: 0 });
  assert.equal(zeroSized.width, 0);
  assert.equal(zeroSized.height, 0);
  assert.equal(zeroSized._createRenderer().width, 0);
  assert.equal(zeroSized._createRenderer().height, 0);
}

{
  assertInvalid(
    {
      mark: "stackbar",
      data: [{ category: "A", segment: "s1", value: 4 }],
      encoding: { x: "category", y: "value", stack: "segment" },
    },
    /encoding\.stack is no longer supported; use encoding\.group/,
  );

  assertInvalid(
    {
      mark: "stream",
      data: [{ date: "D1", type: "A", value: 4 }],
      encoding: { x: "date", y: "value", color: "type" },
    },
    /encoding\.color is no longer supported; use encoding\.group/,
  );

  assertInvalid(
    {
      mark: "flow",
      data: [{ source: "A", target: "B", value: 4 }],
      encoding: { source: "source", target: "target", value: "value" },
    },
    /encoding\.source is no longer supported; use encoding\.x/,
  );

  assertInvalid(
    {
      mark: "pie",
      data: [{ category: "A", value: 4 }],
      encoding: { category: "category", value: "value" },
    },
    /encoding\.category is no longer supported; use encoding\.x/,
  );

  assertInvalid(
    {
      mark: "pac",
      data: [{ category: "A", value: 4 }],
      encoding: {
        x: "category",
        y: "value",
        categoryDomain: ["A", "B"],
      },
    },
    /encoding\.categoryDomain is no longer supported; use encoding\.xDomain/,
  );

  assertInvalid(
    {
      mark: "flow",
      sourceDomain: ["A"],
      targetDomain: ["B"],
      data: [{ source: "A", target: "B", count: 4 }],
      encoding: { x: "source", group: "target", y: "count" },
    },
    /sourceDomain is no longer supported; use encoding\.xDomain/,
  );

  assertInvalid(
    {
      mark: "flow",
      colorBy: "target",
      data: [{ source: "A", target: "B", count: 4 }],
      encoding: { x: "source", group: "target", y: "count" },
    },
    /colorBy "target" is no longer supported; use "group"/,
  );
}

{
  assertInvalid(
    {
      mark: "bar",
      data: [],
      encoding: { x: "category", y: "value" },
    },
    /data for mark "bar" must contain at least one row/,
  );

  assert.throws(
    () =>
      new Chart({
        mark: "bar",
        data: [],
        encoding: { x: "category", y: "value" },
      }),
    /data for mark "bar" must contain at least one row/,
  );

  assertInvalid(
    {
      mark: "bar",
      data: [{ category: "A", count: 4 }],
      encoding: { x: "category", y: "value" },
    },
    /Row 0 for mark "bar" is missing field "value"/,
  );

  assertInvalid(
    {
      mark: "line",
      data: [{ year: 2020, value: "many" }],
      encoding: { x: "year", y: "value" },
    },
    /Field "value" for mark "line" must contain finite numbers/,
  );

  assertInvalid(
    {
      mark: "scatter",
      data: [{ x: "1", y: "2" }],
      encoding: { x: "x", y: "y" },
    },
    /Field "x" for mark "scatter" must contain finite numbers/,
  );

  assert.throws(
    () =>
      new Chart({
        mark: "scatter",
        data: [{ x: "1", y: "2" }],
        encoding: { x: "x", y: "y" },
      }),
    /Field "x" for mark "scatter" must contain finite numbers/,
  );

  assertInvalid(
    {
      mark: "bubble",
      data: [
        { x: 1, y: "North" },
        { x: "2", y: "South" },
      ],
      encoding: { x: "x", y: "y" },
    },
    /Field "x" for mark "bubble" must contain either finite non-negative numbers or strings consistently/,
  );

  assertValid({
    mark: "bubble",
    data: [
      { x: "A", y: "North" },
      { x: "B", y: "South" },
    ],
    encoding: { x: "x", y: "y" },
  });

  assertInvalid(
    {
      mark: "matrix",
      data: [{ column: "C1", row: "R1", active: "0.5" }],
      encoding: { x: "column", group: "row", y: "active" },
    },
    /must contain booleans or numbers between 0 and 1/,
  );

  assertInvalid(
    {
      mark: "pie",
      data: [{ category: "A", value: -1 }],
      encoding: { x: "category", y: "value" },
    },
    /Field "value" for mark "pie" must contain non-negative numbers/,
  );

  assertInvalid(
    {
      mark: "bubble",
      data: [{ category: "A", value: 1, size: -4 }],
      encoding: { x: "category", y: "value", size: "size" },
    },
    /Field "size" for mark "bubble" must contain non-negative numbers/,
  );

  assertInvalid(
    {
      mark: "bar",
      data: [{ year: 2020, value: 4 }],
      encoding: { x: "year", y: "value" },
    },
    /Cannot infer orientation for mark "bar".*convert categorical values to strings/,
  );

  assertInvalid(
    {
      mark: "bar",
      data: [{ start: "A", end: "B" }],
      encoding: { x: "start", y: "end" },
    },
    /Cannot infer orientation for mark "bar".*exactly one of encoding\.x and encoding\.y must contain numbers/,
  );

  assertInvalid(
    {
      mark: "pac",
      data: [{ category: "A", value: -1 }],
      encoding: { x: "value", y: "category" },
    },
    /Field "value" for mark "pac" must contain non-negative numbers/,
  );

  const negativeValueConfigs = [
    {
      mark: "bar",
      data: [{ category: "A", value: -1 }],
      encoding: { x: "category", y: "value" },
    },
    {
      mark: "groupbar",
      data: [{ category: "A", group: "G", value: -1 }],
      encoding: { x: "category", y: "value", group: "group" },
    },
    {
      mark: "stackbar",
      data: [{ category: "A", group: "G", value: -1 }],
      encoding: { x: "category", y: "value", group: "group" },
    },
    {
      mark: "area",
      data: [{ x: 1, y: -1 }],
      encoding: { x: "x", y: "y" },
    },
    {
      mark: "line",
      data: [{ x: -1, y: 1 }],
      encoding: { x: "x", y: "y" },
    },
    {
      mark: "scatter",
      data: [{ x: 1, y: -1 }],
      encoding: { x: "x", y: "y" },
    },
    {
      mark: "box",
      data: [{ category: "A", value: -1 }],
      encoding: { x: "category", y: "value" },
    },
    {
      mark: "dumbbell",
      data: [
        { category: "A", value: -1 },
        { category: "A", value: 1 },
      ],
      encoding: { x: "category", y: "value" },
    },
    {
      mark: "bubble",
      data: [{ x: -1, y: 1 }],
      encoding: { x: "x", y: "y" },
    },
    {
      mark: "flow",
      data: [{ source: "A", target: "B", value: -1 }],
      encoding: { x: "source", group: "target", y: "value" },
    },
    {
      mark: "stream",
      data: [{ x: "A", group: "G", value: -1 }],
      encoding: { x: "x", y: "value", group: "group" },
    },
  ];

  negativeValueConfigs.forEach((config) => {
    assertInvalid(
      config,
      new RegExp(
        `Field ".+" for mark "${config.mark}" must contain non-negative numbers`,
      ),
    );
  });

  assertValid({
    mark: "bar",
    data: [{ category: "A", value: 0 }],
    encoding: { x: "category", y: "value" },
  });
}

{
  assertInvalid(
    {
      mark: "dumbbell",
      data: [
        { category: "A", value: 1 },
        { category: "A", value: 2 },
        { category: "A", value: 3 },
      ],
      encoding: { x: "value", y: "category" },
    },
    /Dumbbell chart requires exactly two rows for each group/,
  );

  assertInvalid(
    {
      mark: "matrix",
      data: [{ column: "C1", sets: ["A"] }],
      encoding: { x: "column", group: "sets", y: "sets" },
    },
    /Matrix mark expects long-cell data; field "sets" must not contain arrays/,
  );

  assertInvalid(
    {
      mark: "matrix",
      data: [{ column: "C1", row: "R1", score: 2 }],
      encoding: { x: "column", group: "row", y: "score" },
    },
    /Field "score" for mark "matrix" must contain booleans or numbers between 0 and 1/,
  );
}

{
  const chart = new Chart({
    mark: "bar",
    data: [{ category: "A", value: 4 }],
    encoding: { x: "category", y: "value" },
  });

  assert.equal(typeof chart.validate, "function");
  assert.doesNotThrow(() => chart.validate());
}

{
  const renderer = new BarChartRenderer({
    mark: "bar",
    data: [{ category: "A", value: 4 }],
    encoding: { x: "category", y: "value" },
  });

  assert.equal(typeof renderer.validate, "function");
  assert.doesNotThrow(() => renderer.validate());
}
