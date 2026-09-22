import assert from "node:assert/strict";
import {
  custom,
  customContainer,
  embed,
  wrapper,
  repeat,
  repeatX,
  stackX,
  stackY,
} from "../../src/index.js";
import { LayoutCalculator, Node } from "../../src/layout.js";
import { createFakeSvg, withFakeSvgDocument } from "../helpers/fake-svg.mjs";

const zeroMargin = { top: 0, right: 0, bottom: 0, left: 0 };
const originalAdapter = LayoutCalculator.getMeasurementAdapter();

function leaf(id) {
  const node = new Node();
  node.classTag = "leaf";
  node.element = {
    options: { width: 10, height: 10, margin: zeroMargin },
    render(container) {
      const rect = container.ownerDocument.createElementNS(
        "http://www.w3.org/2000/svg",
        "rect",
      );
      rect.setAttribute("data-id", id);
      rect.setAttribute("width", 10);
      rect.setAttribute("height", 10);
      container.appendChild(rect);
    },
  };
  return node;
}

try {
  LayoutCalculator.setMeasurementAdapter({
    measureMargin() {
      return zeroMargin;
    },
  });

  await withFakeSvgDocument(async (document) => {
    const container = document.createElement("div");
    const view = wrapper(stackX([leaf("wrapper-a"), leaf("wrapper-b")]), {
      fill: "white",
    });

    view.render(container, { debugBBox: true });

    assert.equal(container.querySelectorAll("svg").length, 1);
    assert.equal(container.querySelectorAll(".stackX").length, 1);
    assert.equal(
      container
        .querySelectorAll("rect")
        .filter((rect) => rect.getAttribute("data-id") !== null).length,
      2,
    );
    const debugLayer = container.querySelectorAll(".debug-bbox")[0];
    assert.ok(debugLayer);
    assert.equal(debugLayer.querySelectorAll("rect").length, 8);
    const frameGroup = container.querySelectorAll(".wrapper")[0];
    assert.deepEqual(
      frameGroup.children.map((child) => child.getAttribute("class")),
      ["wrapper-background", "stackX", "wrapper-border"],
    );
  });

  await withFakeSvgDocument(async (document) => {
    const container = document.createElement("div");
    let factoryCalls = 0;
    const view = repeatX(
      ["A", "B"],
      (value) => {
        factoryCalls += 1;
        return stackY([leaf(`${value}-top`), leaf(`${value}-bottom`)]);
      },
      { width: 80, height: 40, paddingInner: 0, paddingOuter: 0 },
    );

    view.render(container);

    assert.equal(factoryCalls, 2);
    assert.equal(container.querySelectorAll("svg").length, 1);
    assert.equal(container.querySelectorAll(".stackY").length, 2);
    assert.equal(container.querySelectorAll("rect").length, 4);
  });

  await withFakeSvgDocument(async (document) => {
    const container = document.createElement("div");
    const collidingLeaf = custom(
      {
        options: { width: 10, height: 10, margin: zeroMargin },
        render(svg) {
          const rect = svg.ownerDocument.createElementNS(
            "http://www.w3.org/2000/svg",
            "rect",
          );
          rect.setAttribute("data-id", "custom-repeat-name");
          svg.appendChild(rect);
        },
      },
      { classTag: "repeatX" },
    );

    stackX([collidingLeaf]).render(container);

    assert.ok(container.querySelector('[data-id="custom-repeat-name"]'));
  });

  await withFakeSvgDocument(async (document) => {
    const container = document.createElement("div");
    const slots = customContainer({
      width: 200,
      height: 100,
      margin: zeroMargin,
      slots: () => [{ key: 0, x: 100, y: 50, width: 100, height: 60 }],
    });
    const view = embed(
      slots,
      repeat(["only"], () => stackX([leaf("left"), leaf("right")])),
    );

    view.render(container, { debugBBox: true });

    const stack = container.querySelector(".stackX");
    assert.equal(stack.getAttribute("transform"), "translate(90, 45)");
    const matchingDebugRect = container
      .querySelector(".debug-bbox")
      .querySelectorAll("rect")
      .find(
        (rect) =>
          rect.getAttribute("x") === "90" &&
          rect.getAttribute("y") === "45" &&
          rect.getAttribute("width") === "20" &&
          rect.getAttribute("height") === "10",
      );
    assert.ok(matchingDebugRect);
  });

  await withFakeSvgDocument(async (document) => {
    const container = document.createElement("div");
    const slots = customContainer({
      width: 200,
      height: 100,
      margin: zeroMargin,
      slots: () => [{ key: 0, x: 100, y: 50, width: 100, height: 60 }],
    });
    const view = embed(
      slots,
      repeat(["only"], () => wrapper(leaf("wrapped"), { padding: 5 })),
    );

    view.render(container);

    assert.equal(
      container.querySelector(".wrapper").getAttribute("transform"),
      "translate(90, 40)",
    );
  });

  await withFakeSvgDocument(async (document) => {
    const container = document.createElement("div");
    const data = [{ id: "left" }, { id: "right" }];
    const slots = customContainer({
      width: 80,
      height: 40,
      slots: () => [
        { key: "left", x: 20, y: 20, width: 20, height: 20 },
        { key: "right", x: 60, y: 20, width: 20, height: 20 },
      ],
    });
    const view = embed(
      slots,
      repeat(data, ({ id }) => stackX([leaf(`${id}-a`), leaf(`${id}-b`)])),
      { key: "id" },
    );

    view.render(container);

    assert.equal(container.querySelectorAll("svg").length, 1);
    assert.equal(container.querySelectorAll(".stackX").length, 2);
    assert.equal(container.querySelectorAll("rect").length, 4);
  });

  {
    const svg = createFakeSvg();
    wrapper(stackX([leaf("direct-a"), leaf("direct-b")])).render(svg);

    assert.equal(svg.querySelectorAll("svg").length, 0);
    assert.equal(svg.querySelectorAll(".stackX").length, 1);
  }
} finally {
  LayoutCalculator.setMeasurementAdapter(originalAdapter);
}
