import { BBox } from "../utils/bbox.js";
import { LayoutCalculator } from "./calculator.js";
import { renderComputedLayout } from "./renderer.js";
import { Node, assertLayoutNode } from "./node.js";

function isEmbeddedNode(node) {
  return node?.type === "embed";
}

function isFrameNode(node) {
  return node?.type === "frame";
}

function isRepeatXNode(node) {
  return node?.classTag === "repeatX";
}

function isRepeatYNode(node) {
  return node?.classTag === "repeatY";
}

function stackGapBefore(node, childIndex) {
  if (childIndex <= 0) return 0;
  if (Array.isArray(node.margin)) return node.margin[childIndex - 1];
  return typeof node.margin === "number" ? node.margin : 0;
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

  static findNodeLayout(computedNode, targetNode) {
    if (computedNode.node === targetNode) {
      if (targetNode.bbox instanceof BBox) {
        return {
          x: targetNode.bbox.content.x,
          y: targetNode.bbox.content.y,
          width: targetNode.bbox.content.width,
          height: targetNode.bbox.content.height,
        };
      }
      throw new Error("Invalid layout tree: targetNode.bbox must be a BBox");
    }

    if (computedNode.children) {
      for (const child of computedNode.children) {
        const res = this.findNodeLayout(child, targetNode);
        if (res) {
          return {
            x: (child.x || 0) + res.x,
            y: (child.y || 0) + res.y,
            width: res.width,
            height: res.height,
          };
        }
      }
    }

    return null;
  }

  static traverseTree(node, callback) {
    callback(node);
    if (Node.isStack(node)) {
      node.children.forEach((child) => {
        this.traverseTree(child, callback);
      });
    }
  }

  static computeLayout(node) {
    assertLayoutNode(node);

    if (Node.isStack(node)) {
      if (node.children.length === 0) {
        throw new Error("Invalid: composition node has no children.");
      }

      node.children.forEach((child) => {
        this.computeLayout(child);
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
      this.computeRepeat(node);
      return;
    }

    if (isEmbeddedNode(node)) {
      this.computeEmbedded(node);
      return;
    }

    if (isFrameNode(node)) {
      this.computeFrame(node);
      return;
    }

    this.computeLeaf(node);
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

  static computeRepeat(node) {
    const hasExplicitWidth = node.options.width !== undefined;
    const hasExplicitHeight = node.options.height !== undefined;
    let width = node.options.width;
    let height = node.options.height;

    if (!hasExplicitWidth || !hasExplicitHeight) {
      const suggested = LayoutCalculator.suggestWidthHeight(node);
      if (!hasExplicitWidth) width = suggested.width;
      if (!hasExplicitHeight) height = suggested.height;
    }

    if (
      node.domain.length > 0 &&
      ((isRepeatXNode(node) && !hasExplicitHeight) ||
        (isRepeatYNode(node) && !hasExplicitWidth))
    ) {
      const sampleChild = node.func(node.domain[0], 0);
      assertLayoutNode(sampleChild, "repeat sample child");
      this.computeLayout(sampleChild);

      if (isRepeatXNode(node) && !hasExplicitHeight) {
        height = sampleChild.bbox.totalHeight();
      }

      if (isRepeatYNode(node) && !hasExplicitWidth) {
        width = sampleChild.bbox.totalWidth();
      }
    }

    const bbox = new BBox(0, 0, width, height);
    bbox.setMargin(node.options.margin);
    node.bbox = bbox;
  }

  static computeEmbedded(node) {
    node.instantiateChildren().forEach((child) => {
      this.computeLayout(child);
    });

    const bbox = new BBox(0, 0, node.container.width, node.container.height);
    bbox.setMargin(
      node.container.margin || { top: 0, right: 0, bottom: 0, left: 0 },
    );
    node.bbox = bbox;
  }

  static computeFrame(node) {
    this.computeLayout(node.child);
    node.updateBBoxFromChild();
  }

  static computeLeaf(node) {
    const element = node.element;
    if (!element) {
      throw new Error("Invalid layout node: missing renderable element.");
    }

    const margin = LayoutCalculator.estimateMargin(element);
    let width = element.options.width;
    let height = element.options.height;

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
    this.computeLayout(root);
    return renderComputedLayout(root, container, options);
  }
}
