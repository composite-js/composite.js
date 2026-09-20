# composite.js

`composite.js` is a JavaScript visualization grammar for building composite
browser visualizations. Create charts as layout nodes, then stack, repeat,
align, and embed them into one coordinated view.

## Install

Install the package in your application:

```bash
pnpm add composite-js
```

## Quick Start

Import the layout helpers, wrap chart configurations with `chart()`, compose
the resulting nodes, and render the final layout into a browser element.

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

const view = stackY([bars, line], { margin: 16 });

view.render(document.querySelector("#app"));
```

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
