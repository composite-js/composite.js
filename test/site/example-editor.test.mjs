import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { examples } from "../../site/src/data/examples.js";

const root = process.cwd();
const detailPath = path.resolve(root, "site/src/pages/examples/[slug].astro");
const editorPath = path.resolve(
  root,
  "site/src/components/ExampleEditor.astro",
);
const packagePath = path.resolve(root, "package.json");
const stylesheetPath = path.resolve(root, "site/src/styles/global.css");
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
  const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
  [
    "codemirror",
    "@codemirror/commands",
    "@codemirror/lang-javascript",
    "@codemirror/view",
  ].forEach((dependency) => {
    assert.ok(
      packageJson.devDependencies?.[dependency],
      `package.json should include ${dependency}`,
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
  assert.ok(
    editorSource.indexOf("data-editor-preview") <
      editorSource.indexOf("data-editor-code"),
    "ExampleEditor should render the preview before the code editor",
  );
  [
    'import("codemirror")',
    'import("@codemirror/commands")',
    'import("@codemirror/lang-javascript")',
    'import("@codemirror/view")',
    "new EditorView",
    "basicSetup",
    "javascript()",
    "indentWithTab",
    "keymap.of([indentWithTab])",
    "EditorView.updateListener",
  ].forEach((expectedSource) => {
    assert.ok(
      editorSource.includes(expectedSource),
      `ExampleEditor should lazy-initialize CodeMirror: ${expectedSource}`,
    );
  });
  [
    'from "codemirror"',
    'from "@codemirror/commands"',
    'from "@codemirror/lang-javascript"',
    'from "@codemirror/view"',
  ].forEach((staticImport) => {
    assert.ok(
      !editorSource.includes(staticImport),
      `ExampleEditor should not statically import CodeMirror: ${staticImport}`,
    );
  });
  assert.ok(
    editorSource.includes('backgroundColor: "#ffffff"'),
    "ExampleEditor CodeMirror theme should use a white editor background",
  );
  assert.ok(
    editorSource.includes('color: "#172033"'),
    "ExampleEditor CodeMirror theme should use normal dark text",
  );
  assert.ok(
    editorSource.includes('height: "360px"'),
    "ExampleEditor CodeMirror theme should use a fixed editor height",
  );
  assert.ok(
    !editorSource.includes('minHeight: "560px"'),
    "ExampleEditor CodeMirror theme should not keep the former tall minimum height",
  );
  assert.ok(
    !editorSource.includes('backgroundColor: "#101827"'),
    "ExampleEditor CodeMirror theme should not keep the former dark editor background",
  );
}

{
  const stylesheetSource = readFileSync(stylesheetPath, "utf8");
  const workspaceRule = stylesheetSource.match(
    /\.example-editor__workspace\s*\{(?<body>[^}]*)\}/,
  );
  const editorRule = stylesheetSource.match(
    /\.example-editor__code,\s*\.example-editor__cm\s*\{(?<body>[^}]*)\}/,
  );
  const codeRule = stylesheetSource.match(
    /\.example-editor__code\s*\{(?<body>[^}]*)\}/,
  );
  const cmEditorRule = stylesheetSource.match(
    /\.example-editor__cm \.cm-editor\s*\{(?<body>[^}]*)\}/,
  );
  const scrollerRule = stylesheetSource.match(
    /\.example-editor__cm \.cm-scroller\s*\{(?<body>[^}]*)\}/,
  );
  const previewRule = stylesheetSource.match(
    /\.example-editor__preview\s*\{(?<body>[^}]*)\}/,
  );

  assert.ok(
    workspaceRule?.groups?.body,
    "Editor workspace should have a CSS rule",
  );
  assert.match(
    workspaceRule.groups.body,
    /grid-template-columns:\s*1fr;/,
    "Editor workspace should stack preview and code vertically",
  );
  assert.match(
    workspaceRule.groups.body,
    /grid-template-rows:\s*minmax\(420px,\s*58vh\) 360px;/,
    "Editor workspace should reserve fixed code height below the preview",
  );
  assert.ok(editorRule?.groups?.body, "Editor styles should share a CSS rule");
  assert.match(
    editorRule.groups.body,
    /background:\s*#ffffff;/,
    "Editor styles should use a white background",
  );
  assert.match(
    editorRule.groups.body,
    /color:\s*#172033;/,
    "Editor styles should use normal dark text",
  );
  assert.doesNotMatch(
    editorRule.groups.body,
    /#101827|#dbeafe/,
    "Editor styles should not keep the former dark code colors",
  );
  assert.match(
    editorRule.groups.body,
    /height:\s*360px;/,
    "Editor styles should use a fixed code editor height",
  );
  assert.doesNotMatch(
    editorRule.groups.body,
    /min-height:\s*560px;/,
    "Editor styles should not keep the former tall code editor height",
  );
  assert.match(
    codeRule?.groups?.body || "",
    /resize:\s*none;/,
    "Textarea fallback should not resize the fixed editor area",
  );
  assert.match(
    codeRule?.groups?.body || "",
    /overflow:\s*auto;/,
    "Textarea fallback should scroll within the fixed editor area",
  );
  assert.match(
    cmEditorRule?.groups?.body || "",
    /height:\s*360px;/,
    "CodeMirror editor should use the same fixed height",
  );
  assert.match(
    scrollerRule?.groups?.body || "",
    /overflow:\s*auto;/,
    "CodeMirror scroller should handle long snippets internally",
  );
  assert.match(
    previewRule?.groups?.body || "",
    /height:\s*min\(58vh,\s*620px\);/,
    "Preview should have a stable top-panel height",
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
