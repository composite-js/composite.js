# Layout computation and reuse

Layout factories return reusable declarations (LayoutSpec), represented by the
public LayoutNode type. A declaration has no bbox, exclusive parent, expanded
repeat children, or persistent chart renderer. Each compute creates a separate
tree of occurrences; each render creates its own renderer instances and SVG.

## Public API

```js
import {
  chart,
  stackX,
  computeLayout,
  renderComputedLayout,
} from "composite-js";

const plot = chart({
  data: [{ category: "A", value: 10 }],
  encoding: { x: "category", y: "value" },
});
const view = stackX([plot, plot]);
const layout = computeLayout(view, { document });

console.log(layout.children[1].bbox.contentRect());
renderComputedLayout(layout, document.querySelector("#app"));
```

`view.render(container, options)` remains the convenience entrypoint. It computes
and then renders. Both leaves and compositions use this pipeline. HTML targets
receive a new SVG; SVG targets receive the rendered groups. Rendering replaces
the target's contents.

`computeLayout(spec, { width, height, margin, document, measurementAdapter })`
returns a read-only ComputedLayout. Existing sizing rules remain: stack and
wrapper sizes derive from content and reject root width/height overrides.
Leaf, repeat, and embed roots accept dimensions. Overlay, stack, and wrapper
sizes derive from their content. Root leaves use configured
margins; composition children use the measurement adapter. Repeat leaf cells
retain the existing zero-margin policy.

The optional per-computation measurement adapter provides
`measureMargin(element, { width, height }, { document })`. The default adapter
uses temporary SVG rendering and getBBox; it does not retain DOM or renderer
state on built-in declarations. Tests can provide a deterministic adapter
without a browser.

`renderComputedLayout(layout, container, { debugBBox })` reads the result
without repeating measurement, repeat callbacks, slot lookup, or layout.
Dimensions cannot be overridden here; compute another result to resize.
Results for different viewports may coexist and be rendered in any order.

## Overlay geometry

`overlay([background, foreground])` gives every direct child the same content
rectangle. Its intrinsic width and height are the largest child content width
and height, while each outer margin is the largest margin requested on that
side by any child. This keeps plot regions aligned while allowing, for example,
a left axis on one chart and a right axis on another. Children render in array
order, so later children appear above earlier children. Overlay coordinates
only geometry; chart domains remain explicit chart configuration.

## Occurrences and coordinates

Every use of a declaration gets a unique occurrence within the computation,
including repeated references under the same parent. The result exposes:

- `spec`: the source declaration.
- `occurrenceId`: a traversal path unique within this computation, not a
  persistent cross-computation identity.
- `bbox.contentRect()`: final content x/y relative to the parent's content
  origin, and final content width/height.
- `bbox.getMargin()` and `bbox.outerRect()`: layout margins and outer bounds.
- `viewport`: parent/root requested dimensions when supplied. A content-sized
  child can be larger than the viewport allocated to it.
- `children`: computed children in render order. Embed children without slots
  are excluded.

Geometry, result arrays, and library-owned resolved chart configuration are
read-only. Bboxes describe the adopted layout bounds, not a guarantee that every
painted mark lies within them. Debug bounds use this same geometry.

## Alignment

Existing node references still work. Each align entry resolves within its
corresponding direct child subtree:

```js
stackY([plot, plot], { align: [plot, plot] });
```

If a reference matches multiple occurrences within one child, use a name:

```js
import { anchor, stackX, stackY, wrapper } from "composite-js";

const top = stackX([plot, anchor("main", plot)]);
const bottom = wrapper(anchor("main", otherPlot), { padding: 8 });
const view = stackY([top, bottom], { align: ["main", "main"] });
```

`anchor(name, spec)` marks this use without adding a box, padding, or SVG group.
Names are local to the corresponding child subtree, so different children may
use the same name. Missing names and multiple matching occurrences are errors.
Existing out-of-subtree node references retain their direct-child fallback;
the first explicit reference that resolves within its child supplies the
reference alignment. True cycles are rejected, but sharing is permitted.

## Configuration and extensions

Shared domains and inferred stack padding are resolved separately for each
occurrence before measurement. Explicit settings retain precedence, and the
existing direct-chart scope of inference is preserved. Constructing one
composition never changes another composition's settings.

Library-owned configuration structures are copied and frozen. Data rows,
callbacks, and extension objects remain borrowed read-only inputs; computed
layouts are not deep snapshots of arbitrary application data. Create a new
declaration when changing data or options. Reuse and recomposition do not
require detach/move operations.

A repeat callback runs once per domain item per repeat occurrence per compute.
It may return a previously created spec. Measurement, final arrangement,
rendering, and debug do not re-run it. Callbacks should be deterministic for
their inputs. There is no cross-computation callback cache.

Custom renderables supplied as objects must support repeated rendering without
retaining target-specific state. For stateful extensions, provide a factory:

```js
const plot = custom(() => new MyRenderer(options));
```

The factory must return a fresh renderable for measurement and each render.
The library cannot isolate state hidden in a reused object or callback closure.
Custom containers follow the same read-only-input contract: slots is a
computation operation and render draws at the supplied dimensions. A changed
viewport may require another slots call during the same computation; drawing
and debug never call it.

## Implementation and migration

- `node.js`, `factory.js`, `composition.js`, and `wrapper.js` define declarations.
- `computed.js` expands occurrences, resolves alignment/inference, and seals
  the result.
- `engine.js` measures and arranges stack, wrapper, repeat, and embed geometry.
- `renderer.js` draws computed geometry and collects render-local link anchors.
- `chart.js` creates mark renderers per call, including measurement calls.

The engine may mutate its private working tree before returning the read-only
result. It never writes back to the spec. Traversal ancestry detects cycles;
there is no global node-parent ownership registry.

Internal consumers should replace `computeLayout(spec); spec.bbox` with
`const layout = computeLayout(spec); layout.bbox`. Inspect occurrence-specific
inference on the computed tree rather than expecting constructor-time changes
to `spec.element`. Direct child-array mutation and persistent
`element.renderer` access are no longer supported. Low-level renderer entrypoints
require computed results. Public factory names and ordinary .render calls remain.

This change does not add incremental computation, DOM reconciliation, animation
identity, cross-computation caching, or automatic layout convergence.
