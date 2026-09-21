import { BBox } from "../utils/bbox.js";
import { isSvgContainer } from "../utils/dom.js";
import { LayoutEngine } from "./engine.js";
import { Node, assertLayoutNode } from "./node.js";

function normalizePadding(padding = 0) {
  if (typeof padding === "number") {
    return { top: padding, right: padding, bottom: padding, left: padding };
  }

  return {
    top: padding.top || 0,
    right: padding.right || 0,
    bottom: padding.bottom || 0,
    left: padding.left || 0,
  };
}

export class Frame extends Node {
  constructor(child, options = {}) {
    super();
    assertLayoutNode(child, "frame child");
    this.child = child;
    this.classTag = "frame";
    this.type = "frame";
    this.padding = normalizePadding(options.padding);
    this.stroke = options.stroke || "black";
    this.fill = options.fill || "none";
    this.strokeWidth =
      options.strokeWidth !== undefined ? options.strokeWidth : 1;
    this.strokeDasharray = options.strokeDasharray;
    this.options = {
      ...options,
      margin: options.margin || { top: 0, right: 0, bottom: 0, left: 0 },
    };
  }

  updateBBoxFromChild() {
    const childWidth = this.child.bbox.totalWidth();
    const childHeight = this.child.bbox.totalHeight();
    const bbox = new BBox(
      0,
      0,
      childWidth + this.padding.left + this.padding.right,
      childHeight + this.padding.top + this.padding.bottom,
    );
    bbox.setMargin(this.options.margin);
    this.bbox = bbox;
  }

  render(container, renderOptions = {}) {
    return isSvgContainer(container)
      ? LayoutEngine.renderInto(this, container, renderOptions)
      : LayoutEngine.layout(this, container, renderOptions);
  }
}

export function frame(child, options = {}) {
  return new Frame(child, options);
}
