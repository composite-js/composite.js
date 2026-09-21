import * as d3 from "d3";
import { BBox } from "../utils/bbox.js";
import { LayoutCalculator } from "./calculator.js";
import { renderComputedLayout, renderComputedLayoutInto } from "./renderer.js";
import { Node, assertLayoutNode, assertLayoutParent } from "./node.js";

function isEmbeddedNode(node) {
  return node?.type === "embed";
}

function isWrapperNode(node) {
  return node?.type === "wrapper";
}

function isRepeatXNode(node) {
  return node?.classTag === "repeatX";
}

function stackGapBefore(node, childIndex) {
  if (childIndex <= 0) return 0;
  if (Array.isArray(node.margin)) return node.margin[childIndex - 1];
  return typeof node.margin === "number" ? node.margin : 0;
}

function repeatIntrinsicRange(node, cellSize) {
  if (node.domain.length === 0 || cellSize === 0) return 0;

  const scale = d3
    .scaleBand()
    .domain(node.domain)
    .range([0, 1])
    .paddingInner(node.paddingInner)
    .paddingOuter(node.paddingOuter);
  const unitBandwidth = scale.bandwidth();
  return unitBandwidth > 0 ? cellSize / unitBandwidth : cellSize;
}

/**
 * Layout engine for computing and rendering layout trees.
 */
export class LayoutEngine {
  static containsNode(container, target) {
    if (container === target) return true;
    if (!Node.isStack(container)) return false;
    return container.children.some((child) => this.containsNode(child, target));
  }

  static findTargetRectWithin(container, target) {
    if (container === target) {
      return { ...container.bbox.contentRect() };
    }

    if (!Node.isStack(container)) return null;

    const search = (node, offsetX = 0, offsetY = 0) => {
      const rect = node.bbox.contentRect();

      if (node === target) {
        return {
          x: offsetX + rect.x,
          y: offsetY + rect.y,
          width: rect.width,
          height: rect.height,
        };
      }

      if (!Node.isStack(node)) return null;

      for (const child of node.children) {
        const found = search(child, offsetX + rect.x, offsetY + rect.y);
        if (found) return found;
      }

      return null;
    };

    for (const child of container.children) {
      const found = search(child);
      if (found) return found;
    }

    return null;
  }

  static alignmentTargetForChild(child, alignedNode) {
    return this.containsNode(child, alignedNode) ? alignedNode : child;
  }

  static findReferenceAlignment(node) {
    for (const alignedNode of node.align) {
      if (!alignedNode) continue;

      for (const child of node.children) {
        if (!this.containsNode(child, alignedNode)) continue;

        const rect = this.findTargetRectWithin(child, alignedNode);
        if (rect) return rect;
      }
    }

    return { ...node.children[0].bbox.contentRect() };
  }

  static validateLayoutTree(
    node,
    parent = null,
    state = { active: new Set(), visitedParents: new Map() },
  ) {
    assertLayoutNode(node);

    if (state.active.has(node)) {
      throw new Error("Layout tree contains a circular reference.");
    }
    if (state.visitedParents.has(node)) {
      const firstParent = state.visitedParents.get(node);
      if (firstParent === parent) {
        throw new Error(
          "Duplicate layout node: a node cannot appear more than once under the same parent.",
        );
      }
      throw new Error("A layout node cannot have multiple parents.");
    }
    if (parent) assertLayoutParent(parent, node);

    state.active.add(node);
    state.visitedParents.set(node, parent);

    try {
      let children = [];
      if (Node.isStack(node)) {
        if (node.children.length === 0) {
          throw new Error("Invalid: composition node has no children.");
        }
        children = node.children;
      } else if (Node.isRepeat(node)) {
        children = node.instantiateChildren(node.classTag);
      } else if (isEmbeddedNode(node)) {
        children = node.instantiateChildren();
      } else if (isWrapperNode(node)) {
        children = [node.child];
      }

      children.forEach((child) => this.validateLayoutTree(child, node, state));
    } finally {
      state.active.delete(node);
    }
  }

  static computeLayout(node, context = {}, renderSize = {}) {
    this.validateLayoutTree(node);
    this.computeLayoutNode(node, context, renderSize);
  }

  static computeLayoutNode(node, context, renderSize = {}) {
    if (Node.isStack(node)) {
      node.children.forEach((child) => {
        this.computeLayoutNode(child, context);
      });

      if (node.direction === "horizontal") {
        this.computeHorizontalStack(node);
      } else if (node.direction === "vertical") {
        this.computeVerticalStack(node);
      } else {
        throw new Error(`Unknown stacking direction: ${node.direction}`);
      }
      return;
    }

    if (Node.isRepeat(node)) {
      this.computeRepeat(node, context, renderSize);
      return;
    }

    if (isEmbeddedNode(node)) {
      this.computeEmbedded(node, context, renderSize);
      return;
    }

    if (isWrapperNode(node)) {
      this.computeWrapper(node, context);
      return;
    }

    this.computeLeaf(node, context);
  }

  static computeHorizontalStack(node) {
    const referenceRect = this.findReferenceAlignment(node);
    const sharedY = referenceRect.y;
    const sharedHeight = referenceRect.height;

    let currentX = 0;
    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];
      const bbox = child.bbox;
      const margin = bbox.getMargin();
      const target = this.alignmentTargetForChild(child, node.alignedNodes[i]);
      const targetRect = this.findTargetRectWithin(child, target);

      currentX += stackGapBefore(node, i);
      currentX += margin.left;
      bbox.translateTo(currentX, sharedY - targetRect.y);
      if (target === child) {
        bbox.setSize(-1, sharedHeight);
      }
      currentX += bbox.contentRect().width + margin.right;
    }

    node.updateBBox();
  }

  static computeVerticalStack(node) {
    const referenceRect = this.findReferenceAlignment(node);
    const sharedX = referenceRect.x;
    const sharedWidth = referenceRect.width;

    let currentY = 0;
    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];
      const bbox = child.bbox;
      const margin = bbox.getMargin();
      const target = this.alignmentTargetForChild(child, node.alignedNodes[i]);
      const targetRect = this.findTargetRectWithin(child, target);

      currentY += stackGapBefore(node, i);
      currentY += margin.top;
      bbox.translateTo(sharedX - targetRect.x, currentY);
      if (target === child) {
        bbox.setSize(sharedWidth, -1);
      }
      currentY += bbox.contentRect().height + margin.bottom;
    }

    node.updateBBox();
  }

  static computeRepeat(node, context = {}, renderSize = {}) {
    const children = node.children;
    children.forEach((child) => this.computeLayoutNode(child, context));

    const fallback = LayoutCalculator.suggestWidthHeight(node);
    const maxChildWidth = children.length
      ? Math.max(...children.map((child) => child.bbox.totalWidth()))
      : 0;
    const maxChildHeight = children.length
      ? Math.max(...children.map((child) => child.bbox.totalHeight()))
      : 0;
    const intrinsicSize = !children.length
      ? fallback
      : isRepeatXNode(node)
        ? {
            width: repeatIntrinsicRange(node, maxChildWidth),
            height: maxChildHeight,
          }
        : {
            width: maxChildWidth,
            height: repeatIntrinsicRange(node, maxChildHeight),
          };
    const { width, height } = node.sizePolicy.resolve(
      node,
      renderSize,
      intrinsicSize,
    );

    const bbox = new BBox(0, 0, width, height);
    bbox.setMargin(node.options.margin);
    node.bbox = bbox;
  }

  static computeEmbedded(node, context = {}, renderSize = {}) {
    node.embeddedChildren.forEach((child) => {
      this.computeLayoutNode(child, context);
    });

    const { width, height } = node.sizePolicy.resolve(node, renderSize, {
      width: node.container.width,
      height: node.container.height,
    });
    const bbox = new BBox(0, 0, width, height);
    bbox.setMargin(
      node.container.margin || { top: 0, right: 0, bottom: 0, left: 0 },
    );
    node.bbox = bbox;
  }

  static computeWrapper(node, context = {}) {
    this.computeLayoutNode(node.child, context);
    node.updateBBoxFromChild();
  }

  static computeLeaf(node, context = {}) {
    const element = node.element;
    if (!element) {
      throw new Error("Invalid layout node: missing renderable element.");
    }

    const margin = LayoutCalculator.estimateMargin(element, context);
    let width = element.options?.width ?? element.width;
    let height = element.options?.height ?? element.height;

    if (width === undefined || height === undefined) {
      const suggested = LayoutCalculator.suggestWidthHeight(element);
      if (width === undefined) width = suggested.width;
      if (height === undefined) height = suggested.height;
    }

    const bbox = new BBox(0, 0, width, height);
    bbox.setMargin(margin);
    node.bbox = bbox;
  }

  static layout(root, container, options = {}) {
    root.sizePolicy?.validateRenderOptions(root, options);
    this.computeLayout(root, { document: container?.ownerDocument }, options);
    return renderComputedLayout(root, container, options);
  }

  static renderInto(root, container, options = {}) {
    root.sizePolicy?.validateRenderOptions(root, options);
    this.computeLayout(root, { document: container?.ownerDocument }, options);
    return renderComputedLayoutInto(root, container, options);
  }
}
