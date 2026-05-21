# Interactive Example Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace example detail page static previews with a lightweight textarea editor and sandboxed iframe preview, while keeping gallery preview images unchanged.

**Architecture:** Store editable example snippets as site-local raw text files. Astro injects the selected snippet into an `ExampleEditor` component on each example detail page. A same-origin runner page inside a sandboxed iframe imports the local composite library, executes the controlled snippet with allowed helpers, renders the returned layout node, and reports status/errors to the parent page.

**Tech Stack:** Astro, native browser APIs, ESM, Node `assert` tests, existing composite.js layout/rendering APIs.

---

## File Structure

- Create `site/src/data/example-snippets/*.txt`: editable function-body snippets for each example.
- Create `site/src/data/example-snippets.js`: Vite raw-import map from example slug/source to snippet text.
- Create `site/src/components/ExampleEditor.astro`: textarea, toolbar, iframe, status/error UI, parent-page script.
- Create `site/src/pages/examples/editor-runner.astro`: minimal iframe document that imports composite helpers and executes snippets.
- Modify `site/src/pages/examples/[slug].astro`: replace static detail preview and current code panel with `ExampleEditor`.
- Modify `site/src/styles/global.css`: editor, toolbar, textarea, iframe, and status styles.
- Create `test/site/example-editor.test.mjs`: source-level coverage for detail page, snippet files, editor component, and runner.
- Modify `test/run.mjs`: include the new site editor test.

## Task 1: Add Failing Site Editor Tests

**Files:**
- Create: `test/site/example-editor.test.mjs`
- Modify: `test/run.mjs`

- [ ] **Step 1: Write the failing tests**

Create `test/site/example-editor.test.mjs` with:

```js
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
    assert.match(snippet, /\breturn\b/, `${example.slug} snippet should return a node`);
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
    runnerSource.includes("../../../../src/index.js"),
    "Runner should import the local composite library",
  );
  assert.ok(
    runnerSource.includes("new Function"),
    "Runner should execute snippets through a function wrapper",
  );
  assert.ok(
    runnerSource.includes("composite-example-runner"),
    "Runner should identify status messages sent to the parent page",
  );
}
```

Update `test/run.mjs` by adding the new import after existing site tests:

```js
import "./site/example-editor.test.mjs";
```

- [ ] **Step 2: Run the new test to verify it fails**

Run: `node test/site/example-editor.test.mjs`

Expected: FAIL because `ExampleEditor.astro`, `editor-runner.astro`, and snippet files do not exist yet.

## Task 2: Add Snippet Data

**Files:**
- Create: `site/src/data/example-snippets/upset.txt`
- Create: `site/src/data/example-snippets/dropoutseer.txt`
- Create: `site/src/data/example-snippets/olympic.txt`
- Create: `site/src/data/example-snippets/nobel.txt`
- Create: `site/src/data/example-snippets/iforum.txt`
- Create: `site/src/data/example-snippets/mirror.txt`
- Create: `site/src/data/example-snippets.js`

- [ ] **Step 1: Create snippet files**

For each current `examples/*.js` file, copy the example body into the matching
`.txt` file, remove the import/export/browser mounting code, and end with a
direct `return <node>;` statement. For example, `upset.txt` should end with:

```js
const composite = stackX([leftBarChart, matrixChart, boxChart, stackBarChart]);
const final = stackY([topBarChart, composite, pieRow], {
  align: [null, matrixChart, null],
});

return final;
```

`dropoutseer.txt` should include the same data and layout logic as
`examples/dropoutseer.js`, but end with:

```js
return stackX([sequence, flow, bars]);
```

`iforum.txt` should include the same data and layout logic as
`examples/iforum.js`, but end with:

```js
return figure;
```

`mirror.txt` should include the same data and layout logic as
`examples/mirror.js`, but end with:

```js
return mirror;
```

`nobel.txt` should include the same data and layout logic as
`examples/nobel.js`, but end with:

```js
return nobelRows;
```

`olympic.txt` should include the same data and layout logic as
`examples/olympic.js`, but end with:

```js
return composite;
```

- [ ] **Step 2: Add the raw import map**

Create `site/src/data/example-snippets.js`:

```js
import dropoutseer from "./example-snippets/dropoutseer.txt?raw";
import iforum from "./example-snippets/iforum.txt?raw";
import mirror from "./example-snippets/mirror.txt?raw";
import nobel from "./example-snippets/nobel.txt?raw";
import olympic from "./example-snippets/olympic.txt?raw";
import upset from "./example-snippets/upset.txt?raw";

const snippets = {
  dropoutseer,
  iforum,
  mirror,
  nobel,
  olympic,
  upset,
};

export function getExampleSnippet(example) {
  const source = example.source || example.slug;
  const snippet = snippets[source];

  if (!snippet) {
    throw new Error(`Missing editable snippet for example: ${source}`);
  }

  return snippet.trim();
}
```

- [ ] **Step 3: Run the focused test**

Run: `node test/site/example-editor.test.mjs`

Expected: still FAIL because the editor component and runner page are not implemented yet.

## Task 3: Add Editor Component and Runner

**Files:**
- Create: `site/src/components/ExampleEditor.astro`
- Create: `site/src/pages/examples/editor-runner.astro`

- [ ] **Step 1: Implement the editor component**

Create `site/src/components/ExampleEditor.astro` with a textarea, run/reset
buttons, sandboxed iframe, status output, and a client script that posts snippets
to the runner iframe and listens for runner status messages.

The component props are:

```js
const { example, snippet, runnerSrc } = Astro.props;
```

The iframe must use:

```astro
sandbox="allow-scripts allow-same-origin"
```

The parent message source strings must be:

```js
const editorMessageSource = "composite-example-editor";
const runnerMessageSource = "composite-example-runner";
```

- [ ] **Step 2: Implement the runner page**

Create `site/src/pages/examples/editor-runner.astro` as a minimal HTML document.
Its module script imports:

```js
import * as composite from "../../../../src/index.js";
```

It should expose these helpers to snippets:

```js
const helpers = {
  chart: composite.chart,
  embed: composite.embed,
  frame: composite.frame,
  image: composite.image,
  repeat: composite.repeat,
  repeatX: composite.repeatX,
  repeatY: composite.repeatY,
  sequenceContainer: composite.sequenceContainer,
  stackX: composite.stackX,
  stackY: composite.stackY,
  text: composite.text,
};
```

It should execute snippets with:

```js
const helperNames = Object.keys(helpers);
const runSnippet = new Function(...helperNames, snippet);
const node = runSnippet(...helperNames.map((name) => helpers[name]));
```

It must validate:

```js
if (!node || typeof node.render !== "function") {
  throw new Error("Snippet must return a composite layout node.");
}
```

- [ ] **Step 3: Run the focused test**

Run: `node test/site/example-editor.test.mjs`

Expected: FAIL until the detail page uses `ExampleEditor` and removes the static preview.

## Task 4: Wire the Detail Page and Styles

**Files:**
- Modify: `site/src/pages/examples/[slug].astro`
- Modify: `site/src/styles/global.css`

- [ ] **Step 1: Replace static preview with the editor**

Update `site/src/pages/examples/[slug].astro` to import:

```js
import ExampleEditor from "../../components/ExampleEditor.astro";
import { getExampleSnippet } from "../../data/example-snippets.js";
```

Resolve:

```js
const snippet = getExampleSnippet(example);
const runnerSrc = `${base}examples/editor-runner/`;
```

Render:

```astro
<SectionShell title={example.title}>
  <ExampleEditor example={example} snippet={snippet} runnerSrc={runnerSrc} />
</SectionShell>
```

Remove the old `imageSrc` and `example-detail-preview` rendering.

- [ ] **Step 2: Add editor styles**

Add CSS rules for:

```css
.example-editor
.example-editor__toolbar
.example-editor__button
.example-editor__status
.example-editor__workspace
.example-editor__code
.example-editor__preview
.example-editor__error
```

Use a two-column desktop layout and a single-column mobile layout. Keep static
gallery preview styles unchanged.

- [ ] **Step 3: Run the focused test**

Run: `node test/site/example-editor.test.mjs`

Expected: PASS.

## Task 5: Verify the Full Change

**Files:**
- No additional code changes expected.

- [ ] **Step 1: Run the full Node test suite**

Run: `pnpm run test`

Expected: PASS with `All tests passed`.

- [ ] **Step 2: Run lint**

Run: `pnpm run lint`

Expected: PASS with no ESLint errors.

- [ ] **Step 3: Run the Astro site build**

Run: `pnpm run site:build`

Expected: PASS and a generated static site under `site/dist`.

- [ ] **Step 4: Inspect git status**

Run: `git status --short`

Expected: changes limited to the spec/plan docs, new snippet/editor/runner files,
modified example detail page, modified stylesheet, and new/updated tests.
