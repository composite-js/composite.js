import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  crossJoin,
  loadCsvText,
  numericColumns,
  parseCsv,
  tableColumns,
} from "../../src/index.js";

{
  const rows = parseCsv("category,value\nA,12\nB,18\n");

  assert.deepEqual(tableColumns(rows), ["category", "value"]);
  assert.deepEqual(
    [...rows],
    [
      { category: "A", value: 12 },
      { category: "B", value: 18 },
    ],
  );
}

{
  const rows = parseCsv("5.1,3.5,setosa\n4.9,3.0,setosa\n", {
    columns: ["sepal_length", "sepal_width", "species"],
  });

  assert.deepEqual(tableColumns(rows), [
    "sepal_length",
    "sepal_width",
    "species",
  ]);
  assert.deepEqual(
    [...rows],
    [
      { sepal_length: 5.1, sepal_width: 3.5, species: "setosa" },
      { sepal_length: 4.9, sepal_width: 3, species: "setosa" },
    ],
  );
}

{
  const rows = parseCsv("category,value\nA,12\nB,18\n", {
    autoType: false,
  });

  assert.deepEqual(
    [...rows],
    [
      { category: "A", value: "12" },
      { category: "B", value: "18" },
    ],
  );
}

{
  const rows = [
    { category: "A", value: 12, ratio: "0.5", notes: "" },
    { category: "B", value: 18, ratio: "0.75", notes: null },
  ];

  assert.deepEqual(numericColumns(rows), ["value", "ratio"]);
  assert.deepEqual(numericColumns(rows, { exclude: ["ratio"] }), ["value"]);
  assert.deepEqual(numericColumns(rows, { columns: ["category", "value"] }), [
    "value",
  ]);
}

{
  assert.deepEqual(tableColumns([]), []);
  assert.deepEqual(numericColumns([]), []);
}

{
  assert.deepEqual(crossJoin(["x", "y"], [1, 2]), [
    ["x", 1],
    ["x", 2],
    ["y", 1],
    ["y", 2],
  ]);

  assert.deepEqual(
    crossJoin(["x", "y"], [1, 2], (left, right, leftIndex, rightIndex) => ({
      id: `${leftIndex}-${rightIndex}`,
      left,
      right,
    })),
    [
      { id: "0-0", left: "x", right: 1 },
      { id: "0-1", left: "x", right: 2 },
      { id: "1-0", left: "y", right: 1 },
      { id: "1-1", left: "y", right: 2 },
    ],
  );
}

{
  const dataSource = readFileSync(
    path.join(process.cwd(), "src", "data.js"),
    "utf8",
  );

  assert.match(
    dataSource,
    /const\s+fsPromisesModulePath\s*=\s*"node:fs\/promises";[\s\S]*import\(\s*\/\*\s*@vite-ignore\s*\*\/\s*fsPromisesModulePath\s*\)/,
    "Node-only file loader import should use a Vite-ignored dynamic module path",
  );
}

{
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "composite-csv-"));
  const csvPath = path.join(tempRoot, "table.csv");

  try {
    writeFileSync(csvPath, "category,value\nA,12\n");

    assert.equal(
      await loadCsvText(pathToFileURL(csvPath)),
      "category,value\nA,12\n",
    );
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
}
