import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  createExampleSnippet,
  exportSiteExamples,
  isDirectExecution,
  syncExampleSnippet,
} from "../../scripts/export-site-examples.mjs";

{
  const scriptPath = path.join(process.cwd(), "scripts/export-site-examples.mjs");

  assert.equal(
    isDirectExecution(undefined, pathToFileURL(scriptPath).href),
    false,
  );
  assert.equal(isDirectExecution(scriptPath, pathToFileURL(scriptPath).href), true);
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

{
  const snippet = createExampleSnippet(exampleSource);

  assert.equal(snippet, expectedSnippet);
  assert.doesNotMatch(snippet, /^\s*import\s/m);
  assert.doesNotMatch(snippet, /^\s*export\s/m);
  assert.doesNotMatch(snippet, /\bcreateExample\b/);
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
    assert.equal(
      result.outputPath,
      path.join(snippetDir, "foo.txt"),
    );
    assert.equal(
      readFileSync(result.outputPath, "utf8"),
      `${expectedSnippet}\n`,
    );
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
}

{
  const tempRoot = mkdtempSync(
    path.join(os.tmpdir(), "composite-example-export-"),
  );
  const examplesDir = path.join(tempRoot, "examples");
  const snippetDir = path.join(tempRoot, "example-snippets");
  const outputDir = path.join(tempRoot, "public-examples");
  const exportSource = `const final = {
  async export() {}
};

export function createExample() {
  return final;
}
`;

  try {
    mkdirSync(examplesDir, { recursive: true });
    writeFileSync(path.join(examplesDir, "foo.js"), exportSource);

    await exportSiteExamples({
      examples: [{ slug: "foo" }],
      examplesDir,
      logger: () => {},
      outputDir,
      snippetDir,
    });

    assert.equal(
      readFileSync(path.join(snippetDir, "foo.txt"), "utf8"),
      `const final = {
  async export() {}
};

return final;\n`,
    );
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
}
