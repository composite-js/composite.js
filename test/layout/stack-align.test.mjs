import assert from "node:assert/strict";
import {
  LayoutCalculator,
  LayoutEngine,
  Node,
  RepeatX,
  RepeatY,
  Stack,
  stackX,
  stackY,
} from "../../src/layout.js";

const originalEstimateMargin = LayoutCalculator.estimateMargin;
const originalSuggestWidthHeight = LayoutCalculator.suggestWidthHeight;
const originalDocument = globalThis.document;

function fakeChart(name, { width, height, margin, padding } = {}) {
  const node = new Node();
  node.classTag = name;
  node.element = {
    options: {
      width,
      height,
      margin,
    },
    padding: padding ? { ...padding } : undefined,
    renderer: padding ? { padding: { ...padding } } : undefined,
    render() {},
  };
  return node;
}

function globalContentRect(node, target, offsetX = 0, offsetY = 0) {
  const rect = node.bbox.contentRect();
  const x = offsetX + rect.x;
  const y = offsetY + rect.y;

  if (node === target) {
    return {
      x,
      y,
      width: rect.width,
      height: rect.height,
    };
  }

  if (node instanceof Stack) {
    for (const child of node.children) {
      const result = globalContentRect(child, target, x, y);
      if (result) return result;
    }
  }

  return null;
}

function requireGlobalContentRect(root, target) {
  const rect = globalContentRect(root, target);
  assert.ok(rect, `Expected to find ${target.classTag}`);
  return rect;
}

{
  let renderOptions;
  const node = fakeChart("repeatChild");

  node.element.render = (_container, options) => {
    renderOptions = options;
  };

  node.render(
    {},
    {
      width: 32,
      height: 48,
      margin: { top: 1, right: 2, bottom: 3, left: 4 },
    },
  );

  assert.equal(renderOptions.width, 32);
  assert.equal(renderOptions.height, 48);
  assert.deepEqual(renderOptions.margin, {
    top: 1,
    right: 2,
    bottom: 3,
    left: 4,
  });
}

try {
  LayoutCalculator.estimateMargin = (element) =>
    element.options.margin || { top: 0, right: 0, bottom: 0, left: 0 };
  LayoutCalculator.suggestWidthHeight = () => ({ width: 400, height: 300 });

  {
    const first = fakeChart("first", {
      width: 100,
      height: 50,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });
    const second = fakeChart("second", {
      width: 100,
      height: 50,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });

    const root = stackY([first, second], { margin: 8 });

    LayoutEngine.computeLayout(root);

    const firstRect = requireGlobalContentRect(root, first);
    const secondRect = requireGlobalContentRect(root, second);

    assert.equal(secondRect.y - (firstRect.y + firstRect.height), 8);
  }

  {
    const first = fakeChart("first", {
      width: 100,
      height: 50,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });
    const second = fakeChart("second", {
      width: 100,
      height: 50,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });

    const root = stackX([first, second], { margin: 8 });

    LayoutEngine.computeLayout(root);

    const firstRect = requireGlobalContentRect(root, first);
    const secondRect = requireGlobalContentRect(root, second);

    assert.equal(secondRect.x - (firstRect.x + firstRect.width), 8);
  }

  {
    const topBar = fakeChart("topBar", {
      width: 500,
      height: 120,
      margin: { top: 5, right: 8, bottom: 7, left: 12 },
      padding: { xInner: 0.1, xOuter: 0.1, yInner: 0.1, yOuter: 0.1 },
    });
    const originalTopPadding = { ...topBar.element.padding };
    const leftBar = fakeChart("leftBar", {
      width: 100,
      height: 300,
      margin: { top: 3, right: 11, bottom: 4, left: 13 },
    });
    const matrix = fakeChart("matrix", {
      width: 300,
      height: 300,
      margin: { top: 2, right: 17, bottom: 6, left: 19 },
      padding: { xInner: 0, xOuter: 0, yInner: 0, yOuter: 0 },
    });
    const rightChart = fakeChart("rightChart", {
      width: 200,
      height: 300,
      margin: { top: 3, right: 23, bottom: 4, left: 29 },
    });

    const composite = stackX([leftBar, matrix, rightChart]);
    const root = stackY([topBar, composite], {
      align: [matrix, matrix],
    });

    LayoutEngine.computeLayout(root);

    const topRect = requireGlobalContentRect(root, topBar);
    const matrixRect = requireGlobalContentRect(root, matrix);
    const compositeRect = requireGlobalContentRect(root, composite);
    const rightRect = requireGlobalContentRect(root, rightChart);

    assert.equal(topRect.x, matrixRect.x);
    assert.equal(topRect.width, matrixRect.width);
    assert.ok(
      compositeRect.x + compositeRect.width >= rightRect.x + rightRect.width,
      "composite should still include charts to the right of the aligned target",
    );
    assert.equal(topBar.element.padding.xInner, originalTopPadding.xInner);
    assert.equal(topBar.element.padding.xOuter, originalTopPadding.xOuter);
    assert.equal(
      topBar.element.renderer.padding.xInner,
      originalTopPadding.xInner,
    );
    assert.equal(
      topBar.element.renderer.padding.xOuter,
      originalTopPadding.xOuter,
    );
  }

  {
    const left = fakeChart("left", {
      width: 120,
      height: 500,
      margin: { top: 12, right: 8, bottom: 7, left: 5 },
    });
    const top = fakeChart("top", {
      width: 300,
      height: 80,
      margin: { top: 13, right: 3, bottom: 11, left: 4 },
    });
    const matrix = fakeChart("matrix", {
      width: 300,
      height: 220,
      margin: { top: 19, right: 17, bottom: 6, left: 2 },
    });
    const bottom = fakeChart("bottom", {
      width: 300,
      height: 90,
      margin: { top: 23, right: 5, bottom: 4, left: 6 },
    });

    const nested = stackY([top, matrix, bottom]);
    const root = stackX([left, nested], {
      align: [matrix, matrix],
    });

    LayoutEngine.computeLayout(root);

    const leftRect = requireGlobalContentRect(root, left);
    const matrixRect = requireGlobalContentRect(root, matrix);
    const nestedRect = requireGlobalContentRect(root, nested);
    const bottomRect = requireGlobalContentRect(root, bottom);

    assert.equal(leftRect.y, matrixRect.y);
    assert.equal(leftRect.height, matrixRect.height);
    assert.ok(
      nestedRect.y + nestedRect.height >= bottomRect.y + bottomRect.height,
      "nested vertical stack should still include charts below the aligned target",
    );
  }

  {
    const topBar = fakeChart("topBar", {
      width: 500,
      height: 120,
      margin: { top: 5, right: 8, bottom: 7, left: 12 },
    });
    const matrix = fakeChart("matrix", {
      width: 300,
      height: 220,
      margin: { top: 19, right: 17, bottom: 6, left: 2 },
    });
    const pieRow = new RepeatX(["I0", "I1", "I2"], () =>
      fakeChart("pie", {
        width: 40,
        height: 40,
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
      }),
    );

    const root = stackY([topBar, matrix, pieRow], {
      align: [matrix, matrix, matrix],
    });

    LayoutEngine.computeLayout(root);

    const matrixRect = requireGlobalContentRect(root, matrix);
    const pieRowRect = requireGlobalContentRect(root, pieRow);

    assert.equal(pieRowRect.x, matrixRect.x);
    assert.equal(pieRowRect.width, matrixRect.width);
    assert.equal(pieRowRect.height, 40);
  }

  {
    const repeatColumn = new RepeatY(["A", "B", "C"], () =>
      fakeChart("sparkline", {
        width: 64,
        height: 20,
        margin: { top: 2, right: 3, bottom: 4, left: 5 },
      }),
    );

    LayoutEngine.computeLayout(repeatColumn);

    const repeatRect = repeatColumn.bbox.contentRect();

    assert.equal(repeatRect.width, 72);
    assert.ok(
      repeatRect.height > 0,
      "repeat column should keep a non-zero height across its repeated values",
    );
  }
} finally {
  LayoutCalculator.estimateMargin = originalEstimateMargin;
  LayoutCalculator.suggestWidthHeight = originalSuggestWidthHeight;
  globalThis.document = originalDocument;
}

{
  globalThis.document = undefined;
  assert.throws(
    () =>
      originalEstimateMargin({
        options: { width: 100, height: 50 },
        render() {},
      }),
    /requires a DOM with SVG getBBox support/,
  );
  globalThis.document = originalDocument;
}

{
  let removed = false;
  let renderedSvg;
  let renderOptions;
  const fakeSvg = {
    style: {},
    setAttribute() {},
    getBBox() {
      return { x: -12, y: -5, width: 150, height: 75 };
    },
    remove() {
      removed = true;
    },
  };

  globalThis.document = {
    body: {
      appendChild(node) {
        assert.equal(node, fakeSvg);
      },
    },
    createElementNS(namespace, tagName) {
      assert.equal(namespace, "http://www.w3.org/2000/svg");
      assert.equal(tagName, "svg");
      return fakeSvg;
    },
  };

  const margin = originalEstimateMargin({
    options: { width: 100, height: 50 },
    render(svg, options) {
      renderedSvg = svg;
      renderOptions = options;
    },
  });

  assert.equal(renderedSvg, fakeSvg);
  assert.deepEqual(renderOptions.margin, {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  });
  assert.deepEqual(margin, { top: 5, right: 38, bottom: 20, left: 12 });
  assert.equal(removed, true);
  globalThis.document = originalDocument;
}
