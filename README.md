# composite.js

`composite.js` is a JavaScript grammar for building composite visualizations.
Describe the charts you need and their abstract
relationships—such as stacking, repetition, alignment, and embedding—and let
the library render the charts and compute their concrete layout.

## Install

Install the package in your application:

```bash
pnpm add composite-js
```

## Quick Start

Define each chart from its data and visual encoding, describe how the charts
belong together, and render the resulting composite view. Built-in defaults
handle sizing, spacing, measurement, and positioning for the common case.

```javascript
import { chart, stackY } from "composite-js";

const totals = [
  { category: "A", value: 12 },
  { category: "B", value: 18 },
  { category: "C", value: 9 },
];

const trend = [
  { year: 2023, value: 8 },
  { year: 2024, value: 14 },
  { year: 2025, value: 17 },
];

const bars = chart({
  mark: "bar",
  data: totals,
  encoding: { x: "category", y: "value" },
});

const line = chart({
  mark: "line",
  data: trend,
  encoding: { x: "year", y: "value" },
});

// Express the abstract relationship: the trend follows the totals vertically.
const view = stackY([bars, line]);

view.render(document.querySelector("#app"));
```

## What You Describe

You provide the chart data, mark types, visual encodings, and high-level
relationships between charts. Operations such as `stackX()`, `stackY()`,
`repeatX()`, `repeatY()`, and `embed()` describe composition intent without
requiring pixel coordinates or SVG transforms.

`composite.js` selects the built-in chart renderers, measures content, assigns
default dimensions and spacing, positions every node, and renders the complete
SVG. Optional controls such as explicit sizes, margins, and alignment targets
remain available when a design needs precise refinement.

## Minimal Browser App

Add a mount element to your page and load your application module through your
bundler or development server:

```html
<div id="app"></div>
<script type="module" src="/src/main.js"></script>
```

Put the quick-start JavaScript in `/src/main.js`. Rendering requires a browser
DOM; run it through your app tooling instead of evaluating it in Node directly.

## Documentation

Read the [project guide](docs/PROJECT.md) for architecture, concepts, API
details, and maintenance notes. The full documentation and example site lives
in [`site/`](site/README.md) and can be run locally with `pnpm run site:dev`.

## Requirements

- Node.js (>= 22 recommended)
- A browser DOM for rendering visualizations

## Development

Install dependencies in the repository root:

```bash
pnpm install
```

Available commands:

```bash
pnpm run dev
pnpm run dev --example dropoutseer
pnpm run build
pnpm run test
pnpm run lint
pnpm run check
pnpm run check:site
```

- `pnpm run dev` starts the Vite example server and loads `examples/upset.js`.
- `pnpm run dev --example dropoutseer` loads `examples/dropoutseer.js`.
- `pnpm run build` creates the production bundle.
- `pnpm run test` runs the Node-based test runner.
- `pnpm run lint` runs ESLint.
- `pnpm run check` runs the complete library verification sequence.
- `pnpm run check:site` builds the documentation and example site.

Enable the repository hooks once per clone:

```bash
git config core.hooksPath .githooks
```

## License

This project is licensed under the MIT License. See the `LICENSE` file for
details.
