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

The dev script loads `examples/upset.js` by default. To load a specific example, pass the filename without `.js`:

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

The stable public exports are available through `src/index.js`. Implementation
classes for charts, renderers, layout engines, and bounding boxes remain
internal modules.

- `chart(config)` creates a leaf layout node around a chart configuration.
- `custom(renderable, options)` wraps an object with a `render(container,
options)` method as a custom leaf layout node.
- `text(config)` creates a leaf layout node for SVG text annotations, including
  rotated labels.
- `frame(node, options)` wraps a layout node with a rectangular SVG border.
- `stackX(nodes, options)` arranges layout nodes horizontally. For two direct
  chart nodes, `link: true` draws connector lines between matching
  `encoding.y` values when both marks support link anchors.
- `stackY(nodes, options)` arranges layout nodes vertically. For two direct
  chart nodes, `link: true` draws connector lines between matching
  `encoding.x` values when both marks support link anchors.
- `repeatX(domain, fn, options)` creates a horizontal repeated layout from a domain and node factory.
- `repeatY(domain, fn, options)` creates a vertical repeated layout from a domain and node factory.
- `repeat(domain, fn, options)` creates a directionless repeated layout that can be embedded into a compatible container.
- `embed(container, repeated, mapping)` places repeated children into slots produced by a container.
- `sequenceContainer(options)` creates a container abstraction for sequence-style embedded layouts.
- `gridContainer(options)` creates a two-dimensional discrete grid container for embedded layouts.
- `customContainer(options)` creates a user-defined container with normalized sizing, margin defaults, and contract validation.
- `isLayoutNode(value)` and `assertLayoutNode(value, label)` check values before
  passing them into composition helpers.
- `validateChartConfig(config)` validates chart mark, encoding, and data shape
  without rendering.

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
  data: matrixCells,
  encoding: { x: "id", group: "set", y: "active" },
});

const view = stackY([top, matrix], { align: [matrix, matrix] });
view.render(document.getElementById("app"));
```

Linked stacks are intended for adjacent chart pairs such as horizontal bars
beside proportional area circles, or vertical bars above a horizontal
proportional area chart:

```javascript
const row = stackX([horizontalBars, pac], { margin: 12, link: true });
const column = stackY([verticalBars, horizontalPac], {
  margin: 12,
  link: true,
});
```

`stackX` requires both charts to share the same `encoding.y` field name.
`stackY` requires both charts to share the same `encoding.x` field name. The
first supported marks are `bar`, `pac`, and `scatter`; unsupported marks or
orientations throw clear runtime errors.

Direct chart children in `stackX` and `stackY` also infer shared categorical
axis padding for marks that use band padding objects, such as `bar`, `pac`,
`box`, `dumbbell`, and `matrix`. Explicit child padding is preserved; missing
axis-specific padding is copied only when matching direct chart children use
the same categorical field.

## Architecture

The library is organized around a layout tree.

Leaf nodes are created by factories in `src/layout/factory.js`. Internally,
`chart(config)` wraps a `Chart` instance from `src/chart.js`, while
`custom(renderable)` wraps a caller-provided renderable object. The chart
resolves its mark type and delegates rendering to a mark renderer in
`src/mark/`.

Composition nodes live in `src/layout/composition.js`. `Stack` arranges children horizontally or vertically, `RepeatX` and `RepeatY` generate repeated children along one axis, and `Embedded` renders repeated children into slots produced by a container. All of these are layout nodes, so they can be nested.

Containers are data-driven spatial organizers for embedded layout nodes. A container provides `width`, `height`, `margin`, and `slots(data, mapping, size)`, and may render a structural background layer with `render(svg, options)`. Containers should organize repeated children rather than encode quantitative values as primary marks; use embedded `chart(...)` or `custom(...)` nodes for the visual encoding itself. Built-in containers include `sequenceContainer()` and `gridContainer()`, while `customContainer()` is the recommended extension point for user-defined slot logic.

The internal layout pipeline has three main parts:

- `LayoutCalculator` estimates dimensions and margins for charts and compositions.
- `LayoutEngine` computes bounding boxes, alignment, stack positions, repeat dimensions, and embedded child layouts.
- `LayoutRenderer` renders the computed layout tree into SVG groups and delegates leaf rendering back to each node.

Rendering is D3-backed. `src/chart.js` selects an internal mark renderer for
the configured mark type, and mark renderers return axis configuration when
axes should be drawn by the internal `AxisRenderer`.

Supported chart marks include bars, grouped bars, stacked bars, area charts, lines, matrices, scatters, boxes, bubbles, dumbbells, proportional area charts, pies, flows, and stream graphs. Marks use `encoding.x` and `encoding.y` for primary channels and `encoding.group` for secondary categorical grouping. Axis-oriented marks infer orientation from `encoding.x` and `encoding.y`: exactly one of those channels must contain numbers, and numeric categorical values should be stored as strings. Flow diagrams use `encoding: { x, group, y }`, support horizontal and vertical layout directions, can render endpoint headings with `xLabelName` and `groupLabelName`, and can map an array of colors to either `xDomain` or `groupDomain` with `colorBy`.

## Directory Guide

- `src/index.js` is the stable public entrypoint.
- `src/chart.js` contains the chart wrapper and mark renderer dispatch.
- `src/axis.js` renders axes for mark renderers that request them.
- `src/layout.js` re-exports the layout subsystem for internal tests and
  implementation modules.
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
- For new axis-oriented marks, keep `encoding.x` tied to the rendered x channel and `encoding.y` tied to the rendered y channel. Do not add a mark-level `direction` option unless the mark needs a layout rotation like `flow` or `stream`.
- Keep composition inputs as layout nodes. If a user-facing API accepts charts for composition, it should accept nodes created by factory helpers.
- Prefer focused tests near the behavior being changed. Layout changes usually need coverage in `test/layout/`; mark renderer changes usually need coverage in `test/mark/`.
- Do not update generated build output unless the task explicitly asks for release artifacts.
