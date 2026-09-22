import * as d3 from "d3";
import { Node } from "./node.js";
import { resolveRenderSize } from "./size-policy.js";

const ZERO_MARGIN = { top: 0, right: 0, bottom: 0, left: 0 };

function renderedSize(node, renderSize = {}) {
  return resolveRenderSize(node, renderSize, node.bbox.contentRect());
}

function embeddedChildPlacement(slot, child) {
  const renderSize = resolveRenderSize(child, slot, child.bbox.contentRect());
  return {
    x: slot.x - renderSize.width / 2,
    y: slot.y - renderSize.height / 2,
    renderSize,
  };
}

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
  static renderLeaf(node, container, x, y, renderSize) {
    const margin = renderSize.margin || node.bbox.getMargin();
    const { width, height } = renderedSize(node, renderSize);
    const group = container
      .append("g")
      .attr("class", node.classTag)
      .attr("transform", `translate(${x - margin.left}, ${y - margin.top})`);
    const renderResult = node.render(group.node(), {
      width,
      height,
      margin,
    });

    return {
      node,
      linkAnchors: offsetLinkAnchors(
        renderResult?.linkAnchors,
        x - margin.left,
        y - margin.top,
      ),
    };
  }

  static renderStack(node, container, x, y) {
    const group = container
      .append("g")
      .attr("class", node.classTag)
      .attr("transform", `translate(${x}, ${y})`);
    const childMetadata = node.children.map((child) =>
      this.renderTree(
        child,
        group,
        child.bbox.contentRect().x,
        child.bbox.contentRect().y,
      ),
    );

    if (node.link) {
      this.renderStackLinks(node, group, childMetadata);
    }

    return { node, children: childMetadata };
  }

  static renderWrapper(node, container, x, y) {
    const margin = node.bbox.getMargin();
    const { width, height } = node.bbox.contentRect();
    const group = container
      .append("g")
      .attr("class", node.classTag)
      .attr("transform", `translate(${x - margin.left}, ${y - margin.top})`);
    const childOuterWidth = Math.max(
      0,
      width - node.padding.left - node.padding.right,
    );
    const childOuterHeight = Math.max(
      0,
      height - node.padding.top - node.padding.bottom,
    );
    const childMargin = node.child.bbox.getMargin();
    const childWidth = Math.max(
      0,
      childOuterWidth - childMargin.left - childMargin.right,
    );
    const childHeight = Math.max(
      0,
      childOuterHeight - childMargin.top - childMargin.bottom,
    );
    const rectX = margin.left;
    const rectY = margin.top;

    if (node.fill !== "none") {
      group
        .append("rect")
        .attr("class", "wrapper-background")
        .attr("x", rectX)
        .attr("y", rectY)
        .attr("width", width)
        .attr("height", height)
        .attr("fill", node.fill)
        .attr("stroke", "none");
    }

    const childMetadata = this.renderTree(
      node.child,
      group,
      rectX + node.padding.left + childMargin.left,
      rectY + node.padding.top + childMargin.top,
      { width: childWidth, height: childHeight },
    );
    const border = group
      .append("rect")
      .attr("class", "wrapper-border")
      .attr("x", rectX)
      .attr("y", rectY)
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "none")
      .attr("stroke", node.stroke)
      .attr("stroke-width", node.strokeWidth);

    if (node.strokeDasharray !== undefined) {
      border.attr("stroke-dasharray", node.strokeDasharray);
    }

    return { node, children: [childMetadata] };
  }

  static renderRepeat(node, container, x, y, renderSize) {
    if (node.domain.length === 0) {
      return { node, children: [] };
    }

    const margin = node.bbox.getMargin();
    const { width, height } = renderedSize(node, renderSize);
    const group = container
      .append("g")
      .attr("class", node.classTag)
      .attr("transform", `translate(${x - margin.left}, ${y - margin.top})`);
    const horizontal = Node.isRepeatX(node);
    const scale = d3
      .scaleBand()
      .domain(node.domain)
      .range([0, horizontal ? width : height])
      .paddingInner(node.paddingInner)
      .paddingOuter(node.paddingOuter);
    const bandwidth = scale.bandwidth();
    const children = [];

    node.domain.forEach((value, index) => {
      const child = node.children[index];
      const childMargin = child.element ? ZERO_MARGIN : child.bbox.getMargin();
      const cellWidth = horizontal ? bandwidth : width;
      const cellHeight = horizontal ? height : bandwidth;
      const childWidth = Math.max(
        0,
        cellWidth - childMargin.left - childMargin.right,
      );
      const childHeight = Math.max(
        0,
        cellHeight - childMargin.top - childMargin.bottom,
      );
      const childX =
        margin.left + (horizontal ? scale(value) : 0) + childMargin.left;
      const childY =
        margin.top + (horizontal ? 0 : scale(value)) + childMargin.top;

      children.push(
        this.renderTree(child, group, childX, childY, {
          width: childWidth,
          height: childHeight,
          ...(child.element ? { margin: ZERO_MARGIN } : {}),
        }),
      );
    });

    return { node, children };
  }

  static renderEmbedded(node, container, x, y, renderSize) {
    const margin = node.bbox.getMargin();
    const { width, height } = renderedSize(node, renderSize);
    const group = container
      .append("g")
      .attr("class", node.classTag)
      .attr("transform", `translate(${x - margin.left}, ${y - margin.top})`);

    if (typeof node.container.render === "function") {
      node.container.render(group.node(), { width, height, margin });
    }

    const children = node
      .resolveSlots({ width, height })
      .map(({ slot, child }) => {
        const placement = embeddedChildPlacement(slot, child);
        return this.renderTree(
          child,
          group,
          margin.left + placement.x,
          margin.top + placement.y,
          placement.renderSize,
        );
      });

    return { node, children };
  }

  static renderTree(node, container, x = 0, y = 0, renderSize = {}) {
    if (Node.isStack(node)) {
      return this.renderStack(node, container, x, y);
    }

    if (Node.isWrapper(node)) {
      return this.renderWrapper(node, container, x, y);
    }

    if (Node.isRepeat(node)) {
      return this.renderRepeat(node, container, x, y, renderSize);
    }

    if (Node.isEmbedded(node)) {
      return this.renderEmbedded(node, container, x, y, renderSize);
    }

    return this.renderLeaf(node, container, x, y, renderSize);
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

  static renderTreeBBoxOnly(node, container, x = 0, y = 0, renderSize = {}) {
    const group = container
      .append("g")
      .attr("class", `${node.classTag} debug-bbox`)
      .attr("data-layout-debug", "bbox");

    const renderBBox = (
      current,
      contentX,
      contentY,
      currentRenderSize = {},
    ) => {
      const margin = current.bbox.getMargin();
      const effectiveSize = renderedSize(current, currentRenderSize);
      group
        .append("rect")
        .attr("x", contentX - margin.left)
        .attr("y", contentY - margin.top)
        .attr("width", effectiveSize.width + margin.left + margin.right)
        .attr("height", effectiveSize.height + margin.top + margin.bottom)
        .attr("fill", "none")
        .attr("stroke", "red")
        .attr("stroke-dasharray", "4 2");
      group
        .append("rect")
        .attr("x", contentX)
        .attr("y", contentY)
        .attr("width", effectiveSize.width)
        .attr("height", effectiveSize.height)
        .attr("fill", "none")
        .attr("stroke", "blue")
        .attr("stroke-dasharray", "4 2");

      if (Node.isStack(current)) {
        current.children.forEach((child) => {
          const childRect = child.bbox.contentRect();
          renderBBox(child, contentX + childRect.x, contentY + childRect.y);
        });
      } else if (Node.isWrapper(current)) {
        const childMargin = current.child.bbox.getMargin();
        renderBBox(
          current.child,
          contentX + current.padding.left + childMargin.left,
          contentY + current.padding.top + childMargin.top,
        );
      } else if (Node.isRepeat(current)) {
        const horizontal = Node.isRepeatX(current);
        const scale = d3
          .scaleBand()
          .domain(current.domain)
          .range([0, horizontal ? effectiveSize.width : effectiveSize.height])
          .paddingInner(current.paddingInner)
          .paddingOuter(current.paddingOuter);

        current.domain.forEach((value, index) => {
          const child = current.children[index];
          const childMargin = child.element
            ? ZERO_MARGIN
            : child.bbox.getMargin();
          renderBBox(
            child,
            contentX + (horizontal ? scale(value) : 0) + childMargin.left,
            contentY + (horizontal ? 0 : scale(value)) + childMargin.top,
          );
        });
      } else if (Node.isEmbedded(current)) {
        current.resolveSlots(effectiveSize).forEach(({ slot, child }) => {
          const placement = embeddedChildPlacement(slot, child);
          renderBBox(
            child,
            contentX + placement.x,
            contentY + placement.y,
            placement.renderSize,
          );
        });
      }
    };

    renderBBox(node, x, y, renderSize);
  }

  static render(root, container, options = {}) {
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
  return LayoutRenderer.render(root, container, options);
}

export function renderComputedLayoutInto(root, container, options = {}) {
  return LayoutRenderer.renderInto(root, container, options);
}
