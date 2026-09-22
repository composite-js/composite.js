import { BBox } from "../utils/bbox.js";
import { createSvgElement, isHtmlContainer } from "../utils/dom.js";

const ZERO_MARGIN = { top: 0, right: 0, bottom: 0, left: 0 };
const layoutParents = new WeakMap();
const NODE_KIND = Symbol("layoutNodeKind");

export const NodeKind = Object.freeze({
  LEAF: "leaf",
  CHART: "chart",
  STACK: "stack",
  REPEAT_X: "repeatX",
  REPEAT_Y: "repeatY",
  WRAPPER: "wrapper",
  EMBED: "embed",
  COMPOSITION: "composition",
});

/** @internal */
export function setNodeKind(node, kind) {
  node[NODE_KIND] = kind;
}

function resolvedMargin(element, renderMargin) {
  const configuredMargin = element.margin || element.options?.margin || {};
  return {
    ...ZERO_MARGIN,
    ...configuredMargin,
    ...renderMargin,
  };
}

function intrinsicSize(element, dimension, fallback) {
  return element.options?.[dimension] ?? element[dimension] ?? fallback;
}

function resolveLeafRenderOptions(element, renderOptions) {
  return {
    ...renderOptions,
    width:
      renderOptions.width !== undefined
        ? renderOptions.width
        : intrinsicSize(element, "width", 400),
    height:
      renderOptions.height !== undefined
        ? renderOptions.height
        : intrinsicSize(element, "height", 300),
    margin: resolvedMargin(element, renderOptions.margin),
  };
}

function createRootSvg(container, width, height, margin) {
  const document = container?.ownerDocument || globalThis.document;
  if (!document || typeof document.createElementNS !== "function") {
    throw new TypeError(
      "A layout node requires an HTML or SVG container with an owner document.",
    );
  }

  if (container.innerHTML !== undefined) container.innerHTML = "";

  const svg = createSvgElement(document);
  svg.setAttribute("width", width + margin.left + margin.right);
  svg.setAttribute("height", height + margin.top + margin.bottom);
  container.appendChild(svg);
  return svg;
}

/**
 * Base class for layout nodes.
 */
export class Node {
  constructor() {
    this.bbox = new BBox(0, 0, 0, 0);
    setNodeKind(this, NodeKind.LEAF);
  }

  static isKind(node, kind) {
    return isLayoutNode(node) && node[NODE_KIND] === kind;
  }

  static isChart(node) {
    return Node.isKind(node, NodeKind.CHART);
  }

  static isRepeat(node) {
    return (
      Node.isKind(node, NodeKind.REPEAT_X) ||
      Node.isKind(node, NodeKind.REPEAT_Y)
    );
  }

  static isRepeatX(node) {
    return Node.isKind(node, NodeKind.REPEAT_X);
  }

  static isRepeatY(node) {
    return Node.isKind(node, NodeKind.REPEAT_Y);
  }

  static isStack(node) {
    return Node.isKind(node, NodeKind.STACK);
  }

  static isWrapper(node) {
    return Node.isKind(node, NodeKind.WRAPPER);
  }

  static isEmbedded(node) {
    return Node.isKind(node, NodeKind.EMBED);
  }

  /**
   * Renders a leaf layout node.
   * @param {HTMLElement|SVGElement} container
   * @param {Object} renderOptions
   */
  render(container, renderOptions = {}) {
    if (!this.element) return;

    const resolvedOptions = resolveLeafRenderOptions(
      this.element,
      renderOptions,
    );

    if (isHtmlContainer(container)) {
      const { width, height, margin } = resolvedOptions;
      const svg = createRootSvg(container, width, height, margin);

      return this.element.render(svg, resolvedOptions);
    }

    return this.element.render(container, resolvedOptions);
  }
}

export function isLayoutNode(value) {
  const bbox = value?.bbox;

  return Boolean(
    value &&
    typeof value === "object" &&
    typeof value.render === "function" &&
    bbox &&
    typeof bbox.contentRect === "function" &&
    typeof bbox.getMargin === "function",
  );
}

export function assertLayoutNode(value, label = "node") {
  if (isLayoutNode(value)) return;

  const actual = value?.constructor?.name || typeof value;
  throw new TypeError(
    `${label} must be a layout node created by chart(), custom(), text(), image(), wrapper(), stackX(), stackY(), repeatX(), repeatY(), or embed(); received ${actual}.`,
  );
}

function assertCanAdopt(parent, child, previousChildren) {
  if (parent === child) {
    throw new Error("Layout tree contains a circular reference.");
  }

  for (
    let ancestor = parent;
    ancestor;
    ancestor = layoutParents.get(ancestor)
  ) {
    if (ancestor === child) {
      throw new Error("Layout tree contains a circular reference.");
    }
  }

  const currentParent = layoutParents.get(child);
  const retainedByParent =
    currentParent === parent && previousChildren.has(child);
  if (currentParent && !retainedByParent) {
    if (currentParent === parent) {
      throw new Error(
        "Duplicate layout node: a node cannot appear more than once under the same parent.",
      );
    }
    throw new Error("A layout node cannot have multiple parents.");
  }
}

/**
 * Registers the exclusive parent of each child layout node.
 * @internal
 */
export function replaceLayoutChildren(
  parent,
  previousChildren,
  children,
  label = "children",
) {
  const seen = new Set();
  const previous = new Set(previousChildren);

  children.forEach((child, index) => {
    assertLayoutNode(child, `${label}[${index}]`);
    if (seen.has(child)) {
      throw new Error(
        "Duplicate layout node: a node cannot appear more than once under the same parent.",
      );
    }
    seen.add(child);
    assertCanAdopt(parent, child, previous);
  });

  previousChildren.forEach((child) => {
    if (!seen.has(child) && layoutParents.get(child) === parent) {
      layoutParents.delete(child);
    }
  });
  children.forEach((child) => layoutParents.set(child, parent));
}

/**
 * Checks or records a parent relationship discovered while traversing a tree.
 * @internal
 */
export function assertLayoutParent(parent, child) {
  if (layoutParents.get(child) === parent) return;
  assertCanAdopt(parent, child, new Set());
  if (!layoutParents.has(child)) layoutParents.set(child, parent);
}
