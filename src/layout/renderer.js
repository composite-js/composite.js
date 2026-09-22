import * as d3 from "d3";
import { isSvgContainer } from "../utils/dom.js";
import { Node } from "./node.js";
import { createRenderContext } from "./render-context.js";
import { assertComputedLayout } from "./computed.js";

function offsetPoint(point, x, y) {
  return { x: point.x + x, y: point.y + y };
}

function offsetLinkAnchors(linkAnchors, x, y) {
  if (!linkAnchors?.anchors) return undefined;

  return {
    channels: [...(linkAnchors.channels || [])],
    anchors: linkAnchors.anchors.map((anchor) => ({
      ...anchor,
      left: offsetPoint(anchor.left, x, y),
      right: offsetPoint(anchor.right, x, y),
      top: offsetPoint(anchor.top, x, y),
      bottom: offsetPoint(anchor.bottom, x, y),
    })),
  };
}

function linkChannelForStack(stack) {
  return stack.direction === "horizontal" ? "y" : "x";
}

function linkSidesForStack(stack) {
  return stack.direction === "horizontal"
    ? { from: "right", to: "left" }
    : { from: "bottom", to: "top" };
}

function linkAnchorMap(chartNode, linkAnchors, channel) {
  if (!linkAnchors?.channels?.includes(channel)) {
    throw new Error(
      `mark "${chartNode.element.mark}" cannot provide anchors for encoding.${channel} in ${chartNode.classTag}.`,
    );
  }

  const anchorsByKey = new Map();
  linkAnchors.anchors.forEach((anchor) => {
    const key = anchor[channel];
    if (anchorsByKey.has(key)) {
      throw new Error(
        `duplicate link key "${String(key)}" for encoding.${channel}.`,
      );
    }
    anchorsByKey.set(key, anchor);
  });

  return anchorsByKey;
}

export class LayoutRenderer {
  static renderLeaf(node, container, x, y, context) {
    const margin = node.bbox.getMargin();
    const { width, height } = node.bbox.contentRect();
    const group = container
      .append("g")
      .attr("class", node.classTag)
      .attr("transform", `translate(${x - margin.left}, ${y - margin.top})`);
    const element = node.createElement ? node.createElement() : node.element;
    if (!element || typeof element.render !== "function") {
      throw new TypeError(
        "custom factory must return an object with a render method.",
      );
    }
    const result = element.render(
      group.node(),
      { width, height, margin },
      context,
    );
    return {
      node,
      linkAnchors: offsetLinkAnchors(
        result?.linkAnchors,
        x - margin.left,
        y - margin.top,
      ),
    };
  }

  static renderTree(
    node,
    container,
    x = 0,
    y = 0,
    context = createRenderContext(),
  ) {
    if (node.element) return this.renderLeaf(node, container, x, y, context);
    if (Node.isRepeat(node) && !node.children.length)
      return { node, children: [] };
    const group = container
      .append("g")
      .attr("class", node.classTag)
      .attr("transform", `translate(${x}, ${y})`);
    const { width, height } = node.bbox.contentRect();

    if (Node.isWrapper(node) && node.fill !== "none") {
      group
        .append("rect")
        .attr("class", "wrapper-background")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", width)
        .attr("height", height)
        .attr("fill", node.fill)
        .attr("stroke", "none");
    }
    if (Node.isEmbedded(node) && typeof node.container.render === "function") {
      node.container.render(
        group.node(),
        { width, height, margin: { top: 0, right: 0, bottom: 0, left: 0 } },
        context,
      );
    }
    const children = node.children.map((child) => {
      const rect = child.bbox.contentRect();
      return this.renderTree(child, group, rect.x, rect.y, context);
    });
    if (Node.isWrapper(node)) {
      const border = group
        .append("rect")
        .attr("class", "wrapper-border")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", width)
        .attr("height", height)
        .attr("fill", "none")
        .attr("stroke", node.stroke)
        .attr("stroke-width", node.strokeWidth);
      if (node.strokeDasharray !== undefined)
        border.attr("stroke-dasharray", node.strokeDasharray);
    }
    if (Node.isStack(node) && node.link)
      this.renderStackLinks(node, group, children);
    return { node, children };
  }

  static renderStackLinks(stack, group, childMetadata) {
    const channel = linkChannelForStack(stack);
    const sides = linkSidesForStack(stack);
    const [firstMetadata, secondMetadata] = childMetadata;
    const firstAnchors = linkAnchorMap(
      stack.children[0],
      firstMetadata?.linkAnchors,
      channel,
    );
    const secondAnchors = linkAnchorMap(
      stack.children[1],
      secondMetadata?.linkAnchors,
      channel,
    );
    const groupNode = group.node();
    const layerNode = groupNode.ownerDocument.createElementNS(
      groupNode.namespaceURI,
      "g",
    );
    layerNode.setAttribute("class", "stack-link-layer");
    groupNode.insertBefore(layerNode, groupNode.children[0] || null);
    const layer = d3.select(layerNode);

    firstAnchors.forEach((fromAnchor, key) => {
      const toAnchor = secondAnchors.get(key);
      if (!toAnchor) return;

      const from = fromAnchor[sides.from];
      const to = toAnchor[sides.to];
      layer
        .append("line")
        .attr("class", "stack-link")
        .attr("x1", from.x)
        .attr("y1", from.y)
        .attr("x2", to.x)
        .attr("y2", to.y)
        .attr("stroke", "#8a8a8a")
        .attr("stroke-width", 1)
        .attr("stroke-opacity", 0.55)
        .attr("fill", "none")
        .attr("pointer-events", "none");
    });
  }

  static renderTreeBBoxOnly(node, container, x = 0, y = 0) {
    const group = container
      .append("g")
      .attr("class", `${node.classTag} debug-bbox`)
      .attr("data-layout-debug", "bbox");
    const visit = (current, contentX, contentY) => {
      const { width, height } = current.bbox.contentRect();
      const margin = current.bbox.getMargin();
      group
        .append("rect")
        .attr("x", contentX - margin.left)
        .attr("y", contentY - margin.top)
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .attr("fill", "none")
        .attr("stroke", "red")
        .attr("stroke-dasharray", "4 2");
      group
        .append("rect")
        .attr("x", contentX)
        .attr("y", contentY)
        .attr("width", width)
        .attr("height", height)
        .attr("fill", "none")
        .attr("stroke", "blue")
        .attr("stroke-dasharray", "4 2");
      current.children.forEach((child) => {
        const rect = child.bbox.contentRect();
        visit(child, contentX + rect.x, contentY + rect.y);
      });
    };
    visit(node, x, y);
  }

  static render(root, container, options = {}) {
    assertComputedLayout(root);
    const outer = root.bbox.outerRect();
    const debugBBox = options.debugBBox === true;

    if (container.innerHTML !== undefined) {
      container.innerHTML = "";
    } else {
      d3.select(container).selectAll("*").remove();
    }

    const svg = d3
      .select(container)
      .append("svg")
      .attr("width", outer.width)
      .attr("height", outer.height);

    this.renderTree(root, svg, -outer.x, -outer.y);

    if (debugBBox) {
      this.renderTreeBBoxOnly(root, svg, -outer.x, -outer.y);
    }

    return svg.node();
  }

  static renderInto(root, container, options = {}) {
    assertComputedLayout(root);
    const outer = root.bbox.outerRect();
    const debugBBox = options.debugBBox === true;

    if (container.innerHTML !== undefined) {
      container.innerHTML = "";
    } else {
      d3.select(container).selectAll("*").remove();
    }

    const target = d3.select(container);
    this.renderTree(root, target, -outer.x, -outer.y);

    if (debugBBox) {
      this.renderTreeBBoxOnly(root, target, -outer.x, -outer.y);
    }

    return container;
  }
}

export function renderComputedLayout(root, container, options = {}) {
  if (
    options.width !== undefined ||
    options.height !== undefined ||
    options.margin !== undefined
  ) {
    throw new TypeError(
      "Layout dimensions are fixed; call computeLayout() again to resize.",
    );
  }
  return isSvgContainer(container)
    ? LayoutRenderer.renderInto(root, container, options)
    : LayoutRenderer.render(root, container, options);
}

export function renderComputedLayoutInto(root, container, options = {}) {
  return LayoutRenderer.renderInto(root, container, options);
}
