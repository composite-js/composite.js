import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const runnerPath = path.resolve(
  root,
  "site/src/pages/examples/preview-runner.astro",
);
const runnerScriptPath = path.resolve(
  root,
  "site/src/scripts/example-preview-runner.js",
);

assert.ok(existsSync(runnerPath), "Example preview runner page should exist");
assert.ok(
  existsSync(runnerScriptPath),
  "Example preview runner script should exist",
);

const runnerSource = readFileSync(runnerPath, "utf8");
const runnerScriptSource = readFileSync(runnerScriptPath, "utf8");

[
  "../../scripts/example-preview-runner.js",
  'id="viewport"',
  'id="app"',
].forEach((expectedSource) => {
  assert.ok(
    runnerSource.includes(expectedSource),
    `Example preview runner page should include ${expectedSource}`,
  );
});

[
  "../data/examples.js",
  "../data/example-snippets.js",
  "../../../src/index.js",
  'from "d3"',
  "URLSearchParams",
  "exampleSlug",
  "getExampleBySlug",
  "getExampleSnippet",
  "node.render",
  "fitRenderedPreview",
  "AsyncFunction",
  "await runSnippet",
  "crossJoin: composite.crossJoin",
  "gridContainer: composite.gridContainer",
  "loadCsvText: composite.loadCsvText",
  "numericColumns: composite.numericColumns",
  "parseCsv: composite.parseCsv",
  "exampleAssetUrl",
].forEach((expectedSource) => {
  assert.ok(
    runnerScriptSource.includes(expectedSource),
    `Example preview runner script should include ${expectedSource}`,
  );
});

assert.ok(
  runnerScriptSource.includes("Missing example") ||
    runnerScriptSource.includes("Unknown example"),
  "Example preview runner should reject unregistered example slugs",
);
assert.doesNotMatch(
  runnerScriptSource,
  /searchParams\.get\(["']snippet["']\)/,
  "Example preview runner should not execute snippets passed through the URL",
);
assert.doesNotMatch(
  runnerScriptSource,
  /new Function\([^)]*searchParams/u,
  "Example preview runner should not compile code directly from URL parameters",
);
