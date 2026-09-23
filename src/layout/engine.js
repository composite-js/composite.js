import * as d3 from "d3";
import { BBox } from "../utils/bbox.js";
import { LayoutCalculator } from "./calculator.js";
import { renderComputedLayout, renderComputedLayoutInto } from "./renderer.js";
import { Node, assertLayoutNode, setLayoutRenderer } from "./node.js";
import { isSvgContainer } from "../utils/dom.js";
import { expandLayout, finishLayout } from "./computed.js";
import { embedChildMap, matchEmbedSlots } from "./composition.js";
import { resolveRenderSize, viewportSizedPolicy } from "./size-policy.js";

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
  static findTargetRectWithin(container, target) {
    if (container === target) {
      return { ...container.bbox.contentRect() };
    }

    if (!container.children) return null;

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

      if (!node.children) return null;

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

  static findReferenceAlignment(node) {
    for (let i = 0; i < node.align.length; i++) {
      if (node.align[i] === undefined || node.align[i] === null) continue;
      const target = node.alignedNodes[i];
      const reference = node.align[i];
      if (
        !target ||
        !(typeof reference === "string"
          ? target.anchors.includes(reference)
          : target.sources.includes(reference))
      )
        continue;
      return this.findTargetRectWithin(node.children[i], target);
    }
    return { ...node.children[0].bbox.contentRect() };
  }

  static computeLayout(spec, context = {}, renderSize = {}) {
    assertLayoutNode(spec);
    (spec?.sizePolicy || viewportSizedPolicy).validateRenderOptions(
      spec,
      renderSize,
    );
    if (
      context.measurementAdapter &&
      typeof context.measurementAdapter.measureMargin !== "function"
    ) {
      throw new TypeError(
        "measurement adapter must provide measureMargin(element, size).",
      );
    }
    const root = expandLayout(spec);
    this.computeLayoutNode(root, { ...context, root }, renderSize);
    this.arrange(root, renderSize);
    return finishLayout(root);
  }

  static computeLayoutNode(node, context, renderSize = {}) {
    if (Node.isOverlay(node)) {
      node.children.forEach((child) => {
        this.computeLayoutNode(child, context);
      });
      this.computeOverlay(node);
      return;
    }

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
      this.arrange(node);
      return;
    }

    if (Node.isEmbedded(node)) {
      this.computeEmbedded(node, context, renderSize);
      this.arrange(node);
      return;
    }

    if (Node.isWrapper(node)) {
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
      const target = node.alignedNodes[i];
      const targetRect = this.findTargetRectWithin(child, target);

      currentX += stackGapBefore(node, i);
      currentX += margin.left;
      bbox.translateTo(currentX, sharedY - targetRect.y);
      if (target === child) {
        bbox.content.height = sharedHeight;
      }
      currentX += bbox.contentRect().width + margin.right;
    }

    this.updateBBox(node);
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
      const target = node.alignedNodes[i];
      const targetRect = this.findTargetRectWithin(child, target);

      currentY += stackGapBefore(node, i);
      currentY += margin.top;
      bbox.translateTo(sharedX - targetRect.x, currentY);
      if (target === child) {
        bbox.content.width = sharedWidth;
      }
      currentY += bbox.contentRect().height + margin.bottom;
    }

    this.updateBBox(node);
  }

  static computeOverlay(node) {
    const width = Math.max(
      ...node.children.map((child) => child.bbox.contentRect().width),
    );
    const height = Math.max(
      ...node.children.map((child) => child.bbox.contentRect().height),
    );
    const margin = {
      top: Math.max(
        ...node.children.map((child) => child.bbox.getMargin().top),
      ),
      right: Math.max(
        ...node.children.map((child) => child.bbox.getMargin().right),
      ),
      bottom: Math.max(
        ...node.children.map((child) => child.bbox.getMargin().bottom),
      ),
      left: Math.max(
        ...node.children.map((child) => child.bbox.getMargin().left),
      ),
    };

    node.bbox = new BBox(0, 0, width, height);
    node.bbox.setMargin(margin);
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
      : Node.isRepeatX(node)
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
    const child = node.child.bbox;
    node.bbox = new BBox(
      0,
      0,
      child.totalWidth() + node.padding.left + node.padding.right,
      child.totalHeight() + node.padding.top + node.padding.bottom,
    );
    node.bbox.setMargin(node.options.margin);
    this.arrange(node);
  }

  static computeLeaf(node, context = {}) {
    const element = node.element;
    if (!element) {
      throw new Error("Invalid layout node: missing renderable element.");
    }

    let width = element.options?.width ?? element.width;
    let height = element.options?.height ?? element.height;

    if (width === undefined || height === undefined) {
      const suggested = LayoutCalculator.suggestWidthHeight(element);
      if (width === undefined) width = suggested.width;
      if (height === undefined) height = suggested.height;
    }

    const bbox = new BBox(0, 0, width, height);
    const margin =
      context.root === node
        ? {
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            ...(element.margin || element.options?.margin),
            ...node.options?.margin,
          }
        : LayoutCalculator.estimateMargin(element, context);
    bbox.setMargin(margin);
    node.bbox = bbox;
  }

  static updateBBox(node) {
    let combined = node.children[0].bbox;
    for (const child of node.children.slice(1))
      combined = combined.union(child.bbox);
    const content = combined.contentRect();
    node.children.forEach((child) =>
      child.bbox.translateBy(-content.x, -content.y),
    );
    node.bbox = new BBox(0, 0, content.width, content.height);
    node.bbox.setMargin(combined.getMargin());
  }

  /** Assign all final geometry before rendering; no declaration is touched. */
  static arrange(node, requested = {}) {
    node.viewport =
      requested.width !== undefined || requested.height !== undefined
        ? {
            ...(requested.width !== undefined
              ? { width: requested.width }
              : {}),
            ...(requested.height !== undefined
              ? { height: requested.height }
              : {}),
          }
        : null;
    const size = resolveRenderSize(node, requested, node.bbox.contentRect());
    node.bbox.content.width = size.width;
    node.bbox.content.height = size.height;
    if (requested.margin)
      node.bbox.setMargin({ ...node.bbox.getMargin(), ...requested.margin });
    const signature = JSON.stringify([
      size.width,
      size.height,
      node.bbox.getMargin(),
    ]);
    if (node.arrangedSignature === signature) return;
    node.arrangedSignature = signature;
    const { width, height } = node.bbox.contentRect();
    if (Node.isOverlay(node)) {
      node.children.forEach((child) => {
        this.arrange(child, { width, height });
        child.bbox.setSize(width, height);
        child.bbox.translateTo(0, 0);
      });
    } else if (Node.isStack(node)) {
      node.children.forEach((child) => this.arrange(child));
    } else if (Node.isWrapper(node)) {
      const child = node.child;
      const margin = child.bbox.getMargin();
      this.arrange(child, {
        width: Math.max(
          0,
          width -
            node.padding.left -
            node.padding.right -
            margin.left -
            margin.right,
        ),
        height: Math.max(
          0,
          height -
            node.padding.top -
            node.padding.bottom -
            margin.top -
            margin.bottom,
        ),
      });
      child.bbox.translateTo(
        node.padding.left + margin.left,
        node.padding.top + margin.top,
      );
    } else if (Node.isRepeat(node)) {
      const horizontal = Node.isRepeatX(node);
      const scale = d3
        .scaleBand()
        .domain(node.domain)
        .range([0, horizontal ? width : height])
        .paddingInner(node.paddingInner)
        .paddingOuter(node.paddingOuter);
      const bandwidth = scale.bandwidth();
      node.children.forEach((child, index) => {
        const margin = child.element
          ? { top: 0, right: 0, bottom: 0, left: 0 }
          : child.bbox.getMargin();
        this.arrange(child, {
          width: Math.max(
            0,
            (horizontal ? bandwidth : width) - margin.left - margin.right,
          ),
          height: Math.max(
            0,
            (horizontal ? height : bandwidth) - margin.top - margin.bottom,
          ),
          ...(child.element ? { margin } : {}),
        });
        child.bbox.translateTo(
          (horizontal ? scale(node.domain[index]) : 0) + margin.left,
          (horizontal ? 0 : scale(node.domain[index])) + margin.top,
        );
      });
    } else if (Node.isEmbedded(node)) {
      const slots = node.container.slots(node.repeated.domain, node.mapping, {
        width,
        height,
      });
      const matched = matchEmbedSlots(
        slots,
        embedChildMap(node.repeated, node.mapping, node.embeddedChildren),
      );
      node.children = matched.map(({ slot, child }) => {
        this.arrange(child, {
          ...(slot.width !== undefined ? { width: slot.width } : {}),
          ...(slot.height !== undefined ? { height: slot.height } : {}),
        });
        const rect = child.bbox.contentRect();
        child.bbox.translateTo(
          slot.x - rect.width / 2,
          slot.y - rect.height / 2,
        );
        return child;
      });
    }
  }

  static layout(root, container, options = {}) {
    const computed = this.computeLayout(
      root,
      { document: container?.ownerDocument },
      options,
    );
    return renderComputedLayout(computed, container, {
      debugBBox: options.debugBBox,
    });
  }

  static renderInto(root, container, options = {}) {
    const computed = this.computeLayout(
      root,
      { document: container?.ownerDocument },
      options,
    );
    return renderComputedLayoutInto(computed, container, {
      debugBBox: options.debugBBox,
    });
  }
}

/** Compute a reusable declaration without retaining state on it. */
export function computeLayout(
  spec,
  { document, measurementAdapter, ...size } = {},
) {
  return LayoutEngine.computeLayout(
    spec,
    { document, measurementAdapter },
    size,
  );
}

setLayoutRenderer((spec, container, options) =>
  isSvgContainer(container)
    ? LayoutEngine.renderInto(spec, container, options)
    : LayoutEngine.layout(spec, container, options),
);
