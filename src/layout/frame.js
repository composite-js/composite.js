import * as d3 from "d3";
import { BBox } from "../utils/bbox.js";
import { isHtmlContainer } from "../utils/dom.js";
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
    if (isHtmlContainer(container)) {
      return LayoutEngine.layout(this, container, renderOptions);
    }

    const width =
      renderOptions.width !== undefined
        ? renderOptions.width
        : this.bbox.contentRect().width;
    const height =
      renderOptions.height !== undefined
        ? renderOptions.height
        : this.bbox.contentRect().height;
    const childOuterWidth = Math.max(
      0,
      width - this.padding.left - this.padding.right,
    );
    const childOuterHeight = Math.max(
      0,
      height - this.padding.top - this.padding.bottom,
    );
    const childMargin = this.child.bbox?.getMargin?.() || {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    };
    const childWidth = Math.max(
      0,
      childOuterWidth - childMargin.left - childMargin.right,
    );
    const childHeight = Math.max(
      0,
      childOuterHeight - childMargin.top - childMargin.bottom,
    );
    const parent = d3.select(container);

    parent.selectAll("*").remove();

    const childGroup = parent
      .append("g")
      .attr(
        "transform",
        `translate(${this.padding.left}, ${this.padding.top})`,
      );

    this.child.render(childGroup.node(), {
      width: childWidth,
      height: childHeight,
      margin: childMargin,
    });

    const rect = parent
      .append("rect")
      .attr("x", this.padding.left)
      .attr("y", this.padding.top)
      .attr("width", childOuterWidth)
      .attr("height", childOuterHeight)
      .attr("fill", this.fill)
      .attr("stroke", this.stroke)
      .attr("stroke-width", this.strokeWidth);

    if (this.strokeDasharray !== undefined) {
      rect.attr("stroke-dasharray", this.strokeDasharray);
    }
  }
}

export function frame(child, options = {}) {
  return new Frame(child, options);
}
