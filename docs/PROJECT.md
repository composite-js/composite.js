# composite.js Project Guide

## Overview

`composite.js` is a JavaScript visualization grammar for building composite visualizations. It helps users describe a visualization as a tree of reusable layout nodes, where individual charts can be stacked, repeated, aligned, or embedded to form richer analytical views.

A composite visualization combines multiple basic charts in a meaningful layout to show different facets of the same data. For example, an UpSet-style view can combine a top bar chart, a matrix, side bars, box plots, stacked bars, and repeated pies into a single coordinated display.

Each leaf chart is wrapped as a layout node, and each composition also behaves as a layout node. This makes composition recursive: a chart can be rendered alone, a group of charts can be rendered together, and that group can become part of a larger composition.

## Installation and Workflow

Install dependencies from the repository root:

```bash
pnpm install
```

Start the development server:

```bash
pnpm run dev
```

The dev script loads `examples/index.js` by default. To load a specific example, pass the filename without `.js`:

```bash
pnpm run dev --example dropoutseer
```

Build the production bundle:

```bash
pnpm run build
```

Run tests:

```bash
pnpm run test
```

Run linting:

```bash
pnpm run lint
```

The project is designed for browser rendering. Tests run through a Node-based runner and use local helpers where SVG or layout behavior needs to be simulated.

## Core API

The main public exports are available through `src/index.js`.

- `chart(config)` creates a leaf layout node around a chart configuration.
- `text(config)` creates a leaf layout node for SVG text annotations, including
  rotated labels.
- `frame(node, options)` wraps a layout node with a rectangular SVG border.
- `stackX(nodes, options)` arranges layout nodes horizontally.
- `stackY(nodes, options)` arranges layout nodes vertically.
- `repeatX(domain, fn, options)` creates a horizontal repeated layout from a domain and node factory.
- `repeatY(domain, fn, options)` creates a vertical repeated layout from a domain and node factory.
- `repeat(domain, fn, options)` creates a directionless repeated layout that can be embedded into a compatible container.
- `embed(container, repeated, mapping)` places repeated children into slots produced by a container.
- `sequenceContainer(options)` creates a container abstraction for sequence-style embedded layouts.

Composition helpers expect layout nodes. Use `chart({...})` to wrap chart configurations before composing them:

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

## Architecture

The library is organized around a layout tree.

Leaf nodes are created by `chart(config)` in `src/layout/factory.js`. Internally, each leaf node wraps a `Chart` instance from `src/chart.js`. The chart resolves its mark type and delegates rendering to a mark renderer in `src/mark/`.

Composition nodes live in `src/layout/composition.js`. `Stack` arranges children horizontally or vertically, `RepeatX` and `RepeatY` generate repeated children along one axis, and `Embedded` renders repeated children into slots produced by a container. All of these are layout nodes, so they can be nested.

The layout pipeline has three main parts:

- `LayoutCalculator` estimates dimensions and margins for charts and compositions.
- `LayoutEngine` computes bounding boxes, alignment, stack positions, repeat dimensions, and embedded child layouts.
- `LayoutRenderer` renders the computed layout tree into SVG groups and delegates leaf rendering back to each node.

Rendering is D3-backed. `src/chart.js` selects a mark renderer for the configured mark type, and mark renderers return axis configuration when axes should be drawn by `AxisRenderer`.

Supported chart marks include bars, grouped bars, stacked bars, lines,
matrices, scatters, boxes, bubbles, pies, flows, and stream graphs. Grouped
bars use `encoding: { x, y, group }`. Stream graphs use long-form data with
`encoding: { x, y, color }` and render stacked areas with a wiggle baseline.

## Directory Guide

- `src/index.js` is the public entrypoint.
- `src/chart.js` contains the chart wrapper and mark renderer dispatch.
- `src/axis.js` renders axes for mark renderers that request them.
- `src/layout.js` re-exports the layout subsystem.
- `src/layout/` contains layout nodes, compositions, measurement, calculation, engine, and rendering logic.
- `src/mark/` contains D3-backed renderers for supported chart marks.
- `src/layout/text.js` contains the renderable element behind the `text()`
  layout factory.
- `src/layout/frame.js` contains the wrapper element behind the `frame()`
  layout factory.
- `src/container/` contains reusable container abstractions for embedded layouts.
- `src/utils/` contains shared utilities such as bounding boxes.
- `examples/` contains browser examples used by the development server.
- `scripts/dev-example.mjs` parses the selected example and launches Vite.
- `test/` contains unit and integration tests for APIs, marks, layout behavior, containers, and examples.
- `docs/` contains project documentation beyond the root README.

## Maintenance Notes

- Keep source comments and project documentation in English.
- Preserve ESM style across source and examples.
- Keep composition inputs as layout nodes. If a user-facing API accepts charts for composition, it should accept nodes created by factory helpers.
- Prefer focused tests near the behavior being changed. Layout changes usually need coverage in `test/layout/`; mark renderer changes usually need coverage in `test/mark/`.
- Do not update generated build output unless the task explicitly asks for release artifacts.
