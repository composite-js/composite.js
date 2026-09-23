import assert from "node:assert/strict";
import {
  computeLayout,
  overlay,
  renderComputedLayout,
  stackX,
  text,
} from "../../src/index.js";
import { createFakeSvg } from "../helpers/fake-svg.mjs";

const first = text({ text: "first", width: 80, height: 40 });
const second = text({ text: "second", width: 120, height: 30 });
const measurementAdapter = {
  measureMargin(element) {
    return element.options.width === 80
      ? { top: 3, right: 4, bottom: 5, left: 12 }
      : { top: 7, right: 18, bottom: 2, left: 6 };
  },
};

const computed = computeLayout(overlay([first, second]), {
  measurementAdapter,
});

assert.equal(computed.classTag, "overlay");
assert.deepEqual(computed.bbox.contentRect(), {
  x: 0,
  y: 0,
  width: 120,
  height: 40,
});
assert.deepEqual(computed.bbox.getMargin(), {
  top: 7,
  right: 18,
  bottom: 5,
  left: 12,
});
computed.children.forEach((child) => {
  assert.deepEqual(child.bbox.contentRect(), {
    x: 0,
    y: 0,
    width: 120,
    height: 40,
  });
});

const svg = createFakeSvg();
renderComputedLayout(computed, svg);
const group = svg.querySelector(".overlay");
assert.ok(group);
assert.deepEqual(
  group.querySelectorAll("text").map((node) => node.textContent),
  ["first", "second"],
);
assert.throws(
  () => computeLayout(overlay([]), { measurementAdapter }),
  /no children/i,
);
assert.throws(
  () =>
    computeLayout(overlay([first, second]), {
      measurementAdapter,
      width: 200,
    }),
  /size is derived from its content/i,
);

const nested = computeLayout(
  overlay([
    stackX([text({ text: "nested", width: 30, height: 20 })]),
    text({ text: "large", width: 90, height: 50 }),
  ]),
  { measurementAdapter },
);
assert.deepEqual(nested.children[0].bbox.contentRect(), {
  x: 0,
  y: 0,
  width: 90,
  height: 50,
});
