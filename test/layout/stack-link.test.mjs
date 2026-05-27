import assert from "node:assert/strict";
import { chart, stackX, stackY, text } from "../../src/index.js";
import { LayoutCalculator } from "../../src/layout.js";
import { withFakeSvgDocument } from "../helpers/fake-svg.mjs";

const originalEstimateMargin = LayoutCalculator.estimateMargin;

const zeroMargin = { top: 0, right: 0, bottom: 0, left: 0 };
const categories = ["A", "B"];

function horizontalBars(overrides = {}) {
  return chart({
    mark: "bar",
    data: [
      { category: "A", value: 40 },
      { category: "B", value: 80 },
    ],
    width: 100,
    height: 40,
    margin: zeroMargin,
    encoding: {
      x: "value",
      y: "category",
      xDomain: [0, 100],
      yDomain: categories,
    },
    showXAxis: false,
    showYAxis: false,
    padding: { yInner: 0, yOuter: 0 },
    ...overrides,
  });
}

function verticalBars(overrides = {}) {
  return chart({
    mark: "bar",
    data: [
      { category: "A", value: 40 },
      { category: "B", value: 80 },
    ],
    width: 40,
    height: 100,
    margin: zeroMargin,
    encoding: {
      x: "category",
      y: "value",
      xDomain: categories,
      yDomain: [0, 100],
    },
    showXAxis: false,
    showYAxis: false,
    padding: { xInner: 0, xOuter: 0 },
    ...overrides,
  });
}

function verticalPac(overrides = {}) {
  return chart({
    mark: "pac",
    data: [
      { category: "A", size: 25 },
      { category: "B", size: 100 },
    ],
    width: 40,
    height: 40,
    margin: zeroMargin,
    encoding: {
      x: "size",
      y: "category",
      yDomain: categories,
    },
    showXAxis: false,
    showYAxis: false,
    padding: { yInner: 0, yOuter: 0 },
    ...overrides,
  });
}

function horizontalPac(overrides = {}) {
  return chart({
    mark: "pac",
    data: [
      { category: "A", size: 25 },
      { category: "B", size: 100 },
    ],
    width: 40,
    height: 40,
    margin: zeroMargin,
    encoding: {
      x: "category",
      y: "size",
      xDomain: categories,
    },
    showXAxis: false,
    showYAxis: false,
    padding: { xInner: 0, xOuter: 0 },
    ...overrides,
  });
}

function lineAttrs(line) {
  return {
    x1: Number(line.getAttribute("x1")),
    y1: Number(line.getAttribute("y1")),
    x2: Number(line.getAttribute("x2")),
    y2: Number(line.getAttribute("y2")),
  };
}

await withFakeSvgDocument(async (document) => {
  LayoutCalculator.estimateMargin = () => zeroMargin;

  try {
    {
      const container = document.createElement("div");
      const root = stackX([horizontalBars(), verticalPac()], {
        margin: 10,
        link: true,
      });

      root.render(container);

      const svg = container.firstElementChild;
      const stackGroup = svg.querySelector(".stackX");
      const linkLayer = svg.querySelector(".stack-link-layer");
      const lines = svg.querySelectorAll(".stack-link");

      assert.equal(lines.length, 2);
      assert.equal(stackGroup.children[0], linkLayer);
      assert.deepEqual(lineAttrs(lines[0]), {
        x1: 40,
        y1: 10,
        x2: 125,
        y2: 10,
      });
      assert.deepEqual(lineAttrs(lines[1]), {
        x1: 80,
        y1: 30,
        x2: 120,
        y2: 30,
      });
    }

    {
      const container = document.createElement("div");
      const root = stackY([verticalBars(), horizontalPac()], {
        margin: 10,
        link: true,
      });

      root.render(container);

      const svg = container.firstElementChild;
      const stackGroup = svg.querySelector(".stackY");
      const linkLayer = svg.querySelector(".stack-link-layer");
      const lines = svg.querySelectorAll(".stack-link");

      assert.equal(lines.length, 2);
      assert.equal(stackGroup.children[0], linkLayer);
      assert.deepEqual(lineAttrs(lines[0]), {
        x1: 10,
        y1: 100,
        x2: 10,
        y2: 125,
      });
      assert.deepEqual(lineAttrs(lines[1]), {
        x1: 30,
        y1: 100,
        x2: 30,
        y2: 120,
      });
    }

    const assertLinkThrows = (createRoot, pattern) => {
      assert.throws(() => {
        const container = document.createElement("div");
        const root = createRoot();
        root.render(container);
      }, pattern);
    };

    assertLinkThrows(
      () =>
        stackX([horizontalBars(), verticalPac(), horizontalBars()], {
          link: true,
        }),
      /exactly two/i,
    );
    assertLinkThrows(
      () => stackX([text({ text: "A" }), verticalPac()], { link: true }),
      /direct chart/i,
    );
    assertLinkThrows(
      () =>
        stackX(
          [
            horizontalBars(),
            verticalPac({
              data: [
                { group: "A", size: 25 },
                { group: "B", size: 100 },
              ],
              encoding: { x: "size", y: "group", yDomain: categories },
            }),
          ],
          { link: true },
        ),
      /same encoding\.y/i,
    );
    assertLinkThrows(
      () =>
        stackX(
          [
            chart({
              mark: "line",
              data: [
                { year: 2020, value: 1 },
                { year: 2021, value: 2 },
              ],
              width: 100,
              height: 40,
              margin: zeroMargin,
              encoding: { x: "year", y: "value" },
            }),
            chart({
              mark: "line",
              data: [
                { year: 2020, value: 3 },
                { year: 2021, value: 4 },
              ],
              width: 100,
              height: 40,
              margin: zeroMargin,
              encoding: { x: "year", y: "value" },
            }),
          ],
          { link: true },
        ),
      /does not support stack links/i,
    );
    assertLinkThrows(
      () => stackX([verticalBars(), verticalBars()], { link: true }),
      /cannot provide anchors for encoding\.y/i,
    );
    assertLinkThrows(
      () =>
        stackX(
          [
            horizontalBars({
              data: [
                { category: "A", value: 40 },
                { category: "A", value: 80 },
              ],
            }),
            horizontalBars(),
          ],
          { link: true },
        ),
      /duplicate link key/i,
    );
  } finally {
    LayoutCalculator.estimateMargin = originalEstimateMargin;
  }
});
