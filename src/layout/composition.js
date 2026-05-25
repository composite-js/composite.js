import * as d3 from "d3";
import { BBox } from "../utils/bbox.js";
import { LayoutEngine } from "./engine.js";
import { Node, assertLayoutNode } from "./node.js";
import { applySharedChartDomains } from "./shared-domain.js";

function assertNodeArray(nodes, label) {
  if (!Array.isArray(nodes)) {
    throw new TypeError(`${label} must be an array of layout nodes.`);
  }

  nodes.forEach((node, index) => {
    assertLayoutNode(node, `${label}[${index}]`);
  });
}

function isSvgContainer(container) {
  return container?.namespaceURI === "http://www.w3.org/2000/svg";
}

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function normalizeStackMargin(margin, childCount) {
  if (margin === undefined) return 0;
  if (isFiniteNumber(margin)) return margin;

  if (Array.isArray(margin)) {
    const expectedLength = Math.max(childCount - 1, 0);
    if (margin.length !== expectedLength) {
      throw new RangeError(
        `stack margin array must contain ${expectedLength} values; received ${margin.length}.`,
      );
    }

    margin.forEach((value, index) => {
      if (!isFiniteNumber(value)) {
        throw new TypeError(`stack margin[${index}] must be a finite number.`);
      }
    });

    return [...margin];
  }

  throw new TypeError(
    "stack margin must be a finite number or an array of finite numbers.",
  );
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
    this.margin = normalizeStackMargin(options.margin, nodes.length);
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
    this.shareDomains =
      options.shareDomains !== undefined ? options.shareDomains : true;

    this.options = {
      width: this.width,
      height: this.height,
      paddingInner: this.paddingInner,
      paddingOuter: this.paddingOuter,
      shareDomains: this.shareDomains,
      margin: options.margin || { top: 0, right: 0, bottom: 0, left: 0 },
    };
  }

  instantiateChildren(label = "repeat") {
    this.children = this.domain.map((value, index) => {
      const node = this.func(value, index);
      assertLayoutNode(node, `${label} child ${index}`);
      return node;
    });

    if (this.shareDomains) {
      applySharedChartDomains(this.children);
    }

    return this.children;
  }
}

export class DirectionlessRepeat {
  constructor(domain, func, options = {}) {
    this.domain = domain || [];
    this.func = func;
    this.options = options;
    this.type = "repeat";
  }
}

export class Embedded extends Node {
  constructor(container, repeated, mapping = {}) {
    super();
    this.container = container;
    this.repeated = repeated;
    this.mapping = mapping;
    this.classTag = "embed";
    this.type = "embed";
    this.options = {
      width: container.width,
      height: container.height,
      margin: container.margin || { top: 0, right: 0, bottom: 0, left: 0 },
    };
    this.embeddedChildren = [];
  }

  instantiateChildren() {
    this.embeddedChildren = this.repeated.domain.map((datum, index) => {
      const child = this.repeated.func(datum, index);
      assertLayoutNode(child, `repeat child ${index}`);
      return child;
    });
    return this.embeddedChildren;
  }

  render(svg, renderOptions = {}) {
    const width = renderOptions.width || this.container.width;
    const height = renderOptions.height || this.container.height;
    const margin = renderOptions.margin || this.container.margin;
    const children = this.embeddedChildren.length
      ? this.embeddedChildren
      : this.instantiateChildren();
    const slots = this.container.slots(this.repeated.domain, this.mapping, {
      width,
      height,
    });

    this.container.render(svg, { width, height, margin });

    const parent = d3.select(svg);
    children.forEach((child, index) => {
      const slot = slots[index];
      const childRect = child.bbox.contentRect();
      const childWidth = slot.width || childRect.width;
      const childHeight = slot.height || childRect.height;
      const group = parent
        .append("g")
        .attr(
          "transform",
          `translate(${slot.x - childWidth / 2}, ${slot.y - childHeight / 2})`,
        );

      child.render(group.node(), {
        width: childWidth,
        height: childHeight,
        margin: child.bbox.getMargin(),
      });
    });
  }
}

export function repeat(domain, func, options = {}) {
  return new DirectionlessRepeat(domain, func, options);
}

export function embed(container, repeated, mapping = {}) {
  if (!(repeated instanceof DirectionlessRepeat)) {
    throw new TypeError("embed() expects a repeat() result.");
  }

  if (!container || typeof container.slots !== "function") {
    throw new TypeError("embed() expects a container with slots().");
  }

  return new Embedded(container, repeated, mapping);
}

export class RepeatX extends Repeat {
  constructor(domain, func, options = {}) {
    super(domain, func, options);
    this.classTag = "repeatX";
  }

  render(container, renderOptions = {}) {
    if (!isSvgContainer(container)) {
      return LayoutEngine.layout(this, container, renderOptions);
    }

    if (!this.domain || this.domain.length === 0) {
      if (container.innerHTML !== undefined) container.innerHTML = "";
      return;
    }

    const { width = 400, height = 300 } = renderOptions;
    if (container.innerHTML !== undefined) container.innerHTML = "";
    const gParent = d3.select(container);

    const xScale = d3
      .scaleBand()
      .domain(this.domain)
      .range([0, width])
      .paddingInner(this.paddingInner)
      .paddingOuter(this.paddingOuter);

    const bandwidth = xScale.bandwidth();

    const children = this.instantiateChildren("repeatX");

    this.domain.forEach((value, index) => {
      const node = children[index];
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
    if (!isSvgContainer(container)) {
      return LayoutEngine.layout(this, container, renderOptions);
    }

    if (!this.domain || this.domain.length === 0) {
      if (container.innerHTML !== undefined) container.innerHTML = "";
      return;
    }

    const { width = 400, height = 300 } = renderOptions;
    if (container.innerHTML !== undefined) container.innerHTML = "";
    const gParent = d3.select(container);

    const yScale = d3
      .scaleBand()
      .domain(this.domain)
      .range([0, height])
      .paddingInner(this.paddingInner)
      .paddingOuter(this.paddingOuter);

    const bandwidth = yScale.bandwidth();

    const children = this.instantiateChildren("repeatY");

    this.domain.forEach((value, index) => {
      const node = children[index];
      const g = gParent
        .append("g")
        .attr("transform", `translate(0, ${yScale(value)})`);

      node.render(g.node(), { width, height: bandwidth });
    });
  }
}
