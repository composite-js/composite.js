# composite.js

A small JavaScript functional composition demo library for building composite visualizations using Vite and pnpm. It provides simple building blocks like `createChart`, `composite`, and `stack` so you can compose marks such as bar charts and matrix views into a single coordinated layout (for example, an UpSet-style intersection visualization).

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
- `pnpm run lint` — placeholder lint command.
- `pnpm run format` — run Prettier to format code.

Example: start the dev server and open the default Vite port:

```bash
pnpm run dev
```

## Quick Usage (demo in `index.js`)

The repository includes a demo entry (`index.js`) that shows how to compose three charts: a top bar chart (intersection size), a left bar chart (set size), and a center matrix view.

- Use `createChart({...})` to create an individual chart instance (supported marks include `bar`, `matrix`, etc.).
- Use `composite([chartA, chartB, chartC], { constraints: [...] })` to combine child charts into a composite view.
- Use `stack([a, b], 'vertical'|'horizontal')` to create stacking constraints between charts.

Typical flow in `index.js`:

1. Prepare data (e.g. `data`, `genres`).
2. Build `topBarChart`, `matrixChart`, `leftBarChart` with `createChart`.
3. Call `composite` with `stack` constraints and render the composite to a DOM element (e.g. `document.getElementById('app')`).

## Build & Deploy

1. Build the project:

```bash
pnpm run build
```

2. The build artifacts are output to `dist/`. Deploy `dist/` to any static hosting service (Netlify, Vercel, GitHub Pages, nginx, etc.). For GitHub Pages you can push `dist/` to a `gh-pages` branch or set up a CI job to deploy automatically.

## Development Tips

- Use `pnpm run dev` for a hot-reloading development server.
- Run `pnpm run format` before committing to keep consistent code style.

## Tests

Run the provided test script:

```bash
pnpm run test
```

## Contributing

- Issues and pull requests are welcome. Keep changes small and focused.
- Run `pnpm run format` before submitting a PR.

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.
