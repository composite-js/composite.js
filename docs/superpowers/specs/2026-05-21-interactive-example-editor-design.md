# Interactive Example Editor Design

## Goal

Add an interactive editor to each example detail page in the Astro site. The
editor lets users modify a controlled JavaScript snippet and re-render the
example in place. The example gallery and external previews continue to use the
pre-rendered image assets in `site/public/examples/`.

## User Experience

The examples index remains a static gallery. Each card continues to show the
existing generated SVG or PNG preview and links to the example detail page.

Each detail page replaces the current large static preview image with an
interactive work area:

- A textarea containing the editable snippet for the current example.
- A preview iframe that renders the returned composite layout node.
- A small toolbar with `Run` and `Reset` controls.
- A status or error area that reports syntax errors, runtime errors, and invalid
  return values.

The editor auto-runs after a short debounce when the snippet changes. The `Run`
button remains available for explicit retries. `Reset` restores the original
snippet for the page.

## Snippet Contract

The editable snippet is not a full JavaScript module. It is the body of a
function that receives the public composite helpers through the page runtime.

The runtime provides at least these helpers:

- `chart`
- `stackX`
- `stackY`
- `repeatX`
- `repeatY`

The snippet must return a layout node with a `render(container)` method. A
typical snippet looks like this:

```js
const data = [
  { category: "A", value: 12 },
  { category: "B", value: 18 },
];

return chart({
  data,
  mark: "bar",
  encoding: {
    x: "category",
    y: "value",
  },
});
```

The detail page owns the render boilerplate. Users do not edit imports,
exports, or direct DOM mounting code.

## Source Organization

The complete examples in `examples/*.js` remain the source for development
server demos and static asset export.

The site adds controlled snippet files for the editor, scoped to the site. A
recommended layout is:

```text
site/src/data/example-snippets/
  upset.js
  dropoutseer.js
  olympic.js
  nobel.js
  iforum.js
  mirror.js
```

The examples metadata can continue to use the existing `slug` field. The detail
page resolves the snippet from the same slug unless an example explicitly
defines a separate `source` value.

The initial implementation should not try to auto-extract snippets from
`examples/*.js`. Keeping snippets explicit avoids brittle source parsing and
keeps the editor contract clear.

## Client Architecture

Create a client-side editor script or component used by
`site/src/pages/examples/[slug].astro`. Astro renders the initial snippet text
into the page at build time, and the client script handles editing, reset,
execution, and error display.

The preview runs inside a sandboxed iframe. The parent page sends the current
snippet to the iframe through `postMessage`. The iframe loads a minimal HTML
document containing:

- A root element for rendering.
- A module script that imports the local composite library.
- A message listener that executes the latest snippet.
- Error reporting back to the parent page through `postMessage`.

The iframe clears its root before every run. Successful runs render the returned
node into the root and send a success status back to the parent page.

The iframe should use a site-owned runner document rather than an ad hoc
cross-origin environment. Because the runner imports the local ESM library, it
may need same-origin access in addition to script execution. Treat the iframe as
an execution and rendering boundary for the editor UI, not as a hard security
boundary for hostile third-party code.

## Execution Model

Inside the iframe, the snippet is wrapped with `new Function`. The wrapper
passes the allowed helpers as named parameters:

```js
const runSnippet = new Function(
  "chart",
  "stackX",
  "stackY",
  "repeatX",
  "repeatY",
  snippet,
);

const node = runSnippet(chart, stackX, stackY, repeatX, repeatY);
```

After execution, the runtime validates that the returned value has a `render`
function before trying to render it. If validation fails, the iframe reports a
clear error message to the parent page.

This model intentionally supports editing data, chart configuration, helper
functions, and composition expressions within the snippet. It does not support
editing import declarations or loading arbitrary extra modules.

## Iframe Permissions

Use the smallest sandbox permission set that still allows the local ESM imports
to work in the built Astro site. The expected starting point is
`sandbox="allow-scripts allow-same-origin"` on a site-owned runner iframe.

The editor executes code written by the current page user. It is not designed to
safely run untrusted code submitted by other users.

## Error Handling

The parent page displays errors from the iframe in the editor status area.
Errors include:

- JavaScript syntax errors.
- Runtime exceptions thrown by the snippet.
- Invalid return values.
- Render exceptions thrown by the composite library.

The error output should be concise. A message and, when available, a stack trace
are enough for the first version.

## Static Preview Assets

The static export flow remains unchanged:

- `scripts/export-site-examples.mjs` imports `examples/*.js`.
- The script writes SVG and PNG files to `site/public/examples/`.
- The example gallery reads those assets through `site/src/data/examples.js`.

The detail page no longer displays the static image as its main content. Static
assets remain available for cards, social previews, and any future places that
need a non-interactive preview.

## Styling

The editor should match the current site style:

- Use restrained borders and white work surfaces.
- Keep cards flat and avoid nested cards.
- Use a responsive two-column layout on desktop.
- Collapse to a single column on narrow screens.
- Use stable dimensions for the textarea, toolbar, and iframe preview so status
  changes do not shift the page unexpectedly.

## Testing

Add focused tests for the site behavior:

- The example gallery still renders image previews from `site/public/examples/`.
- The example detail page renders the editor controls and iframe.
- The detail page does not render the former large static image preview.
- Snippet source resolution works for every example metadata entry.

Run the existing project checks after implementation:

```bash
pnpm run test
pnpm run lint
```

No new package dependency is required for the first version.

## Non-goals

The first version does not include syntax highlighting, CodeMirror, Monaco, code
formatting, shareable edited URLs, persistence, or arbitrary module imports.
Those can be added later if the lightweight editor proves useful.
