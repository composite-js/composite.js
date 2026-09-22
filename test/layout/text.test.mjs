import assert from "node:assert/strict";
import { computeLayout, renderComputedLayout } from "../../src/index.js";
import { wrapper, text, stackX, Node } from "../../src/layout.js";
import { createFakeSvg } from "../helpers/fake-svg.mjs";

{
  const node = text({
    text: "18-Jun",
    width: 60,
    height: 24,
    x: 30,
    y: 12,
    fill: "#333",
    fontFamily: "Inter, sans-serif",
    fontSize: 12,
    fontWeight: 600,
    textAnchor: "middle",
    dominantBaseline: "middle",
    rotate: 45,
    opacity: 0.8,
    className: "date-label",
    id: "date-18-jun",
    title: "Week of 18-Jun",
  });

  assert.ok(node instanceof Node);
  assert.equal(node.classTag, "text");

  const svg = createFakeSvg();
  node.render(svg, {
    width: 60,
    height: 24,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  });

  const renderedText = svg.querySelectorAll("text")[0];
  assert.equal(renderedText.textContent, "18-Jun");
  assert.equal(renderedText.getAttribute("fill"), "#333");
  assert.equal(renderedText.getAttribute("font-family"), "Inter, sans-serif");
  assert.equal(renderedText.getAttribute("font-size"), "12");
  assert.equal(renderedText.getAttribute("font-weight"), "600");
  assert.equal(renderedText.getAttribute("text-anchor"), "middle");
  assert.equal(renderedText.getAttribute("dominant-baseline"), "middle");
  assert.equal(renderedText.getAttribute("opacity"), "0.8");
  assert.equal(renderedText.getAttribute("class"), "date-label");
  assert.equal(renderedText.getAttribute("id"), "date-18-jun");
  assert.equal(renderedText.getAttribute("transform"), "rotate(45, 30, 12)");
  assert.equal(
    renderedText.querySelectorAll("title")[0].textContent,
    "Week of 18-Jun",
  );
}

{
  const first = text({ text: "A", width: 20, height: 10 });
  const second = text({ text: "B", width: 20, height: 10 });

  assert.equal(stackX([first, second]).classTag, "stackX");
}

{
  const child = text({ text: "boxed", width: 50, height: 20 });
  const node = wrapper(child, {
    stroke: "black",
    fill: "none",
    padding: { top: 2, right: 3, bottom: 4, left: 5 },
  });

  assert.ok(node instanceof Node);
  assert.equal(node.classTag, "wrapper");

  const svg = createFakeSvg();
  const computed = computeLayout(node, { document: svg.ownerDocument });
  renderComputedLayout(computed, svg);

  const rect = svg.querySelectorAll("rect")[0];
  assert.equal(rect.getAttribute("stroke"), "black");
  assert.equal(rect.getAttribute("fill"), "none");
  assert.equal(rect.getAttribute("x"), "0");
  assert.equal(rect.getAttribute("y"), "0");
  assert.equal(
    Number(rect.getAttribute("width")),
    computed.children[0].bbox.totalWidth() + 8,
  );
  assert.equal(
    Number(rect.getAttribute("height")),
    computed.children[0].bbox.totalHeight() + 6,
  );
  assert.equal(svg.querySelectorAll("text").length, 1);
}
