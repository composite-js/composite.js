import { Chart } from "../chart/chart.js";
import { ImageElement } from "./image.js";
import { TextElement } from "./text.js";
import { Node, NodeKind, setNodeKind, copyOptions } from "./node.js";
import { Overlay, RepeatX, RepeatY, Stack } from "./composition.js";
import { wrapper as createWrapper } from "./wrapper.js";

function freezeLeaf(node) {
  for (const key of ["options", "encoding", "padding", "margin"]) {
    if (node.element[key]) node.element[key] = copyOptions(node.element[key]);
  }
  Object.freeze(node.element);
  return Object.freeze(node);
}

export function chart(config) {
  const node = new Node();
  setNodeKind(node, NodeKind.CHART);
  node.element = new Chart(copyOptions(config));
  node.classTag = "chart";
  return freezeLeaf(node);
}

export function text(config = {}) {
  const node = new Node();
  node.element = new TextElement(copyOptions(config));
  node.classTag = "text";
  return freezeLeaf(node);
}

export function image(config = {}) {
  const node = new Node();
  node.element = new ImageElement(copyOptions(config));
  node.classTag = "image";
  return freezeLeaf(node);
}

export function custom(renderable, options = {}) {
  if (
    typeof renderable !== "function" &&
    (!renderable || typeof renderable.render !== "function")
  ) {
    throw new TypeError("custom() requires a renderable with a render method.");
  }

  const node = new Node();
  if (typeof renderable === "function") node.createElement = renderable;
  else node.element = renderable;
  node.options = copyOptions(options);
  node.classTag = options.classTag || "custom";
  return Object.freeze(node);
}

export function wrapper(node, options) {
  return createWrapper(node, options);
}

export function stackX(nodes, options) {
  return new Stack(nodes, "horizontal", options);
}

export function stackY(nodes, options) {
  return new Stack(nodes, "vertical", options);
}

export function overlay(nodes) {
  return new Overlay(nodes);
}

export function repeatX(domain, func, options) {
  return new RepeatX(domain, func, options);
}

export function repeatY(domain, func, options) {
  return new RepeatY(domain, func, options);
}
