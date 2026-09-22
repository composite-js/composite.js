let renderLayout;

/** @internal Register the engine without a declaration/engine import cycle. */
export function setLayoutRenderer(render) {
  renderLayout = render;
}

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
  ANCHOR: "anchor",
});

/** @internal */
export function setNodeKind(node, kind) {
  node[NODE_KIND] = kind;
}

/** A reusable layout declaration. Geometry belongs to computed occurrences. */
export class Node {
  constructor() {
    setNodeKind(this, NodeKind.LEAF);
  }
  static isKind(node, kind) {
    return node?.[NODE_KIND] === kind;
  }
  static isChart(node) {
    return Node.isKind(node, NodeKind.CHART);
  }
  static isRepeat(node) {
    return Node.isRepeatX(node) || Node.isRepeatY(node);
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
  static isAnchor(node) {
    return Node.isKind(node, NodeKind.ANCHOR);
  }

  render(container, options = {}) {
    return renderLayout(this, container, options);
  }
}

export function isLayoutNode(value) {
  return Boolean(
    value &&
    typeof value === "object" &&
    value[NODE_KIND] &&
    typeof value.render === "function" &&
    !value.occurrenceId,
  );
}

export function assertLayoutNode(value, label = "node") {
  if (isLayoutNode(value)) return;
  const actual = value?.constructor?.name || typeof value;
  throw new TypeError(
    `${label} must be a layout node created by chart(), custom(), text(), image(), wrapper(), stackX(), stackY(), repeatX(), repeatY(), anchor(), or embed(); received ${actual}.`,
  );
}

/** Copy library-owned configuration, retaining data and extension objects. */
export function copyOptions(value, key = "") {
  if (
    key === "data" ||
    typeof value === "function" ||
    !value ||
    typeof value !== "object"
  )
    return value;
  if (Array.isArray(value))
    return Object.freeze(value.map((item) => copyOptions(item)));
  if (Object.getPrototypeOf(value) !== Object.prototype) return value;
  return Object.freeze(
    Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, copyOptions(v, k)]),
    ),
  );
}

/** Mark one use of a declaration without introducing a layout box. */
export function anchor(name, child) {
  if (typeof name !== "string" || !name.trim())
    throw new TypeError("anchor name must be a non-empty string.");
  assertLayoutNode(child, "anchor child");
  const node = new Node();
  setNodeKind(node, NodeKind.ANCHOR);
  node.name = name;
  node.child = child;
  node.classTag = child.classTag;
  node.sizePolicy = child.sizePolicy;
  return Object.freeze(node);
}
