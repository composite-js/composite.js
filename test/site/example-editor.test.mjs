import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { examples } from "../../site/src/data/examples.js";

const root = process.cwd();
const detailPath = path.resolve(root, "site/src/pages/examples/[slug].astro");
const editorPath = path.resolve(root, "site/src/components/ExampleEditor.astro");
const runnerPath = path.resolve(
  root,
  "site/src/pages/examples/editor-runner.astro",
);
const runnerScriptPath = path.resolve(
  root,
  "site/src/scripts/example-runner.js",
);
const snippetDir = path.resolve(root, "site/src/data/example-snippets");

{
  const detailSource = readFileSync(detailPath, "utf8");

  assert.ok(
    detailSource.includes("ExampleEditor"),
    "Example detail page should render the interactive editor component",
  );
  assert.ok(
    detailSource.includes("getExampleSnippet"),
    "Example detail page should resolve an editable snippet for the example",
  );
  assert.ok(
    !detailSource.includes("example-detail-preview"),
    "Example detail page should not render the former static detail preview",
  );
}

{
  examples.forEach((example) => {
    const source = example.source || example.slug;
    const snippetPath = path.join(snippetDir, `${source}.txt`);

    assert.ok(
      existsSync(snippetPath),
      `${example.slug} should have an editable snippet file`,
    );

    const snippet = readFileSync(snippetPath, "utf8");
    assert.match(
      snippet,
      /\breturn\b/,
      `${example.slug} snippet should return a node`,
    );
    assert.doesNotMatch(
      snippet,
      /^\s*import\s/m,
      `${example.slug} snippet should not contain imports`,
    );
    assert.doesNotMatch(
      snippet,
      /^\s*export\s/m,
      `${example.slug} snippet should not contain exports`,
    );
  });
}

{
  const editorSource = readFileSync(editorPath, "utf8");

  assert.ok(
    editorSource.includes("data-example-editor"),
    "ExampleEditor should expose a client-side editor root",
  );
  assert.ok(
    editorSource.includes('sandbox="allow-scripts allow-same-origin"'),
    "ExampleEditor iframe should use the expected sandbox permissions",
  );
  assert.ok(
    editorSource.includes("data-editor-reset"),
    "ExampleEditor should provide a reset control",
  );
  assert.ok(
    editorSource.includes("data-editor-run"),
    "ExampleEditor should provide a run control",
  );
}

{
  const runnerSource = readFileSync(runnerPath, "utf8");

  assert.ok(
    runnerSource.includes("../../scripts/example-runner.js"),
    "Runner page should reference a Vite-processed local runner script",
  );
  assert.ok(
    runnerSource.includes('id="viewport"'),
    "Runner page should provide a viewport for preview pan and zoom",
  );
  assert.ok(
    !runnerSource.includes("../../../../src/index.js"),
    "Runner page should not leave a browser-resolved import to /src/index.js",
  );
}

{
  const runnerScriptSource = readFileSync(runnerScriptPath, "utf8");

  assert.ok(
    runnerScriptSource.includes("../../../src/index.js"),
    "Runner script should import the local composite library before bundling",
  );
  assert.ok(
    runnerScriptSource.includes("new Function"),
    "Runner should execute snippets through a function wrapper",
  );
  assert.ok(
    runnerScriptSource.includes("composite-example-runner"),
    "Runner should identify status messages sent to the parent page",
  );
  [
    "applyPreviewTransform",
    "resetPreviewTransform",
    "pointerdown",
    "wheel",
    "dblclick",
  ].forEach((expectedSource) => {
    assert.ok(
      runnerScriptSource.includes(expectedSource),
      `Runner should support preview interaction: ${expectedSource}`,
    );
  });
}
