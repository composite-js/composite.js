import * as d3 from "d3";
import { BBox } from "../utils/bbox.js";
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
    const width =
      renderOptions.width !== undefined
        ? renderOptions.width
        : this.bbox.contentRect().width;
    const height =
      renderOptions.height !== undefined
        ? renderOptions.height
        : this.bbox.contentRect().height;
    const innerWidth = Math.max(
      0,
      width - this.padding.left - this.padding.right,
    );
    const innerHeight = Math.max(
      0,
      height - this.padding.top - this.padding.bottom,
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
      width: innerWidth,
      height: innerHeight,
      margin: this.child.bbox?.getMargin?.() || {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      },
    });

    const rect = parent
      .append("rect")
      .attr("x", this.padding.left)
      .attr("y", this.padding.top)
      .attr("width", innerWidth)
      .attr("height", innerHeight)
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
