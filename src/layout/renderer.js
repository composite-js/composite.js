import * as d3 from "d3";
import { Node } from "./node.js";

export class LayoutRenderer {
  static renderTree(node, container, x = 0, y = 0) {
    if (!Node.isStack(node)) {
      const margin = node.bbox.getMargin();
      const g = container
        .append("g")
        .attr("class", node.classTag)
        .attr("transform", `translate(${x - margin.left}, ${y - margin.top})`);

      node.render(g.node(), {
        width: node.bbox.contentRect().width,
        height: node.bbox.contentRect().height,
        margin,
      });
      return;
    }

    const group = container
      .append("g")
      .attr("class", node.classTag)
      .attr("transform", `translate(${x}, ${y})`);

    node.children.forEach((child) => {
      this.renderTree(
        child,
        group,
        child.bbox.contentRect().x,
        child.bbox.contentRect().y,
      );
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
