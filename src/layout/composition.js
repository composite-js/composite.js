import { validateContainer, valueOf } from "../container/base.js";
import { inferXYOrientation } from "../mark/orientation.js";
import { normalizePadding } from "../mark/padding.js";
import { BBox } from "../utils/bbox.js";
import { isSvgContainer } from "../utils/dom.js";
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

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function renderComposition(node, container, renderOptions) {
  return isSvgContainer(container)
    ? LayoutEngine.renderInto(node, container, renderOptions)
    : LayoutEngine.layout(node, container, renderOptions);
}

function embedChildMap(repeated, mapping, children) {
  const childrenByKey = new Map();

  repeated.domain.forEach((datum, index) => {
    const key =
      mapping.key !== undefined ? valueOf(mapping.key, datum, index) : index;

    if (childrenByKey.has(key)) {
      throw new Error(`embed child key "${String(key)}" is duplicated.`);
    }

    childrenByKey.set(key, children[index]);
  });

  return childrenByKey;
}

function assertSlotNumber(slot, index, field, options = {}) {
  const value = slot[field];
  if (!isFiniteNumber(value)) {
    throw new TypeError(
      `embed slot ${index}.${field} must be a finite number.`,
    );
  }

  if (options.nonNegative && value < 0) {
    throw new RangeError(`embed slot ${index}.${field} must not be negative.`);
  }
}

function matchEmbedSlots(slots, childrenByKey) {
  if (!Array.isArray(slots)) {
    throw new TypeError("embed container slots() must return an array.");
  }

  const seenKeys = new Set();
  return slots.map((slot, index) => {
    if (!slot || typeof slot !== "object" || Array.isArray(slot)) {
      throw new TypeError(`embed slot ${index} must be an object.`);
    }

    if (!Object.prototype.hasOwnProperty.call(slot, "key")) {
      throw new TypeError(`embed slot ${index} must provide a key.`);
    }

    if (seenKeys.has(slot.key)) {
      throw new Error(`embed slot key "${String(slot.key)}" is duplicated.`);
    }
    seenKeys.add(slot.key);

    assertSlotNumber(slot, index, "x");
    assertSlotNumber(slot, index, "y");
    if (slot.width !== undefined) {
      assertSlotNumber(slot, index, "width", { nonNegative: true });
    }
    if (slot.height !== undefined) {
      assertSlotNumber(slot, index, "height", { nonNegative: true });
    }

    if (!childrenByKey.has(slot.key)) {
      throw new Error(
        `embed slot ${index} has unknown key "${String(slot.key)}".`,
      );
    }

    return { slot, child: childrenByKey.get(slot.key) };
  });
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

function normalizedPaddingOption(chart) {
  const padding = chart?.options?.padding;
  if (
    typeof padding !== "number" &&
    (!padding || typeof padding !== "object" || Array.isArray(padding))
  ) {
    return null;
  }
  return normalizePadding(padding);
}

function explicitPaddingValue(chart, key) {
  const padding = normalizedPaddingOption(chart);
  if (!padding) return undefined;

  return padding[key];
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

  render(container, renderOptions = {}) {
    return renderComposition(this, container, renderOptions);
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
    this.shareDomains =
      options.shareDomains !== undefined ? options.shareDomains : true;
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

    if (this.repeated.shareDomains) {
      applySharedChartDomains(this.embeddedChildren);
    }

    return this.embeddedChildren;
  }

  resolveSlots(size) {
    const children = this.embeddedChildren.length
      ? this.embeddedChildren
      : this.instantiateChildren();
    const slots = this.container.slots(
      this.repeated.domain,
      this.mapping,
      size,
    );
    const childrenByKey = embedChildMap(this.repeated, this.mapping, children);
    return matchEmbedSlots(slots, childrenByKey);
  }

  render(container, renderOptions = {}) {
    return renderComposition(this, container, renderOptions);
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
    return renderComposition(this, container, renderOptions);
  }
}

export class RepeatY extends Repeat {
  constructor(domain, func, options = {}) {
    super(domain, func, options);
    this.classTag = "repeatY";
  }

  render(container, renderOptions = {}) {
    return renderComposition(this, container, renderOptions);
  }
}
