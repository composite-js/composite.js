# composite.js

A visualization grammar for building composite visualizations. It provides composition operators such as `stack` and `repeat` so you can compose marks such as bar charts, stream graphs, and matrix views into a single coordinated layout (for example, an UpSet-style intersection visualization).

## Requirements

- Node.js (>= 18 recommended)
- pnpm (or use `npm` / `yarn` by replacing commands below)

## Install

Install dependencies in the repository root:

```bash
pnpm install
```

With npm:

```bash
npm install
```

## Scripts

Available npm scripts (see `package.json`):

- `pnpm run dev` — start Vite dev server.
- `pnpm run build` — build production bundle (outputs to `dist/`).
- `pnpm run test` — run the Node-based test script `test/run.mjs`.
- `pnpm run lint` — run ESLint.
- `pnpm run format` — run Prettier to format code.

Example: start the dev server and open the default Vite port:

```bash
pnpm run dev
```

## Example Selection

The dev script loads `examples/upset.js` by default. To open a specific
example, pass its filename without the `.js` extension:

```bash
pnpm run dev --example dropoutseer
```

## Quick Usage (demo in `examples/upset.js`)

The repository includes a demo entry (`examples/upset.js`) that shows how to compose charts: a top bar chart, a left bar chart, a center matrix view, and repeated pie charts.

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
import { chart, stackY } from "./src/index.js";

const top = chart({
  mark: "bar",
  data,
  encoding: { x: "id", y: "size" },
});

const matrix = chart({
  mark: "matrix",
  data,
  encoding: { x: "id", y: "sets" },
});

const view = stackY([top, matrix], { align: [matrix, matrix] });
view.render(document.getElementById("app"));
```

Supported chart marks include `bar`, `groupbar`, `stackbar`, `area`, `line`, `matrix`, `scatter`, `box`, `bubble`, `dumbbell`, `pac`, `pie`, `flow`, and `stream`. `flow` accepts `sourceLabelName` and `targetLabelName` for endpoint headings, and can map `colors` to either `sourceDomain` or `targetDomain` with `colorBy`.

## Build & Deploy

1. Build the project:

```bash
pnpm run build
```

2. The build artifacts are output to `dist/`. Deploy `dist/` to any static hosting service (Netlify, Vercel, GitHub Pages, nginx, etc.). For GitHub Pages you can push `dist/` to a `gh-pages` branch or set up a CI job to deploy automatically.

## Development Tips

- Use `pnpm run dev` for a hot-reloading development server.
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
