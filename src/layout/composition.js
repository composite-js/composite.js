import { validateContainer, valueOf } from "../container/base.js";
import { inferXYOrientation } from "../chart/orientation.js";
import { normalizePadding } from "../chart/padding.js";
import { getChartTypeDefinition } from "../chart/registry.js";
import { isSvgContainer } from "../utils/dom.js";
import { LayoutEngine } from "./engine.js";
import {
  Node,
  NodeKind,
  assertLayoutNode,
  copyOptions,
  setNodeKind,
} from "./node.js";
import { contentSizedPolicy, viewportSizedPolicy } from "./size-policy.js";

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

function internDomainValue(value) {
  return value !== null && typeof value === "object" ? value.valueOf() : value;
}

function assertUniqueRepeatDomain(domain) {
  const indexesByValue = new Map();

  domain.forEach((value, index) => {
    const interned = internDomainValue(value);
    if (indexesByValue.has(interned)) {
      const firstIndex = indexesByValue.get(interned);
      throw new RangeError(
        `repeat domain values must be unique; indices ${firstIndex} and ${index} resolve to the same value ${String(value)}.`,
      );
    }
    indexesByValue.set(interned, index);
  });
}

function renderComposition(node, container, renderOptions) {
  node.sizePolicy.validateRenderOptions(node, renderOptions);
  return isSvgContainer(container)
    ? LayoutEngine.renderInto(node, container, renderOptions)
    : LayoutEngine.layout(node, container, renderOptions);
}

export function embedChildMap(repeated, mapping, children) {
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

export function matchEmbedSlots(slots, childrenByKey) {
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

function isChartNode(node) {
  return Node.isChart(node) && node.element?.mark;
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
  const bandChannel = getChartTypeDefinition(mark)?.bandChannel;

  if (!bandChannel) return null;

  if (bandChannel.type !== "orientationCategory") {
    const channel = bandChannel[axis];
    return channel ? encoding[channel] : null;
  }

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
}

export function inferStackPadding(nodes, direction) {
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
  nodes = nodes.map((node) => {
    while (Node.isAnchor(node)) node = node.child;
    return node;
  });
  if (nodes.length !== 2) {
    throw new RangeError("stack link requires exactly two direct chart nodes.");
  }

  nodes.forEach((node, index) => {
    if (!isChartNode(node)) {
      throw new TypeError(
        `stack link child ${index} must be a direct chart node created by chart().`,
      );
    }

    if (!getChartTypeDefinition(node.element.mark)?.supportsLink) {
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
    setNodeKind(this, NodeKind.COMPOSITION);
    this.classTag = "composition";
  }
}

/**
 * Stack composition class.
 */
export class Stack extends Composition {
  constructor(nodes, direction, options = {}) {
    super();
    setNodeKind(this, NodeKind.STACK);
    assertNodeArray(nodes, "nodes");

    this.children = Object.freeze([...nodes]);
    this.direction = direction;
    this.isStack = true;
    this.type = "stack";
    this.classTag = direction === "horizontal" ? "stackX" : "stackY";
    this.margin = normalizeStackMargin(options.margin, nodes.length);
    this.align = Object.freeze([...(options.align || [])]);
    this.link = options.link === true;
    this.sizePolicy = contentSizedPolicy;
    this.sizePolicy.validateOptions(this, options);

    if (options.link !== undefined && typeof options.link !== "boolean") {
      throw new TypeError("stack link option must be a boolean.");
    }

    if (this.link) {
      validateStackLink(nodes, direction);
    }

    for (let i = 0; i < nodes.length; i++) {
      const alignedNode =
        this.align[i] !== undefined && this.align[i] !== null
          ? this.align[i]
          : nodes[i];

      if (
        alignedNode !== null &&
        alignedNode !== undefined &&
        typeof alignedNode !== "string"
      ) {
        assertLayoutNode(alignedNode, `align[${i}]`);
      }
    }

    this.margin = copyOptions(this.margin);
    Object.freeze(this);
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
    const normalizedDomain = [...(domain || [])];
    assertUniqueRepeatDomain(normalizedDomain);
    this.isRepeat = true;
    this.type = "repeat";
    this.domain = Object.freeze(normalizedDomain);
    this.func = func;
    this.paddingInner =
      options.paddingInner !== undefined ? options.paddingInner : 0.1;
    this.paddingOuter =
      options.paddingOuter !== undefined ? options.paddingOuter : 0.1;
    this.width = options.width;
    this.height = options.height;
    this.shareDomains =
      options.shareDomains !== undefined ? options.shareDomains : true;
    this.sizePolicy = viewportSizedPolicy;

    this.options = {
      width: this.width,
      height: this.height,
      paddingInner: this.paddingInner,
      paddingOuter: this.paddingOuter,
      shareDomains: this.shareDomains,
      margin: options.margin || { top: 0, right: 0, bottom: 0, left: 0 },
    };
  }
}

export class DirectionlessRepeat {
  constructor(domain, func, options = {}) {
    this.domain = Object.freeze([...(domain || [])]);
    this.func = func;
    this.options = copyOptions(options);
    this.shareDomains =
      options.shareDomains !== undefined ? options.shareDomains : true;
    this.type = "repeat";
    Object.freeze(this);
  }
}

export class Embedded extends Composition {
  constructor(container, repeated, mapping = {}) {
    super();
    setNodeKind(this, NodeKind.EMBED);
    validateContainer(container);
    this.container = container;
    this.repeated = repeated;
    this.mapping = mapping;
    this.classTag = "embed";
    this.type = "embed";
    this.sizePolicy = viewportSizedPolicy;
    this.options = {
      width: container.width,
      height: container.height,
      margin: container.margin || { top: 0, right: 0, bottom: 0, left: 0 },
    };
    this.options = copyOptions(this.options);
    this.mapping = copyOptions(mapping);
    Object.freeze(this);
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
    setNodeKind(this, NodeKind.REPEAT_X);
    this.classTag = "repeatX";
    this.options = copyOptions(this.options);
    Object.freeze(this);
  }

  render(container, renderOptions = {}) {
    return renderComposition(this, container, renderOptions);
  }
}

export class RepeatY extends Repeat {
  constructor(domain, func, options = {}) {
    super(domain, func, options);
    setNodeKind(this, NodeKind.REPEAT_Y);
    this.classTag = "repeatY";
    this.options = copyOptions(this.options);
    Object.freeze(this);
  }

  render(container, renderOptions = {}) {
    return renderComposition(this, container, renderOptions);
  }
}
