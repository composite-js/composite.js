import assert from "node:assert/strict";
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { examples } from "../../site/src/data/examples.js";
import {
  createExampleSnippet,
  exportSiteExamples,
  isDirectExecution,
  syncExampleSnippet,
} from "../../scripts/export-site-examples.mjs";

{
  const scriptPath = path.join(
    process.cwd(),
    "scripts/export-site-examples.mjs",
  );

  assert.equal(
    isDirectExecution(undefined, pathToFileURL(scriptPath).href),
    false,
  );
  assert.equal(
    isDirectExecution(scriptPath, pathToFileURL(scriptPath).href),
    true,
  );
}

const exampleSource = `import { chart, stackY } from "../src/index.js";

const bars = chart({
  data: [{ category: "A", value: 3 }],
  mark: "bar",
  encoding: {
    x: "category",
    y: "value",
  },
});
const final = stackY([bars]);

export function createExample() {
  return final;
}

if (typeof document !== "undefined") {
  createExample().render(document.getElementById("app"));
}
`;

const expectedSnippet = `const bars = chart({
  data: [{ category: "A", value: 3 }],
  mark: "bar",
  encoding: {
    x: "category",
    y: "value",
  },
});
const final = stackY([bars]);

return final;`;

const asyncExampleSource = `import { chart, loadCsvText, parseCsv } from "../src/index.js";

const rowsUrl = new URL("./dataset/rows.csv", import.meta.url);

export async function createExample() {
  const csvText = await loadCsvText(rowsUrl);
  const rows = parseCsv(csvText);

  return chart({
    data: rows,
    mark: "scatter",
    encoding: {
      x: "x",
      y: "y",
    },
  });
}
`;

const expectedAsyncSnippet = `const rowsUrl = exampleAssetUrl("dataset/rows.csv");

const csvText = await loadCsvText(rowsUrl);
const rows = parseCsv(csvText);

return chart({
  data: rows,
  mark: "scatter",
  encoding: {
    x: "x",
    y: "y",
  },
});`;

{
  const snippet = createExampleSnippet(exampleSource);

  assert.equal(snippet, expectedSnippet);
  assert.doesNotMatch(snippet, /^\s*import\s/m);
  assert.doesNotMatch(snippet, /^\s*export\s/m);
  assert.doesNotMatch(snippet, /\bcreateExample\b/);
}

{
  const snippet = createExampleSnippet(asyncExampleSource);

  assert.equal(snippet, expectedAsyncSnippet);
  assert.doesNotMatch(snippet, /^\s*import\s/m);
  assert.doesNotMatch(snippet, /^\s*export\s/m);
  assert.doesNotMatch(snippet, /\bimport\.meta\b/);
}

{
  const tempRoot = mkdtempSync(
    path.join(os.tmpdir(), "composite-example-snippet-"),
  );
  const examplesDir = path.join(tempRoot, "examples");
  const snippetDir = path.join(tempRoot, "example-snippets");

  try {
    mkdirSync(examplesDir, { recursive: true });
    writeFileSync(path.join(examplesDir, "foo.js"), exampleSource);

    const result = await syncExampleSnippet(
      { slug: "foo" },
      { examplesDir, snippetDir },
    );

    assert.equal(result.source, "foo");
    assert.equal(result.outputPath, path.join(snippetDir, "foo.txt"));
    assert.equal(
      readFileSync(result.outputPath, "utf8"),
      `${expectedSnippet}\n`,
    );
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
}

{
  examples.forEach((example) => {
    const source = example.source || example.slug;
    const examplePath = path.join(process.cwd(), "examples", `${source}.js`);
    const snippetPath = path.join(
      process.cwd(),
      "site",
      "src",
      "data",
      "example-snippets",
      `${source}.txt`,
    );

    assert.doesNotMatch(
      readFileSync(examplePath, "utf8"),
      /Math\.random/u,
      `${source} example should use deterministic data`,
    );
    assert.doesNotMatch(
      readFileSync(snippetPath, "utf8"),
      /Math\.random/u,
      `${source} snippet should use deterministic data`,
    );
  });
}

{
  const tempRoot = mkdtempSync(
    path.join(os.tmpdir(), "composite-example-export-"),
  );
  const examplesDir = path.join(tempRoot, "examples");
  const datasetDir = path.join(examplesDir, "dataset");
  const snippetDir = path.join(tempRoot, "example-snippets");
  const outputDir = path.join(tempRoot, "public-examples");
  const exportSource = `const final = {
  render() {}
};

export function createExample() {
  return final;
}
`;
  const messages = [];

  try {
    mkdirSync(examplesDir, { recursive: true });
    mkdirSync(datasetDir, { recursive: true });
    writeFileSync(path.join(examplesDir, "foo.js"), exportSource);
    writeFileSync(path.join(datasetDir, "rows.csv"), "x,y\n1,2\n");

    await exportSiteExamples({
      examples: [{ slug: "foo" }],
      examplesDir,
      logger: (message) => messages.push(message),
      outputDir,
      snippetDir,
    });

    assert.equal(
      readFileSync(path.join(snippetDir, "foo.txt"), "utf8"),
      `const final = {
  render() {}
};

return final;\n`,
    );
    assert.equal(
      readFileSync(path.join(outputDir, "dataset", "rows.csv"), "utf8"),
      "x,y\n1,2\n",
    );
    assert.deepEqual(messages, [
      `Synced ${path.relative(process.cwd(), path.join(snippetDir, "foo.txt"))}`,
    ]);
    assert.equal(existsSync(path.join(outputDir, "foo.svg")), false);
    assert.equal(existsSync(path.join(outputDir, "foo.png")), false);
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
}
