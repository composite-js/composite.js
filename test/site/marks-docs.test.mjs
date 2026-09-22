import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { CHART_TYPE_DEFINITIONS } from "../../src/chart/validation.js";

const marksPagePath = path.resolve(
  process.cwd(),
  "site/src/pages/docs/marks.astro",
);
const marksPageSource = readFileSync(marksPagePath, "utf8");

assert.ok(
  marksPageSource.includes("chart({ mark, data, encoding, ...options })"),
  "Marks docs should introduce the chart configuration shape",
);

Object.keys(CHART_TYPE_DEFINITIONS).forEach((mark) => {
  assert.ok(
    marksPageSource.includes(`id: "${mark}"`),
    `Marks docs should document the ${mark} mark`,
  );
});

["x", "y", "group", "size", "xDomain", "yDomain", "groupDomain"].forEach(
  (channel) => {
    assert.ok(
      marksPageSource.includes(`<code>${channel}</code>`),
      `Marks docs should mention the ${channel} encoding field`,
    );
  },
);

assert.ok(
  marksPageSource.includes('encoding: { x: "category", y: "value" }'),
  "Marks docs should show that data field names are separate from channel keys",
);

["encoding.category", "encoding.value"].forEach((legacyExample) => {
  assert.ok(
    !marksPageSource.includes(legacyExample),
    `Marks docs should avoid legacy channel examples: ${legacyExample}`,
  );
});
