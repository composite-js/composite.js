import assert from "node:assert/strict";
import { custom, wrapper, image, text } from "../../src/index.js";
import { withFakeSvgDocument } from "../helpers/fake-svg.mjs";

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const zeroMargin = { top: 0, right: 0, bottom: 0, left: 0 };

await withFakeSvgDocument(async (document) => {
  const container = document.createElement("div");
  text({ text: "Root label", width: 80, height: 20 }).render(container, {
    margin: zeroMargin,
  });

  const svg = container.firstElementChild;
  assert.equal(svg?.tagName, "svg");
  assert.equal(svg?.namespaceURI, SVG_NAMESPACE);
  assert.equal(svg?.getAttribute("width"), "80");
  assert.equal(svg?.getAttribute("height"), "20");
  assert.equal(svg?.querySelector("text")?.namespaceURI, SVG_NAMESPACE);
});

await withFakeSvgDocument(async (document) => {
  const container = document.createElement("div");
  image({
    url: "https://example.com/image.svg",
    width: 32,
    height: 24,
  }).render(container, { margin: zeroMargin });

  const svg = container.firstElementChild;
  assert.equal(svg?.tagName, "svg");
  assert.equal(svg?.querySelector("image")?.namespaceURI, SVG_NAMESPACE);
});

await withFakeSvgDocument(async (document) => {
  const container = document.createElement("div");
  let renderedNamespace;
  const node = custom({
    options: { width: 40, height: 30, margin: zeroMargin },
    render(target) {
      renderedNamespace = target.namespaceURI;
      target
        .appendChild(
          target.ownerDocument.createElementNS(SVG_NAMESPACE, "circle"),
        )
        .setAttribute("r", 4);
    },
  });

  node.render(container);

  assert.equal(container.firstElementChild?.tagName, "svg");
  assert.equal(renderedNamespace, SVG_NAMESPACE);
  assert.equal(container.querySelector("circle")?.namespaceURI, SVG_NAMESPACE);
});

await withFakeSvgDocument(async (document) => {
  const container = document.createElement("div");
  wrapper(text({ text: "Wrapped", width: 50, height: 20 }), {
    padding: 4,
  }).render(container);

  const svg = container.firstElementChild;
  assert.equal(svg?.tagName, "svg");
  assert.equal(svg?.namespaceURI, SVG_NAMESPACE);
  assert.equal(svg?.querySelector("g")?.namespaceURI, SVG_NAMESPACE);
  assert.equal(svg?.querySelector("rect")?.namespaceURI, SVG_NAMESPACE);
  assert.equal(svg?.querySelector("text")?.namespaceURI, SVG_NAMESPACE);
});
