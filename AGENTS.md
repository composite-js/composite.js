# AGENTS.md

## Project Description

`composite.js` is a JavaScript visualization grammar for building composite visualizations in the browser. It represents a visualization as a tree of layout nodes: leaf nodes render individual objects such as charts, texts, and images, while composition nodes arrange those basic objects through composition operations.

Composite visualizations combine multiple basic charts, such as bar charts, line charts, matrices, pies, scatters, flows, and boxes, into one coordinated view. Common composition strategies include stacking (aligning via shared axes or data items), repeating (small multiples), overlaying (placing multiple charts onto the same visual space), and embedding (rendering child objects in the visual elements of parent objects).

## Running the Project

Use `pnpm` as the primary package manager.

```bash
pnpm install
pnpm run dev
pnpm run dev --example <name>
pnpm run build
pnpm run test
pnpm run lint
```

- `pnpm run dev` starts the Vite development server through `scripts/dev-example.mjs`.
- `pnpm run dev --example dropoutseer` loads `examples/dropoutseer.js`; omit the flag to load `examples/upset.js`.
- `pnpm run build` creates the production bundle through Vite.
- `pnpm run test` runs the Node-based test runner at `test/run.mjs`.
- `pnpm run lint` runs ESLint across the repository.
- Avoid `pnpm run format` unless the task explicitly asks for formatting, because it can rewrite unrelated tracked files.

## Development Notes

- All rendered code runs in a browser environment.
- The project uses native ECMAScript modules; keep imports and exports in ESM style.
- Use English for code comments and documentation added to source files.
- Composition APIs accept layout nodes. Wrap chart configs with `chart({...})` before passing them to `stackX`, `stackY`, `repeatX`, `repeatY`, or other composition helpers.
- Prefer existing layout, renderer, and mark abstractions over adding parallel systems.
- When implementing examples from visual references, do not render the reference title, subtitle, or legend unless explicitly requested.
- Do not use web environments to verify.
- Do not offer or use a visual companion for design discussions in this project; keep design collaboration text-only unless the user explicitly changes this instruction.
- Unless explicitly specified by the user, make changes directly on the `main` branch.
- Whenever a decision requires my action, tell me explicitly.
- Whenever you are uncertain about something, ask me for clarification.

## Project Architecture

- `src/index.js` is the public library entrypoint. It re-exports chart, layout, container, mark renderer, axis, and utility APIs.
- `src/layout.js` gathers the main layout exports from the layout subsystem.
- `src/layout/factory.js` provides user-facing factories such as `chart`, `stackX`, `stackY`, `repeatX`, and `repeatY`.
- `src/layout/node.js` defines the base layout node contract and guards for layout-node inputs.
- `src/layout/composition.js` implements composition nodes, including stacks, repeats, directionless repeats, and embedded layouts.
- `src/layout/engine.js`, `src/layout/calculator.js`, `src/layout/measurement.js`, and `src/layout/renderer.js` compute bounding boxes, measure layout needs, and render the computed tree into SVG.
- `src/chart.js` wraps chart configuration and dispatches to D3-backed mark renderers.
- `src/mark/` contains mark-specific renderers such as bar, line, matrix, scatter, box, bubble, pie, and flow.
- `src/container/` contains container abstractions used by embedded and sequence-style layouts.
- `examples/` contains browser demos selected by the development script.
- `test/` contains Node-based unit and integration tests, with fake SVG helpers where browser DOM behavior needs to be simulated.

## Documentation

- Keep the root `README.md` user-facing and concise.
- Keep deeper project documentation in `docs/`.
- `docs/PROJECT.md` is the main project guide for architecture, workflows, and concepts.
