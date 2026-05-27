import * as d3 from "d3";
import { Node } from "./node.js";

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
  static renderTree(node, container, x = 0, y = 0) {
    if (!Node.isStack(node)) {
      const margin = node.bbox.getMargin();
      const g = container
        .append("g")
        .attr("class", node.classTag)
        .attr("transform", `translate(${x - margin.left}, ${y - margin.top})`);

      const renderResult = node.render(g.node(), {
        width: node.bbox.contentRect().width,
        height: node.bbox.contentRect().height,
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

    return { node };
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
    const g = container
      .append("g")
      .attr("class", `${node.classTag} debug-bbox`)
      .attr("data-layout-debug", "bbox");

    const renderBBox = (n, offsetX = x, offsetY = y) => {
      const bbox = n.bbox;
      g.append("rect")
        .attr("x", offsetX + bbox.outerRect().x)
        .attr("y", offsetY + bbox.outerRect().y)
        .attr("width", bbox.outerRect().width)
        .attr("height", bbox.outerRect().height)
        .attr("fill", "none")
        .attr("stroke", "red")
        .attr("stroke-dasharray", "4 2");

      g.append("rect")
        .attr("x", offsetX + bbox.contentRect().x)
        .attr("y", offsetY + bbox.contentRect().y)
        .attr("width", bbox.contentRect().width)
        .attr("height", bbox.contentRect().height)
        .attr("fill", "none")
        .attr("stroke", "blue")
        .attr("stroke-dasharray", "4 2");

      if (Node.isStack(n)) {
        const content = n.bbox.contentRect();
        n.children.forEach((child) => {
          renderBBox(child, offsetX + content.x, offsetY + content.y);
        });
      }
    };

    renderBBox(node);
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
}

export function renderComputedLayout(root, container, options = {}) {
  return LayoutRenderer.render(root, container, options);
}
