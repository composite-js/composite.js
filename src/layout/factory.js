import { Chart } from "../chart.js";
import { frame as createFrame } from "./frame.js";
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

export function image(_config) {
  throw new Error("Image not implemented yet.");
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
