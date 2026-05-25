import { BBox } from "../utils/bbox.js";

/**
 * Base class for layout nodes.
 */
export class Node {
  constructor() {
    this.bbox = new BBox(0, 0, 0, 0);
  }

  static isComposition(node) {
    return isLayoutNode(node) && Array.isArray(node.children);
  }

  static isRepeat(node) {
    return isLayoutNode(node) && node.isRepeat === true;
  }

  static isStack(node) {
    return isLayoutNode(node) && node.isStack === true;
  }

  /**
   * Renders a leaf layout node.
   * @param {HTMLElement|SVGElement} container
   * @param {Object} renderOptions
   */
  render(container, renderOptions = {}) {
    if (!this.element) return;

    const content = this.bbox.contentRect();
    this.element.render(container, {
      width:
        renderOptions.width !== undefined ? renderOptions.width : content.width,
      height:
        renderOptions.height !== undefined
          ? renderOptions.height
          : content.height,
      margin:
        renderOptions.margin !== undefined
          ? renderOptions.margin
          : this.bbox.getMargin(),
    });
  }

  async export(options = {}) {
    const exportModulePath = "../export/index.js";
    const { exportNode } = await import(/* @vite-ignore */ exportModulePath);
    return exportNode(this, options);
  }
}

export function isLayoutNode(value) {
  const bbox = value?.bbox;

  return Boolean(
    value &&
    typeof value === "object" &&
    typeof value.render === "function" &&
    typeof value.export === "function" &&
    bbox &&
    typeof bbox.contentRect === "function" &&
    typeof bbox.getMargin === "function",
  );
}

export function assertLayoutNode(value, label = "node") {
  if (isLayoutNode(value)) return;

  const actual = value?.constructor?.name || typeof value;
  throw new TypeError(
    `${label} must be a layout node created by chart(), custom(), text(), image(), frame(), stackX(), stackY(), repeatX(), repeatY(), or embed(); received ${actual}.`,
  );
}
