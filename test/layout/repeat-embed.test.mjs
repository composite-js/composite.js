import assert from "node:assert/strict";
import {
  LayoutCalculator,
  LayoutEngine,
  LayoutRenderer,
  Node,
} from "../../src/layout.js";
import { embed, repeat, sequenceContainer } from "../../src/index.js";
import { createFakeSvg, withFakeSvgDocument } from "../helpers/fake-svg.mjs";

const zeroMargin = { top: 0, right: 0, bottom: 0, left: 0 };
const originalAdapter = LayoutCalculator.getMeasurementAdapter();

function fakeLeaf(id) {
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

  {
    const repeated = repeat(
      [
        { id: "a0", week: 0, learner: "learner-a" },
        { id: "b1", week: 1, learner: "learner-b" },
      ],
      (item) => fakeLeaf(item.id),
    );

    assert.equal(repeated.domain.length, 2);

    const embedded = embed(
      sequenceContainer({
        width: 120,
        height: 80,
        xDomain: [0, 1],
        yDomain: ["learner-a", "learner-b"],
        tracks: ["learner-a", "learner-b"],
      }),
      repeated,
      { x: "week", y: "learner", key: "id", width: 10, height: 10 },
    );

    const computed = LayoutEngine.computeLayout(embedded);
    assert.equal(computed.bbox.contentRect().width, 120);
    assert.equal(computed.bbox.contentRect().height, 80);

    const root = createFakeSvg();
    LayoutRenderer.render(computed, root);

    const rects = root.querySelectorAll("rect");
    const groups = root.querySelectorAll("g");

    assert.equal(rects.length, 2);
    assert.ok(
      groups.some(
        (group) => group.getAttribute("transform") === "translate(25, 15)",
      ),
    );
    assert.ok(
      groups.some(
        (group) => group.getAttribute("transform") === "translate(85, 55)",
      ),
    );
  }

  {
    const repeated = repeat(
      [
        { id: "a0", week: 0, learner: "learner-a" },
        { id: "b1", week: 1, learner: "learner-b" },
      ],
      (item) => fakeLeaf(item.id),
    );

    const embedded = embed(
      sequenceContainer({
        width: 120,
        height: 80,
        xDomain: [0, 1],
        yDomain: ["learner-a", "learner-b"],
        tracks: ["learner-a", "learner-b"],
      }),
      repeated,
      { x: "week", y: "learner", key: "id", width: 10, height: 10 },
    );

    await withFakeSvgDocument(async (document) => {
      const container = document.createElement("div");
      const rendered = embedded.render(container);
      const svg = container.firstElementChild;

      assert.equal(svg?.tagName, "svg");
      assert.equal(rendered, svg);
      assert.equal(svg.getAttribute("width"), "120");
      assert.equal(svg.getAttribute("height"), "80");
      assert.equal(svg.querySelectorAll("rect").length, 2);
    });
  }

  {
    const embedded = embed(
      sequenceContainer({
        width: 20,
        height: 20,
        xDomain: [0],
        yDomain: ["a"],
      }),
      repeat([{ id: "bad", week: 0, learner: "a" }], () => ({ bad: true })),
      { x: "week", y: "learner", key: "id" },
    );

    assert.throws(
      () => LayoutEngine.computeLayout(embedded),
      /repeat child 0/i,
    );
  }
} finally {
  LayoutCalculator.setMeasurementAdapter(originalAdapter);
}
