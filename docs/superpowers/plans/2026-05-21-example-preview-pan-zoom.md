# Example Preview Pan Zoom Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add basic drag-to-pan, wheel-to-zoom, and double-click reset behavior to the interactive example preview iframe.

**Architecture:** Keep composite.js rendering unchanged. The iframe runner renders into `#app`, wraps it with `#viewport`, and applies CSS transforms to `#app` for view state. Pointer and wheel handlers live in `site/src/scripts/example-runner.js` so the interaction is isolated inside the preview iframe.

**Tech Stack:** Astro, browser Pointer Events, wheel events, CSS transforms, existing Node `assert` tests.

---

## Task 1: Source-Level Coverage

**Files:**

- Modify: `test/site/example-editor.test.mjs`

- [ ] **Step 1: Add failing assertions**

Add assertions that the runner page contains `id="viewport"` and that the runner
script contains `pointerdown`, `wheel`, `dblclick`, `applyPreviewTransform`, and
`resetPreviewTransform`.

- [ ] **Step 2: Run the focused test**

Run: `node test/site/example-editor.test.mjs`

Expected: FAIL because runner markup and pan/zoom script are not implemented.

## Task 2: Runner Markup and Interaction

**Files:**

- Modify: `site/src/pages/examples/editor-runner.astro`
- Modify: `site/src/scripts/example-runner.js`

- [ ] **Step 1: Add viewport markup and styles**

Change the runner body to:

```html
<div id="viewport">
  <div id="app"></div>
</div>
```

Style `#viewport` as the full iframe interaction surface with overflow hidden,
and style `#app` with `transform-origin: 0 0`, `width: max-content`, and
`will-change: transform`.

- [ ] **Step 2: Add transform state and helpers**

In `site/src/scripts/example-runner.js`, add `previewTransform` with `x`, `y`,
and `scale`. Add `applyPreviewTransform()` and `resetPreviewTransform()`.

- [ ] **Step 3: Add interactions**

Attach handlers to `#viewport`:

- `pointerdown`, `pointermove`, `pointerup`, and `pointercancel` for panning.
- `wheel` with `preventDefault()` for zooming around the pointer position.
- `dblclick` for reset.

Clamp scale between `0.2` and `4`.

- [ ] **Step 4: Reset view on render**

Call `resetPreviewTransform()` before each snippet render so each `Run` starts
from a clean view state.

## Task 3: Verification

**Files:**

- No additional files expected.

- [ ] **Step 1: Run focused test**

Run: `node test/site/example-editor.test.mjs`

Expected: PASS.

- [ ] **Step 2: Run full checks**

Run:

```bash
pnpm run test
pnpm run lint
pnpm run site:build
```

Expected: all commands exit 0.
