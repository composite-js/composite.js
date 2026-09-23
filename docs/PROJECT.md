# composite.js Project Guide

## Overview

`composite.js` is a JavaScript grammar for building composite visualizations. It is designed for users who know which charts belong in a view and how those charts are related, but do not want to implement every chart renderer or calculate the concrete layout themselves.

Users describe chart data and visual encodings, then express abstract composition relationships such as stacking, repetition, alignment, and embedding. The library chooses the built-in renderers, measures content, assigns default dimensions and spacing, computes positions, and renders the resulting SVG. Explicit sizes, margins, and alignment targets are optional refinements rather than prerequisites.

A composite visualization combines multiple basic charts in a meaningful layout to show different facets of the same data. For example, an UpSet-style view can combine a top bar chart, a matrix, side bars, box plots, stacked bars, and repeated pies into a single coordinated display.

Internally, each leaf chart is wrapped as a layout node, and each composition also behaves as a layout node. This makes composition recursive: a chart can be rendered alone, a group of charts can be rendered together, and that group can become part of a larger composition. The layout tree is the mechanism behind the grammar, while charts and their relationships are the user-facing model.

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
internal modules. Public `computeLayout` and `renderComputedLayout` functions
allow separate computation and drawing; see [Layout computation and reuse](LAYOUT.md).

The composition factories describe abstract relationships. For example,
`stackY([overview, details])` says that one view follows another vertically; it
does not require the caller to calculate either chart's coordinates. Unless an
option is supplied, the layout system uses built-in sizing, margin, padding,
and alignment behavior. Callers can override those decisions when a specific
design requires it.

- `chart(config)` creates a reusable leaf declaration around a chart configuration.
- `computeLayout(spec, options)` returns a separate read-only tree of occurrences.
- `renderComputedLayout(layout, container, options)` draws an existing result.
- `anchor(name, spec)` names one use for unambiguous alignment without adding a box.
- `custom(renderable, options)` wraps an object with a `render(container,
options)` method as a custom leaf layout node.
- `text(config)` creates a leaf layout node for SVG text annotations, including
  rotated labels.
- `image(config)` creates an SVG image leaf with fitting, clipping, and
  transform options.
- `wrapper(node, options)` decorates a layout subtree with padding, a
  background, and a border. Its size is derived from the wrapped node.
- `stackX(nodes, options)` arranges layout nodes horizontally. For two direct
  chart nodes, `link: true` draws connector lines between matching
  `encoding.y` values when both marks support link anchors.
- `stackY(nodes, options)` arranges layout nodes vertically. For two direct
  chart nodes, `link: true` draws connector lines between matching
  `encoding.x` values when both marks support link anchors.
- `overlay(nodes)` places layout nodes in one shared content rectangle. The
  largest intrinsic content width and height are used, margins are merged by
  taking the maximum on each side, and later children paint above earlier ones.
- `repeatX(domain, fn, options)` creates a horizontal repeated layout from a domain and node factory.
- `repeatY(domain, fn, options)` creates a vertical repeated layout from a domain and node factory. Repeat dimensions may be explicit or inferred from the largest child and the configured band padding. Positional repeat domains must contain unique values.
- `repeat(domain, fn, options)` creates a directionless repeated layout that can be embedded into a compatible container.
- `embed(container, repeated, mapping)` places repeated children into slots produced by a container.
- `sequenceContainer(options)` creates a container abstraction for sequence-style embedded layouts.
- `gridContainer(options)` creates a two-dimensional discrete grid container for embedded layouts.
- `customContainer(options)` creates a user-defined container with normalized sizing, margin defaults, and contract validation.
- `GridContainer` and `SequenceContainer` are the class-based equivalents of
  the corresponding container factories.
- `isLayoutNode(value)` and `assertLayoutNode(value, label)` check values before
  passing them into composition helpers.
- `validateChartConfig(config)` validates chart mark, encoding, and data shape
  without rendering. Chart data must contain at least one row, and quantitative
  fields currently accept only finite, non-negative JavaScript numbers; numeric
  strings are not coerced. Zero is supported, while negative values are not.
  Chart dimensions, margins, and padding must also be finite and non-negative.
- `parseCsv(text, options)` parses CSV data, while `loadCsvText(url)` loads CSV
  text in browser and Node environments.
- `tableColumns(rows)` and `numericColumns(rows, options)` inspect tabular data,
  and `crossJoin(left, right, mapper)` builds Cartesian products.

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

const view = stackY([top, matrix]);
view.render(document.getElementById("app"));
```

Linked stacks are intended for adjacent chart pairs such as horizontal bars
beside proportional area circles, or vertical bars above a horizontal
proportional area chart:

```javascript
const row = stackX([horizontalBars, pac], { link: true });
const column = stackY([verticalBars, horizontalPac], {
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

Line charts accept numeric or string `encoding.x` values. Supplying
`encoding.group` and an optional `groupDomain` renders multiple colored series;
categorical lines use the same band-padding model as categorical bar charts.

### Default-first layout

The shortest valid composition should be the normal starting point. Chart
dimensions and margins have built-in defaults, layout measurement accounts for
rendered content, stack positions are derived from child bounds, and repeats
infer their viewport from all repeated children. Leaf nodes, repeats, and
embedded layouts accept explicit dimensions. Overlays, stacks, and wrappers are
content-sized and reject render-time `width` or `height`. User-facing examples
should introduce explicit sizing only when the example has a concrete reason
to override the automatic result.

## Architecture

The library separates reusable layout declarations, computed occurrence trees,
and render-local state. A declaration may occur in multiple positions or views;
each computation assigns independent geometry and inferred chart settings.

Leaf nodes are created by factories in `src/layout/factory.js`. Internally,
`chart(config)` wraps a `Chart` instance from `src/chart/chart.js`, while
`custom(renderable)` wraps a caller-provided renderable object and
`custom(factory)` creates isolated measurement/render instances. The chart
resolves its chart type and delegates rendering to a chart renderer in
`src/chart/type/`.

Composition nodes live in `src/layout/composition.js`. `Stack` arranges children horizontally or vertically, `Overlay` gives children a shared content rectangle, `RepeatX` and `RepeatY` describe repeated children along one axis, and `Embedded` renders repeated children into slots produced by a container. All of these are layout nodes, so they can be nested.

Containers are data-driven spatial organizers for embedded layout nodes. A container provides `width`, `height`, `margin`, and `slots(data, mapping, size)`, and may render a structural background layer with `render(svg, options)`. Each slot must have a unique key matching the repeated datum key plus finite `x` and `y` coordinates relative to the container content box; optional slot dimensions must be finite and non-negative. Containers may omit data that have no valid slot, and may return slots in any order. Containers should organize repeated children rather than encode quantitative values as primary marks; use embedded `chart(...)` or `custom(...)` nodes for the visual encoding itself. Built-in containers include `sequenceContainer()` and `gridContainer()`, while `customContainer()` is the recommended extension point for user-defined slot logic.

The internal layout pipeline has three main parts:

- `LayoutCalculator` estimates dimensions and margins for charts and compositions.
- `computed.js` expands each occurrence and resolves per-occurrence configuration.
- `LayoutEngine` computes independent bounding boxes, alignment, stack positions,
  repeat cell dimensions, and embedded child positions.
- `LayoutRenderer` renders the read-only computed tree into SVG groups. Chart
  renderers and link anchors belong to the current render, not the declaration.

Rendering is D3-backed. `src/chart/chart.js` selects an internal chart renderer
for the configured chart type through `src/chart/registry.js`, and chart renderers
return axis configuration when axes should be drawn by the internal
`AxisRenderer`. The registry is the central declaration for each chart type's
renderer, encoding schema, shared-domain strategy, categorical band channel,
link capability, orientation behavior, and default padding.

Supported chart marks include bars, grouped bars, stacked bars, lollipops, histograms, heatmaps, waffles, area charts, lines, candlesticks, matrices, scatters, boxes, bubbles, dumbbells, proportional area charts, pies, flows, and stream graphs. Most marks use `encoding.x` and `encoding.y` for primary channels and `encoding.group` for secondary categorical grouping. Lines use `curve: "linear" | "step" | "spline"`; step lines hold each value until the next x position. Histograms accept raw numeric observations through `encoding.x` and use `binCount` for equal-width bins. Heatmaps use `encoding: { x, group, y }` for column, row, and numeric color value; `encoding.yDomain` controls the color range. Waffles use `encoding: { x, y }` for category and non-negative value, rounding shares to 100 cells. Candlesticks use `encoding: { x, open, high, low, close }`. Axis-oriented marks infer orientation from `encoding.x` and `encoding.y`: exactly one of those channels must contain numbers, and numeric categorical values should be stored as strings. Flow diagrams use `encoding: { x, group, y }`, support horizontal and vertical layout directions, can render endpoint headings with `xLabelName` and `groupLabelName`, and can map an array of colors to either `xDomain` or `groupDomain` with `colorBy`.

## Directory Guide

- `src/index.js` is the stable public entrypoint.
- `src/chart/chart.js` contains the chart wrapper and chart renderer dispatch.
- `src/chart/axis.js` renders axes for chart renderers that request them.
- `src/layout.js` re-exports the layout subsystem for internal tests and
  implementation modules.
- `src/layout/` contains layout nodes, compositions, measurement, calculation, engine, and rendering logic.
- `src/chart/` contains chart configuration, validation, rendering, and shared
  scale and style services.
- `src/chart/type/` contains D3-backed renderers for supported chart types.
- `src/chart/registry.js` declares the renderer and composition capabilities
  of every supported chart type.
- `src/layout/text.js` contains the renderable element behind the `text()`
  layout factory.
- `src/layout/wrapper.js` contains the wrapper element behind the `wrapper()`
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
- Register new chart types in `src/chart/registry.js` and export their renderer
  from `src/chart/type/index.js`; layout and validation code should consume
  registry capabilities instead of maintaining mark-name sets.
- For new axis-oriented marks, keep `encoding.x` tied to the rendered x channel and `encoding.y` tied to the rendered y channel. Do not add a mark-level `direction` option unless the mark needs a layout rotation like `flow` or `stream`.
- Keep composition inputs as layout nodes. If a user-facing API accepts charts for composition, it should accept nodes created by factory helpers.
- Prefer focused tests near the behavior being changed. Layout changes usually need coverage in `test/layout/`; chart renderer changes usually need coverage in `test/chart/`.
- Do not update generated build output unless the task explicitly asks for release artifacts.
