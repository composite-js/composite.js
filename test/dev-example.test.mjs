import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import {
  parseExampleName,
  resolveExamplePath,
} from "../scripts/dev-example.mjs";

{
  assert.equal(parseExampleName([]), "upset");
  assert.equal(parseExampleName(["--example", "dropoutseer"]), "dropoutseer");
  assert.equal(parseExampleName(["--example=dropoutseer"]), "dropoutseer");
}

{
  const resolved = resolveExamplePath("dropoutseer", {
    cwd: process.cwd(),
  });

  assert.ok(
    resolved.endsWith("examples\\dropoutseer.js") ||
      resolved.endsWith("examples/dropoutseer.js"),
  );
}

{
  assert.throws(
    () => resolveExamplePath("does-not-exist", { cwd: process.cwd() }),
    /Example not found: does-not-exist/,
  );
}

{
  const examplesDir = path.resolve(process.cwd(), "examples");
  const exampleFiles = readdirSync(examplesDir).filter((file) =>
    file.endsWith(".js"),
  );

  exampleFiles.forEach((file) => {
    const source = readFileSync(path.join(examplesDir, file), "utf8");
    assert.ok(
      !source.includes("../src/layout.js"),
      `${file} should import public APIs from ../src/index.js`,
    );
  });
}

{
  const source = readFileSync(
    path.resolve(process.cwd(), "examples", "scatterplotmatrix.js"),
    "utf8",
  );

  assert.ok(
    !source.includes("domainFor("),
    "scatterplotmatrix should rely on chart domain inference",
  );
  assert.ok(
    !source.includes("xDomain:"),
    "scatterplotmatrix should not hard-code x domains per cell",
  );
  assert.ok(
    !source.includes("yDomain:"),
    "scatterplotmatrix should not hard-code y domains per cell",
  );
  assert.ok(
    !source.includes('cellSizing: "fill"'),
    "scatterplotmatrix should rely on gridContainer default cell sizing",
  );
  assert.ok(
    !source.includes("showGrid: true"),
    "scatterplotmatrix should rely on gridContainer default grid rendering",
  );
  assert.ok(
    !source.includes("shareDomains: false"),
    "scatterplotmatrix should not expose repeat shared-domain internals",
  );
  assert.ok(
    !source.includes('className: "splom'),
    "scatterplotmatrix should not need test-only CSS classes",
  );
  assert.ok(
    source.includes("align: [null, matrix]"),
    "scatterplotmatrix should keep matrix alignment explicit",
  );
  assert.ok(
    source.includes("./dataset/iris.csv"),
    "scatterplotmatrix should load the checked-in Iris CSV dataset",
  );
  ["loadCsvText", "parseCsv", "numericColumns", "crossJoin"].forEach(
    (helper) => {
      assert.ok(
        source.includes(helper),
        `scatterplotmatrix should use ${helper} for data-driven setup`,
      );
    },
  );
  assert.ok(
    !source.includes("async function loadCsvText"),
    "scatterplotmatrix should use the shared data loader instead of defining its own",
  );
  assert.ok(
    !source.includes("speciesProfiles"),
    "scatterplotmatrix should not use synthetic species profile data",
  );
  assert.ok(
    !source.includes("Array.from({ length: 18 }"),
    "scatterplotmatrix should not generate synthetic samples",
  );
}
