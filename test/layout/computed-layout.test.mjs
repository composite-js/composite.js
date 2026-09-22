import assert from "node:assert/strict";
import {
  anchor,
  chart,
  computeLayout,
  custom,
  customContainer,
  embed,
  image,
  repeat,
  repeatX,
  repeatY,
  renderComputedLayout,
  stackX,
  stackY,
  text,
  wrapper,
} from "../../src/index.js";
import { withFakeSvgDocument } from "../helpers/fake-svg.mjs";

const zero = { top: 0, right: 0, bottom: 0, left: 0 };
const measurementAdapter = { measureMargin: () => zero };
const compute = (spec, options = {}) =>
  computeLayout(spec, { measurementAdapter, ...options });
const rect = (node) => ({ ...node.bbox.contentRect() });
const makeChart = (max, padding) =>
  chart({
    data: [{ category: "A", value: max }],
    encoding: { x: "category", y: "value" },
    width: 40,
    height: 20,
    margin: zero,
    ...(padding === undefined ? {} : { padding }),
  });
const plot = makeChart(10);

// One declaration can occur twice in a parent and in independently built trees.
{
  const first = compute(stackX([plot, plot], { margin: 5 }));
  const second = compute(stackY([wrapper(plot, { padding: 3 }), plot]));
  assert.equal(first.children[0].spec, first.children[1].spec);
  assert.notEqual(first.children[0], first.children[1]);
  assert.notEqual(first.children[0].bbox, first.children[1].bbox);
  assert.equal(first.children[1].bbox.contentRect().x, 45);
  assert.equal(second.children[1].bbox.contentRect().y, 26);
  assert.equal(plot.bbox, undefined);
  assert.equal(plot.element.renderer, undefined);
  assert.equal(compute(custom(plot.element)).bbox.contentRect().width, 40);
  assert.equal(plot.element.renderer, undefined);
  assert.throws(() => {
    first.children[0].bbox.content.width = 99;
  }, TypeError);
  assert.throws(() => {
    plot.element.encoding.x = "other";
  }, TypeError);
}

// Derived domains and padding belong to the occurrence, not the declaration.
{
  const small = compute(repeatX([plot, makeChart(100)], (item) => item));
  const large = compute(repeatX([plot, makeChart(1000)], (item) => item));
  assert.deepEqual(small.children[0].element.encoding.yDomain, [0, 100]);
  assert.deepEqual(large.children[0].element.encoding.yDomain, [0, 1000]);
  assert.equal(plot.element.encoding.yDomain, undefined);
  assert.deepEqual(small.children[0].element.encoding.yDomain, [0, 100]);

  const tight = compute(stackY([makeChart(10, { xInner: 0.2 }), plot]));
  const loose = compute(stackY([makeChart(10, { xInner: 0.7 }), plot]));
  assert.equal(tight.children[1].element.padding.xInner, 0.2);
  assert.equal(loose.children[1].element.padding.xInner, 0.7);
  assert.equal(plot.element.padding.xInner, 0.1);
}

// Anchor names are scoped to each direct child and do not create layout boxes.
{
  const top = stackX([
    text({ text: "offset", width: 15, height: 10 }),
    anchor("main", plot),
  ]);
  const bottom = wrapper(anchor("main", plot), { padding: 8 });
  const result = compute(stackY([top, bottom], { align: ["main", "main"] }));
  const a = result.children[0];
  const b = result.children[1];
  assert.equal(
    a.bbox.contentRect().x + a.children[1].bbox.contentRect().x,
    b.bbox.contentRect().x + b.children[0].bbox.contentRect().x,
  );
  assert.deepEqual(rect(compute(anchor("main", plot))), rect(compute(plot)));
  assert.equal(
    compute(stackY([plot, plot], { align: [plot, plot] })).children.length,
    2,
  );
  assert.throws(
    () =>
      compute(stackY([stackX([plot, plot]), plot], { align: [plot, plot] })),
    /ambiguous.*anchor/i,
  );
  assert.throws(
    () => compute(stackY([top, bottom], { align: ["missing", "main"] })),
    /not found/i,
  );
  assert.throws(
    () =>
      compute(
        stackY([stackX([anchor("main", plot), anchor("main", plot)]), plot], {
          align: ["main"],
        }),
      ),
    /ambiguous/i,
  );
}

// Repeat expansion happens once per occurrence per compute, never during render.
await withFakeSvgDocument(async (document) => {
  let calls = 0;
  const repeated = repeatX(
    ["A", "B"],
    () => {
      calls++;
      return plot;
    },
    { paddingInner: 0, paddingOuter: 0 },
  );
  const small = compute(repeated, { width: 80, height: 20 });
  const large = compute(repeated, { width: 200, height: 50 });
  assert.equal(calls, 4);
  assert.equal(repeated.children, undefined);
  const snapshot = small.children.map(rect);
  const left = document.createElement("div");
  const right = document.createElement("div");
  renderComputedLayout(small, left);
  renderComputedLayout(large, right);
  renderComputedLayout(small, left, { debugBBox: true });
  assert.equal(calls, 4);
  assert.deepEqual(small.children.map(rect), snapshot);
  assert.equal(left.firstElementChild.getAttribute("width"), "80");
  assert.equal(right.firstElementChild.getAttribute("width"), "200");
  assert.throws(
    () => renderComputedLayout(small, left, { width: 10 }),
    /computeLayout/,
  );
  assert.throws(() => renderComputedLayout(repeated, left), /computeLayout/);

  // A viewport override reaches nested repeats before their child positions are set.
  const nested = compute(
    repeatY([1], () => repeated, { paddingInner: 0, paddingOuter: 0 }),
    { width: 200, height: 60 },
  );
  assert.equal(nested.children[0].children[1].bbox.contentRect().x, 100);
  assert.equal(nested.children[0].children[1].bbox.contentRect().height, 60);
  const before = calls;
  renderComputedLayout(nested, right, { debugBBox: true });
  assert.equal(calls, before);
  const blue = right
    .querySelectorAll("rect")
    .filter((r) => r.getAttribute("stroke") === "blue");
  assert.ok(
    blue.some(
      (r) => r.getAttribute("x") === "100" && r.getAttribute("width") === "100",
    ),
  );
});

// Slot generation is part of compute, including validation; render uses its result.
await withFakeSvgDocument(async (document) => {
  let slots = 0;
  const container = customContainer({
    width: 100,
    height: 40,
    slots() {
      slots++;
      return [{ key: 0, x: 50, y: 20, width: 20, height: 10 }];
    },
  });
  const layout = compute(
    embed(
      container,
      repeat([1], () => plot),
    ),
  );
  assert.equal(slots, 1);
  assert.deepEqual(rect(layout.children[0]), {
    x: 40,
    y: 15,
    width: 20,
    height: 10,
  });
  const target = document.createElement("div");
  renderComputedLayout(layout, target);
  renderComputedLayout(layout, target, { debugBBox: true });
  assert.equal(slots, 1);
});

// Custom factories isolate measurement and render instances.
await withFakeSvgDocument(async (document) => {
  const instances = [];
  const leaf = custom(() => {
    const instance = {
      options: { width: 20, height: 10 },
      calls: 0,
      render(target, { width, height }) {
        this.calls++;
        const rect = target.ownerDocument.createElementNS(
          "http://www.w3.org/2000/svg",
          "rect",
        );
        rect.setAttribute("width", width);
        rect.setAttribute("height", height);
        target.appendChild(rect);
      },
    };
    instances.push(instance);
    return instance;
  });
  const layout = computeLayout(stackX([leaf, leaf]), { document });
  const target = document.createElement("div");
  renderComputedLayout(layout, target);
  renderComputedLayout(layout, target);
  assert.equal(instances.length, 6);
  assert.ok(instances.every((instance) => instance.calls === 1));
});

// Genuine recursion remains invalid, and a failed compute cannot claim ownership.
{
  let circular;
  circular = repeatX([1], () => circular);
  assert.throws(() => compute(circular), /circular reference/i);
  assert.throws(() => compute(repeatX([1], () => ({}))), /layout node/i);
  assert.equal(compute(stackX([plot, plot])).children.length, 2);
}

// Owned configuration is copied; caller changes do not rewrite a declaration.
{
  const config = {
    data: [{ category: "A", value: 1 }],
    encoding: { x: "category", y: "value", yDomain: [0, 10] },
    margin: { left: 7 },
  };
  const spec = chart(config);
  config.encoding.yDomain[1] = 100;
  config.margin.left = 100;
  const layout = compute(spec, { margin: { top: 2 } });
  assert.deepEqual(layout.element.encoding.yDomain, [0, 10]);
  assert.deepEqual(layout.bbox.getMargin(), {
    top: 2,
    right: 40,
    bottom: 40,
    left: 7,
  });
  assert.equal(Object.isFrozen(config.data), false);
}

// Anchors can target an occurrence inside a repeated viewport.
{
  const first = anchor("first", text({ text: "A", width: 20, height: 10 }));
  const second = anchor("second", text({ text: "B", width: 20, height: 10 }));
  const row = repeatX([first, second], (spec) => spec, {
    width: 100,
    height: 20,
    paddingInner: 0,
    paddingOuter: 0,
  });
  const result = compute(stackY([row, plot], { align: ["second", plot] }));
  const repeated = result.children[0];
  assert.equal(
    result.children[1].bbox.contentRect().x,
    repeated.bbox.contentRect().x + repeated.children[1].bbox.contentRect().x,
  );
  assert.equal(result.children[1].bbox.contentRect().width, 50);
}

// Generated clip IDs are distinct across occurrences and render calls.
await withFakeSvgDocument(async (document) => {
  const icon = image({
    url: "icon.svg",
    clip: "circle",
    width: 20,
    height: 20,
  });
  const layout = compute(stackX([icon, icon]));
  const left = document.createElement("div");
  const right = document.createElement("div");
  renderComputedLayout(layout, left);
  renderComputedLayout(layout, right);
  const ids = [left, right].flatMap((target) =>
    target.querySelectorAll("clipPath").map((clip) => clip.getAttribute("id")),
  );
  assert.equal(ids.length, 4);
  assert.equal(new Set(ids).size, 4);
  for (const target of [left, right]) {
    const clips = target.querySelectorAll("clipPath");
    target.querySelectorAll("image").forEach((img, index) => {
      assert.equal(
        img.getAttribute("clip-path"),
        `url(#${clips[index].getAttribute("id")})`,
      );
    });
  }
});
