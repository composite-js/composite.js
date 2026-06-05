import * as d3 from "d3";
import { validateContainer } from "../container/base.js";
import { inferXYOrientation } from "../mark/orientation.js";
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

const LINK_SUPPORTED_MARKS = new Set(["bar", "pac", "scatter"]);
const BAND_PADDING_MARKS = new Set([
  "bar",
  "groupbar",
  "stackbar",
  "box",
  "dumbbell",
  "pac",
  "matrix",
]);
const ORIENTATION_INFERRED_BAND_MARKS = new Set([
  "bar",
  "groupbar",
  "stackbar",
  "box",
  "dumbbell",
  "pac",
]);

function isChartNode(node) {
  return node?.classTag === "chart" && node.element?.mark;
}

function stackSharedAxis(direction) {
  return direction === "horizontal" ? "y" : "x";
}

function stackPaddingKeys(direction) {
  return direction === "horizontal"
    ? ["yInner", "yOuter"]
    : ["xInner", "xOuter"];
}

function paddingFallbackKey(key) {
  return key.endsWith("Inner") ? "inner" : "outer";
}

function objectPaddingOption(chart) {
  const padding = chart?.options?.padding;
  if (!padding || typeof padding !== "object" || Array.isArray(padding)) {
    return null;
  }
  return padding;
}

function explicitPaddingValue(chart, key) {
  const padding = objectPaddingOption(chart);
  if (!padding) return undefined;

  if (padding[key] !== undefined) return padding[key];

  const fallback = paddingFallbackKey(key);
  return padding[fallback];
}

function hasExplicitPaddingValue(chart, key) {
  return explicitPaddingValue(chart, key) !== undefined;
}

function sharedAxisField(chart, axis) {
  const mark = chart?.mark;
  const encoding = chart?.encoding || {};

  if (!BAND_PADDING_MARKS.has(mark)) return null;

  if (mark === "matrix") {
    return axis === "x" ? encoding.x : encoding.group;
  }

  if (!ORIENTATION_INFERRED_BAND_MARKS.has(mark)) return null;

  try {
    const orientation = inferXYOrientation(mark, chart.data, encoding);
    if (orientation.categoryChannel !== axis) return null;
    return orientation.categoryField;
  } catch {
    return null;
  }
}

function uniqueExplicitPaddingValue(entries, key) {
  const values = entries
    .map(({ chart }) => explicitPaddingValue(chart, key))
    .filter((value) => value !== undefined);

  if (values.length === 0) return undefined;
  if (
    !values.every(
      (value) => typeof value === "number" && Number.isFinite(value),
    )
  ) {
    return undefined;
  }

  const [first] = values;
  return values.every((value) => Object.is(value, first)) ? first : undefined;
}

function applyInferredPadding(chart, key, value) {
  if (value === undefined || hasExplicitPaddingValue(chart, key)) return;

  if (chart.padding && typeof chart.padding === "object") {
    chart.padding[key] = value;
  }

  if (chart.renderer?.padding && typeof chart.renderer.padding === "object") {
    chart.renderer.padding[key] = value;
  }
}

function inferStackPadding(nodes, direction) {
  const axis = stackSharedAxis(direction);
  const paddingKeys = stackPaddingKeys(direction);
  const entriesByField = new Map();

  nodes.forEach((node) => {
    if (!isChartNode(node)) return;

    const chart = node.element;
    const field = sharedAxisField(chart, axis);
    if (!field) return;

    const entries = entriesByField.get(field) || [];
    entries.push({ chart });
    entriesByField.set(field, entries);
  });

  entriesByField.forEach((entries) => {
    if (entries.length < 2) return;

    paddingKeys.forEach((key) => {
      const value = uniqueExplicitPaddingValue(entries, key);
      entries.forEach(({ chart }) => {
        applyInferredPadding(chart, key, value);
      });
    });
  });
}

function validateStackLink(nodes, direction) {
  if (nodes.length !== 2) {
    throw new RangeError("stack link requires exactly two direct chart nodes.");
  }

  nodes.forEach((node, index) => {
    if (!isChartNode(node)) {
      throw new TypeError(
        `stack link child ${index} must be a direct chart node created by chart().`,
      );
    }

    if (!LINK_SUPPORTED_MARKS.has(node.element.mark)) {
      throw new Error(
        `mark "${node.element.mark}" does not support stack links.`,
      );
    }
  });

  const channel = direction === "horizontal" ? "y" : "x";
  const [first, second] = nodes;
  if (
    first.element.encoding?.[channel] !== second.element.encoding?.[channel]
  ) {
    throw new Error(
      `stack link requires both charts to use the same encoding.${channel} field.`,
    );
  }
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
    this.link = options.link === true;

    if (options.link !== undefined && typeof options.link !== "boolean") {
      throw new TypeError("stack link option must be a boolean.");
    }

    if (this.link) {
      validateStackLink(nodes, direction);
    }

    inferStackPadding(nodes, direction);

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
    validateContainer(container);
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

  render(container, renderOptions = {}) {
    if (!isSvgContainer(container)) {
      return LayoutEngine.layout(this, container, renderOptions);
    }

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

    if (typeof this.container.render === "function") {
      this.container.render(container, { width, height, margin });
    }

    const parent = d3.select(container);
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

  validateContainer(container, "embed() container");

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
