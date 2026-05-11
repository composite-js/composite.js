import * as d3 from "d3";
import { BBox } from "../utils/bbox.js";
import { LayoutEngine } from "./engine.js";
import { Node, assertLayoutNode } from "./node.js";

function assertNodeArray(nodes, label) {
  if (!Array.isArray(nodes)) {
    throw new TypeError(`${label} must be an array of layout nodes.`);
  }

  nodes.forEach((node, index) => {
    assertLayoutNode(node, `${label}[${index}]`);
  });
}

/**
 * Base class for all compositions.
 */
export class Composition extends Node {
  constructor() {
    super();
    this.classTag = "composition";
    this.children = [];
  }

  /**
   * Updates this composition bbox from its children.
   */
  updateBBox() {
    if (!this.children?.length) return;

    let combinedBBox = this.children[0].bbox;
    for (let i = 1; i < this.children.length; i++) {
      combinedBBox = combinedBBox.union(this.children[i].bbox);
    }

    const content = combinedBBox.contentRect();
    this.children.forEach((child) => {
      child.bbox.translateBy(-content.x, -content.y);
    });

    const normalizedBBox = new BBox(0, 0, content.width, content.height);
    normalizedBBox.setMargin(combinedBBox.getMargin());
    this.bbox = normalizedBBox;
  }
}

/**
 * Stack composition class.
 */
export class Stack extends Composition {
  constructor(nodes, direction, options = {}) {
    super();
    assertNodeArray(nodes, "nodes");

    this.children = nodes;
    this.direction = direction;
    this.isStack = true;
    this.type = "stack";
    this.classTag = direction === "horizontal" ? "stackX" : "stackY";
    this.margin = options.margin || 0;
    this.align = options.align || [];
    this.alignedNodes = [];

    for (let i = 0; i < nodes.length; i++) {
      const alignedNode =
        this.align[i] !== undefined && this.align[i] !== null
          ? this.align[i]
          : nodes[i];

      if (alignedNode !== null && alignedNode !== undefined) {
        assertLayoutNode(alignedNode, `align[${i}]`);
      }
      this.alignedNodes.push(alignedNode);
    }
  }

  _getAllNodes(node) {
    if (node instanceof Stack) {
      return node.flatten();
    }
    return [node];
  }

  flatten() {
    const allNodes = [];

    this.children.forEach((child) => {
      if (child instanceof Stack) {
        allNodes.push(...child.flatten());
      } else {
        allNodes.push(child);
      }
    });

    return [...new Set(allNodes)];
  }

  render(container, renderOptions = {}) {
    return LayoutEngine.layout(this, container, renderOptions);
  }
}

/**
 * Base class for repeat compositions.
 */
export class Repeat extends Composition {
  constructor(domain, func, options = {}) {
    super();
    this.isRepeat = true;
    this.type = "repeat";
    this.domain = domain || [];
    this.func = func;
    this.paddingInner =
      options.paddingInner !== undefined ? options.paddingInner : 0.1;
    this.paddingOuter =
      options.paddingOuter !== undefined ? options.paddingOuter : 0.1;
    this.width = options.width;
    this.height = options.height;

    this.options = {
      width: this.width,
      height: this.height,
      paddingInner: this.paddingInner,
      paddingOuter: this.paddingOuter,
      margin: options.margin || { top: 0, right: 0, bottom: 0, left: 0 },
    };
  }
}

export class RepeatX extends Repeat {
  constructor(domain, func, options = {}) {
    super(domain, func, options);
    this.classTag = "repeatX";
  }

  render(container, renderOptions = {}) {
    if (!this.domain || this.domain.length === 0) {
      if (container.innerHTML) container.innerHTML = "";
      return;
    }

    const { width = 400, height = 300 } = renderOptions;
    if (container.innerHTML) container.innerHTML = "";
    const gParent = d3.select(container);

    const xScale = d3
      .scaleBand()
      .domain(this.domain)
      .range([0, width])
      .paddingInner(this.paddingInner)
      .paddingOuter(this.paddingOuter);

    const bandwidth = xScale.bandwidth();

    this.domain.forEach((value, index) => {
      const node = this.func(value);
      assertLayoutNode(node, `repeatX child ${index}`);

      const g = gParent
        .append("g")
        .attr("transform", `translate(${xScale(value)}, 0)`);

      node.render(g.node(), { width: bandwidth, height });
    });
  }
}

export class RepeatY extends Repeat {
  constructor(domain, func, options = {}) {
    super(domain, func, options);
    this.classTag = "repeatY";
  }

  render(container, renderOptions = {}) {
    if (!this.domain || this.domain.length === 0) {
      if (container.innerHTML) container.innerHTML = "";
      return;
    }

    const { width = 400, height = 300 } = renderOptions;
    if (container.innerHTML) container.innerHTML = "";
    const gParent = d3.select(container);

    const yScale = d3
      .scaleBand()
      .domain(this.domain)
      .range([0, height])
      .paddingInner(this.paddingInner)
      .paddingOuter(this.paddingOuter);

    const bandwidth = yScale.bandwidth();

    this.domain.forEach((value, index) => {
      const node = this.func(value);
      assertLayoutNode(node, `repeatY child ${index}`);

      const g = gParent
        .append("g")
        .attr("transform", `translate(0, ${yScale(value)})`);

      node.render(g.node(), { width, height: bandwidth });
    });
  }
}
