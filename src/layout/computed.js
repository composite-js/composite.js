import { GridContainer } from "../container/grid.js";
import { SequenceContainer } from "../container/sequence.js";
import { Chart } from "../chart/chart.js";
import { ImageElement } from "./image.js";
import { TextElement } from "./text.js";
import { Node, assertLayoutNode, copyOptions } from "./node.js";
import { applySharedChartDomains } from "./shared-domain.js";
import { inferStackPadding } from "./composition.js";

/** Expand each use separately; only the current ancestry detects cycles. */
export function expandLayout(spec, occurrenceId = "0", active = new Set()) {
  assertLayoutNode(spec);
  if (active.has(spec))
    throw new Error("Layout tree contains a circular reference.");
  active.add(spec);
  try {
    if (Node.isAnchor(spec)) {
      const node = expandLayout(spec.child, occurrenceId, active);
      node.spec = spec;
      node.sources.push(spec);
      node.anchors.push(spec.name);
      return node;
    }
    const node = {
      ...spec,
      spec,
      occurrenceId,
      sources: [spec],
      anchors: [],
      children: [],
      viewport: null,
    };
    let children = [];
    if (Node.isStack(spec) || Node.isOverlay(spec)) {
      if (!spec.children.length)
        throw new Error("Invalid: composition node has no children.");
      children = spec.children;
    } else if (Node.isWrapper(spec)) {
      children = [spec.child];
    } else if (Node.isRepeat(spec) || Node.isEmbedded(spec)) {
      const repeated = Node.isEmbedded(spec) ? spec.repeated : spec;
      children = repeated.domain.map((value, index) => {
        const child = repeated.func(value, index);
        assertLayoutNode(
          child,
          `${Node.isEmbedded(spec) ? "repeat" : spec.classTag} child ${index}`,
        );
        return child;
      });
    } else if (Node.isChart(spec) || spec.element instanceof Chart) {
      node.element = new Chart(copyOptions(spec.element.options));
    } else if (spec.element instanceof TextElement) {
      node.element = new TextElement(copyOptions(spec.element.options));
    } else if (spec.element instanceof ImageElement) {
      node.element = new ImageElement(copyOptions(spec.element.options));
    } else if (spec.createElement) {
      node.element = spec.createElement();
      if (!node.element || typeof node.element.render !== "function") {
        throw new TypeError(
          "custom factory must return an object with a render method.",
        );
      }
    }
    node.children = children.map((child, index) =>
      expandLayout(child, `${occurrenceId}/${index}`, active),
    );
    if (Node.isWrapper(node)) node.child = node.children[0];
    if (Node.isRepeat(node) && node.shareDomains)
      applySharedChartDomains(node.children);
    if (Node.isEmbedded(node)) {
      if (
        spec.container instanceof GridContainer ||
        spec.container instanceof SequenceContainer
      ) {
        node.container = Object.assign(
          Object.create(Object.getPrototypeOf(spec.container)),
          Object.fromEntries(
            Object.entries(spec.container).map(([key, value]) => [
              key,
              copyOptions(value, key),
            ]),
          ),
        );
        Object.freeze(node.container);
      }
      node.embeddedChildren = node.children;
      if (node.repeated.shareDomains) applySharedChartDomains(node.children);
    }
    if (Node.isStack(node)) {
      inferStackPadding(node.children, node.direction);
      node.alignedNodes = node.children.map((child, index) =>
        resolveAlignment(child, node.align[index], index),
      );
    }
    return node;
  } finally {
    active.delete(spec);
  }
}

function resolveAlignment(root, target, index) {
  if (target === undefined || target === null) return root;
  const matches = [];
  const visit = (node) => {
    const matchesTarget =
      typeof target === "string"
        ? node.anchors.includes(target)
        : node.sources.includes(target);
    if (matchesTarget) matches.push(node);
    node.children.forEach(visit);
  };
  visit(root);
  if (matches.length > 1) {
    throw new Error(
      `align[${index}] is ambiguous; use a uniquely named anchor() within this child.`,
    );
  }
  if (!matches.length && typeof target === "string") {
    throw new Error(
      `align[${index}] anchor "${target}" was not found within this child.`,
    );
  }
  // Preserve the existing fallback for references outside the child subtree.
  return matches[0] || root;
}

/** Seal owned results, never freezing caller-owned data or extension objects. */
export function finishLayout(node) {
  node.children.forEach(finishLayout);
  // Unmatched embed children are measured but do not participate in rendering.
  node.embeddedChildren
    ?.filter((child) => !node.children.includes(child))
    .forEach(finishLayout);
  for (const key of [
    "children",
    "embeddedChildren",
    "sources",
    "anchors",
    "alignedNodes",
  ]) {
    if (node[key]) Object.freeze(node[key]);
  }
  Object.freeze(node.bbox.content);
  Object.freeze(node.bbox.margin);
  Object.freeze(node.bbox);
  if (node.viewport) Object.freeze(node.viewport);
  if (
    node.element instanceof Chart ||
    node.element instanceof TextElement ||
    node.element instanceof ImageElement
  ) {
    for (const key of ["options", "encoding", "padding", "margin"]) {
      if (node.element[key]) node.element[key] = copyOptions(node.element[key]);
    }
    Object.freeze(node.element);
  }
  if (node.createElement) {
    // Discard the measurement instance; rendering always uses the factory.
    node.element = Object.freeze({
      options: copyOptions(node.element.options || {}),
      width: node.bbox.contentRect().width,
      height: node.bbox.contentRect().height,
    });
  }
  delete node.arrangedSignature;
  return Object.freeze(node);
}

export function assertComputedLayout(node) {
  if (!node?.occurrenceId || !node.bbox || !Object.isFrozen(node)) {
    throw new TypeError(
      "renderComputedLayout requires a result returned by computeLayout().",
    );
  }
}
