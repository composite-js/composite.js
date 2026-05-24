# composite.js

A visualization grammar for building composite visualizations. It provides composition operators such as `stack` and `repeat` so you can compose marks such as bar charts, stream graphs, and matrix views into a single coordinated layout (for example, an UpSet-style intersection visualization).

## Requirements

- Node.js (>= 18 recommended)
- A browser DOM for rendering visualizations

## Install

Install the package in your application:

```bash
pnpm add composite-js
```

With npm:

```bash
npm install composite-js
```

## Quick Usage

Use factory helpers to create layout nodes, compose them, and render the final
tree into a DOM element.

- Use `chart({...})` to create a leaf layout node for an individual chart.
- Use `text({...})` to create SVG text annotations that participate in layout.
- Use `frame(node, {...})` to draw a border around an existing layout node.
- Use `stackX([a, b])` or `stackY([a, b])` to compose layout nodes horizontally or vertically.
- Use `repeatX(domain, fn)` or `repeatY(domain, fn)` for repeated small multiples.
- Pass only layout nodes into compositions. Wrap chart configs with `chart({...})` instead of passing `new Chart(...)`.

Typical flow:

1. Prepare data (e.g. `data`, `genres`).
2. Build `topBarChart`, `matrixChart`, and `leftBarChart` with `chart`.
3. Combine them with `stackX` and `stackY`, optionally using `align` to align against a nested node.
4. Render the final node to a DOM element.

```javascript
import { chart, stackY } from "composite-js";

const top = chart({
  mark: "bar",
  data,
  encoding: { x: "id", y: "size" },
});

const matrix = chart({
  mark: "matrix",
  data: matrixCells,
  encoding: { x: "id", group: "set", y: "active" },
});

const view = stackY([top, matrix], { align: [matrix, matrix] });
view.render(document.getElementById("app"));
```

Supported chart marks include `bar`, `groupbar`, `stackbar`, `area`, `line`, `matrix`, `scatter`, `box`, `bubble`, `dumbbell`, `pac`, `pie`, `flow`, and `stream`.

## Repository Development

Install dependencies in the repository root:

```bash
pnpm install
```

Available scripts:

- `pnpm run dev` — start the Vite example server.
- `pnpm run dev --example dropoutseer` — open a specific example from
  `examples/`.
- `pnpm run build` — build the package outputs in `dist/`.
- `pnpm run test` — run source, docs, and site unit tests.
- `pnpm run test:dist` — test the built ESM/CJS package outputs after a build.
- `pnpm run test:pack` — verify the npm package contents after a build.
- `pnpm run lint` — run ESLint.
- `pnpm run check` — run the full library pre-release check.

The dev script loads `examples/upset.js` by default. To open a specific example,
pass its filename without the `.js` extension:

```bash
pnpm run dev --example dropoutseer
```

## Build

Build the package:

```bash
pnpm run build
```

The build artifacts are output to `dist/` and are the files published by the
package.

## Development Tips

- Use `pnpm run dev` for a hot-reloading example server.
- Run `pnpm run format:check` before committing to check formatting without
  rewriting files.
- Enable the repository hooks once per clone:

```bash
git config core.hooksPath .githooks
```

## Tests

Run the provided test script:

```bash
pnpm run test
```

## Contributing

- Issues and pull requests are welcome. Keep changes small and focused.
- Run `pnpm run check` before submitting a PR.

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.
