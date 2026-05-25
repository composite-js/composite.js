import { Chart } from "../chart.js";
import { frame as createFrame } from "./frame.js";
import { ImageElement } from "./image.js";
import { TextElement } from "./text.js";
import { Node } from "./node.js";
import { RepeatX, RepeatY, Stack } from "./composition.js";

export function chart(config) {
  const node = new Node();
  node.element = new Chart(config);
  node.classTag = "chart";
  return node;
}

export function text(config = {}) {
  const node = new Node();
  node.element = new TextElement(config);
  node.classTag = "text";
  return node;
}

export function image(config = {}) {
  const node = new Node();
  node.element = new ImageElement(config);
  node.classTag = "image";
  return node;
}

export function custom(renderable, options = {}) {
  if (!renderable || typeof renderable.render !== "function") {
    throw new TypeError("custom() requires a renderable with a render method.");
  }

  const node = new Node();
  node.element = renderable;
  node.classTag = options.classTag || "custom";
  return node;
}

export function frame(node, options) {
  return createFrame(node, options);
}

export function stackX(nodes, options) {
  return new Stack(nodes, "horizontal", options);
}

export function stackY(nodes, options) {
  return new Stack(nodes, "vertical", options);
}

export function repeatX(domain, func, options) {
  return new RepeatX(domain, func, options);
}

export function repeatY(domain, func, options) {
  return new RepeatY(domain, func, options);
}
