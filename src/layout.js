import * as d3 from "d3";
import { Chart } from "./chart.js";
import { BBox } from "./utils/bbox.js";

export function chart(config) {
  const node = new Node();
  node.element = new Chart(config);
  node.classTag = "chart";
  return node;
}

export function text(config) {
  // TODO: implement text creation method (node with text element)
  throw new Error("Text not implemented yet.");
}

export function image(config) {
  // TODO: implement image creation method (node with image element)
  throw new Error("Image not implemented yet.");
}

/**
 * Base class for layout nodes (basic elements, compositions).
 */
export class Node {
  constructor() {
    this.bbox = new BBox(0, 0, 0, 0);
  }

  /**
   * Checks if a node is a composition.
   * @param {Node} node - The node to check.
   * @returns {boolean} True if the node is a composition.
   */
  static isComposition(node) {
    return node instanceof Composition;
  }

  /**
   * Checks if a node is a repeat.
   * @param {Node} node - The node to check.
   * @returns {boolean} True if the node is a repeat.
   */
  static isRepeat(node) {
    return node instanceof Repeat;
  }

  /**
   * Checks if a node is a stack.
   * @param {Node} node - The node to check.
   * @returns {boolean} True if the node is a stack.
   */
  static isStack(node) {
    return node instanceof Stack;
  }

  /**
   * Renders the layout node.
   * @param {HTMLElement} container - The container element.
   */
  render(container, renderOptions = {}) {
    // console.log(this.bbox);
    if (this.element) {
      const content = this.bbox.contentRect();
      this.element.render(container, {
        width:
          renderOptions.width !== undefined
            ? renderOptions.width
            : content.width,
        height:
          renderOptions.height !== undefined
            ? renderOptions.height
            : content.height,
        margin:
          renderOptions.margin !== undefined
            ? renderOptions.margin
            : this.bbox.getMargin(),
      });
    }
  }
}

/**
 * Base class for all compositions (Stack, Repeat, etc.)
 */
export class Composition extends Node {
  constructor() {
    super();
    this.classTag = "composition"; // to identify composition type name, stated by subclass
    this.children = [];
  }

  /**
   * Updates the bounding box of the composition based on its children's bounding boxes.
   */
  updateBBox() {
    if (this.children?.length > 0) {
      let combinedBBox = this.children[0].bbox;
      for (let i = 1; i < this.children.length; i++) {
        combinedBBox = combinedBBox.union(this.children[i].bbox);
      }

      const content = combinedBBox.contentRect();
      this.children.forEach((child) => {
        child.bbox.translateBy(-content.x, -content.y);
      });

      const normalizedBBox = new BBox(0, 0, content.width, content.height);
      normalizedBBox.setMargin(combinedBBox.getMargin());
      this.bbox = normalizedBBox;
    }
  }
}

/**
 * Stack composition class.
 */
export class Stack extends Composition {
  /**
   * Creates an instance of Stack.
   * @param {Array} nodes - Array of node instances.
   * @param {string} direction - Stacking direction ('horizontal' | 'vertical').
   * @param {Object} options - Composition options.
   */
  constructor(nodes, direction, options = {}) {
    super();
    this.children = nodes;
    this.direction = direction;
    this.isStack = true;
    this.type = "stack";
    this.classTag = direction === "horizontal" ? "stackX" : "stackY";
    this.margin = options.margin || 0; // TODO: allow the use of different margins
    this.align = options.align || [];
    this.alignedNodes = [];

    for (let i = 0; i < nodes.length; i++) {
      const alignedNode =
        this.align[i] !== undefined && this.align[i] !== null
          ? this.align[i]
          : nodes[i];

      this.alignedNodes.push(alignedNode);
    }
  }

  /**
   * Gets all children from a node (flattening compositions).
   * @private
   */
  _getAllNodes(node) {
    if (node instanceof Stack) {
      return node.flatten();
    }
    return [node];
  }

  /**
   * Flattens the composition tree.
   */
  flatten() {
    let allNodes = [];

    this.children.forEach((c) => {
      if (c instanceof Stack) {
        const res = c.flatten();
        allNodes.push(...res.nodes);
      } else {
        allNodes.push(c);
      }
    });

    return [...new Set(allNodes)];
  }

  /**
   * Renders the composition.
   * @param {HTMLElement} container - The container element.
   */
  render(container) {
    if (container.innerHTML) container.innerHTML = "";
    LayoutEngine.layout(this, container);
  }
}

/**
 * Creates a horizontal composition of nodes.
 * @param {Array} nodes - Array of node instances.
 * @param {Object} options - Composition options.
 * @returns {Stack} A Stack instance.
 */
export function stackX(nodes, options) {
  return new Stack(nodes, "horizontal", options);
}

/**
 * Creates a vertical composition of nodes.
 * @param {Array} nodes - Array of node instances.
 * @param {Object} options - Composition options.
 * @returns {Stack} A Stack instance.
 */
export function stackY(nodes, options) {
  return new Stack(nodes, "vertical", options);
}

/**
 * Base class for repeat compositions.
 */
export class Repeat extends Composition {
  /**
   * Creates an instance of Repeat.
   * @param {Array} domain - The list of categorical values.
   * @param {Function} func - A function that takes a value and returns a node.
   * @param {Object} options - Repeat options { paddingInner, paddingOuter }.
   */
  constructor(domain, func, options = {}) {
    super();
    this.isRepeat = true;
    this.type = "repeat";
    this.domain = domain || [];
    this.func = func;
    this.paddingInner =
      options.paddingInner !== undefined ? options.paddingInner : 0.1;
    this.paddingOuter =
      options.paddingOuter !== undefined ? options.paddingOuter : 0.1;
    this.width = options.width;
    this.height = options.height;

    this.options = {
      width: this.width,
      height: this.height,
      paddingInner: this.paddingInner,
      paddingOuter: this.paddingOuter,
      margin: options.margin || { top: 0, right: 0, bottom: 0, left: 0 },
    };

    // no `render()` method here; implemented in subclasses
  }
}

/**
 * RepeatX class for horizontal repetition.
 */
export class RepeatX extends Repeat {
  /**
   * Creates an instance of RepeatX.
   * @param {Array} domain - The list of categorical values.
   * @param {Function} func - A function that takes a value and returns a node.
   * @param {Object} options - Repeat options { paddingInner, paddingOuter }.
   */
  constructor(domain, func, options = {}) {
    super(domain, func, options);
    this.classTag = "repeatX";
  }

  /**
   * Renders the repeated nodes.
   * @param {HTMLElement} container - The container element.
   * @param {Object} renderOptions - Render options { width, height }.
   */
  render(container, renderOptions = {}) {
    if (!this.domain || this.domain.length === 0) {
      if (container.innerHTML) container.innerHTML = "";
      return;
    }

    const { width = 400, height = 300 } = renderOptions;
    if (container.innerHTML) container.innerHTML = "";
    const gParent = d3.select(container);

    const xScale = d3
      .scaleBand()
      .domain(this.domain)
      .range([0, width])
      .paddingInner(this.paddingInner)
      .paddingOuter(this.paddingOuter);

    const bandwidth = xScale.bandwidth();

    this.domain.forEach((value) => {
      const node = this.func(value);
      const g = gParent
        .append("g")
        .attr("transform", `translate(${xScale(value)}, 0)`);

      node.render(g.node(), { width: bandwidth, height: height });
    });
  }
}

/**
 * RepeatY class for vertical repetition.
 */
export class RepeatY extends Repeat {
  /**
   * Creates an instance of RepeatY.
   * @param {Array} domain - The list of categorical values.
   * @param {Function} func - A function that takes a value and returns a node.
   * @param {Object} options - Repeat options { paddingInner, paddingOuter }.
   */
  constructor(domain, func, options = {}) {
    super(domain, func, options);
    this.classTag = "repeatY";
  }

  /**
   * Renders the repeated nodes.
   * @param {HTMLElement} container - The container element.
   * @param {Object} renderOptions - Render options { width, height }.
   */
  render(container, renderOptions = {}) {
    if (!this.domain || this.domain.length === 0) {
      if (container.innerHTML) container.innerHTML = "";
      return;
    }

    const { width = 400, height = 300 } = renderOptions;
    if (container.innerHTML) container.innerHTML = "";
    const gParent = d3.select(container);

    const yScale = d3
      .scaleBand()
      .domain(this.domain)
      .range([0, height])
      .paddingInner(this.paddingInner)
      .paddingOuter(this.paddingOuter);

    const bandwidth = yScale.bandwidth();

    this.domain.forEach((value) => {
      const node = this.func(value);
      const g = gParent
        .append("g")
        .attr("transform", `translate(0, ${yScale(value)})`);

      node.render(g.node(), { width: width, height: bandwidth });
    });
  }
}

/**
 * Layout calculator utility class.
 */
export class LayoutCalculator {
  /**
   * Calculates the margin required for a node by actually rendering axes
   * and measuring their bounding boxes.
   * @param {Object} node - The node object.
   * @returns {Object} The calculated margin {top, right, bottom, left}.
   */
  static estimateMargin(node) {
    if (
      typeof document === "undefined" ||
      !document?.body ||
      typeof document.createElementNS !== "function"
    ) {
      throw new Error(
        "LayoutCalculator.estimateMargin requires a DOM with SVG getBBox support.",
      );
    }

    const width = node.options?.width ?? node.width ?? 400;
    const height = node.options?.height ?? node.height ?? 300;
    const zeroMargin = { top: 0, right: 0, bottom: 0, left: 0 };
    const tempSvg = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "svg",
    );

    tempSvg.setAttribute("width", width);
    tempSvg.setAttribute("height", height);
    tempSvg.style.position = "absolute";
    tempSvg.style.left = "-10000px";
    tempSvg.style.top = "-10000px";
    tempSvg.style.visibility = "hidden";
    tempSvg.style.overflow = "visible";

    document.body.appendChild(tempSvg);

    try {
      node.render(tempSvg, {
        width,
        height,
        margin: zeroMargin,
      });

      if (typeof tempSvg.getBBox !== "function") {
        throw new Error(
          "LayoutCalculator.estimateMargin requires a DOM with SVG getBBox support.",
        );
      }

      const bbox = tempSvg.getBBox();
      return {
        top: Math.max(0, -bbox.y),
        right: Math.max(0, bbox.x + bbox.width - width),
        bottom: Math.max(0, bbox.y + bbox.height - height),
        left: Math.max(0, -bbox.x),
      };
    } finally {
      tempSvg.remove();
    }
  }

  /**
   * Suggests width & height for a node based on its data and configuration.
   * @param {Object} node - The node object.
   * @returns {Object} The suggested dimensions {width, height}.
   */
  static suggestWidthHeight(node) {
    const { data, encoding, mark, direction } = node.options;
    const defaultWidth = 400;
    const defaultHeight = 300;

    if (node.isRepeat) {
      return { width: defaultWidth, height: defaultHeight };
    }

    if (mark === "bar") {
      if (direction === "horizontal" && encoding.y) {
        const uniqueY = new Set(data.map((d) => d[encoding.y])).size;
        return {
          width: defaultWidth,
          height: Math.max(defaultHeight, uniqueY * 20),
        };
      } else if (encoding.x) {
        const uniqueX = new Set(data.map((d) => d[encoding.x])).size;
        return {
          width: Math.max(defaultWidth, uniqueX * 20),
          height: defaultHeight,
        };
      }
    }

    return { width: defaultWidth, height: defaultHeight };
  }
}

/**
 * Layout engine for computing and rendering layouts.
 */
export class LayoutEngine {
  /**
   * Checks whether `container` contains `target`, including itself.
   * @param {Node} container
   * @param {Node} target
   * @returns {boolean}
   */
  static containsNode(container, target) {
    if (container === target) return true;
    if (!Node.isStack(container)) return false;
    return container.children.some((child) => this.containsNode(child, target));
  }

  /**
   * Finds a target content rect in the coordinate space of an already-computed
   * direct stack child.
   * @param {Node} container
   * @param {Node} target
   * @returns {Object|null}
   */
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

  /**
   * Gets the alignment target that should be used for a direct stack child.
   * Falls back to the child itself when the configured target lives elsewhere.
   * @param {Node} child
   * @param {Node} alignedNode
   * @returns {Node}
   */
  static alignmentTargetForChild(child, alignedNode) {
    return this.containsNode(child, alignedNode) ? alignedNode : child;
  }

  /**
   * Finds the first explicit alignment target that is inside one of the direct
   * children and returns its rect in that child coordinate space.
   * @param {Stack} node
   * @returns {Object}
   */
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

  /**
   * Helper to find the relative layout position of a target node within a computed tree.
   * @param {Object} computedNode - The current computed node to search within.
   * @param {Node} targetNode - The target node to find.
   * @returns {Object|null} The layout box {x, y, width, height} relative to computedNode, or null.
   */
  static findNodeLayout(computedNode, targetNode) {
    if (computedNode.node === targetNode) {
      if (targetNode.bbox instanceof BBox) {
        return {
          x: targetNode.bbox.content.x,
          y: targetNode.bbox.content.y,
          width: targetNode.bbox.content.width,
          height: targetNode.bbox.content.height,
        };
      } else {
        throw new Error("Invalid layout tree: targetNode.bbox must be a BBox");
      }
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
    return null; // TODO: when will this happen?
  }

  /**
   * Helper to traverse the tree.
   */
  static traverseTree(node, callback) {
    callback(node);
    if (Node.isStack(node)) {
      node.children.forEach((child) => {
        this.traverseTree(child, callback);
      });
    }
  }

  /**
   * Recursively computes the dimensions and positions of the layout tree.
   * @param {Node} node - The layout node.
   * @returns {Object} Computed layout node with dimensions and children positions.
   */
  static computeLayout(node) {
    if (node instanceof Stack) {
      if (node.children.length === 0) {
        throw new Error("Invalid: composition node has no children.");
      }

      node.children.forEach((child) => {
        this.computeLayout(child);
      });

      const n = node.children.length;

      // adjust children layout
      if (node.direction === "horizontal") {
        const referenceRect = this.findReferenceAlignment(node);
        const sharedY = referenceRect.y;
        const sharedHeight = referenceRect.height;

        let currentX = 0;
        for (let i = 0; i < node.children.length; i++) {
          const child = node.children[i];
          const bbox = child.bbox;
          const margin = bbox.getMargin();
          const target = this.alignmentTargetForChild(
            child,
            node.alignedNodes[i],
          );
          const targetRect = this.findTargetRectWithin(child, target);
          currentX += margin.left;

          bbox.translateTo(currentX, sharedY - targetRect.y);
          if (target === child) {
            bbox.setSize(-1, sharedHeight);
          }

          currentX += bbox.contentRect().width + margin.right;
        }

        node.updateBBox();
      } else if (node.direction === "vertical") {
        const referenceRect = this.findReferenceAlignment(node);
        const sharedX = referenceRect.x;
        const sharedWidth = referenceRect.width;

        let currentY = 0;
        for (let i = 0; i < node.children.length; i++) {
          const child = node.children[i];
          const bbox = child.bbox;
          const margin = bbox.getMargin();
          const target = this.alignmentTargetForChild(
            child,
            node.alignedNodes[i],
          );
          const targetRect = this.findTargetRectWithin(child, target);
          currentY += margin.top;

          bbox.translateTo(sharedX - targetRect.x, currentY);
          if (target === child) {
            bbox.setSize(sharedWidth, -1);
          }

          currentY += bbox.contentRect().height + margin.bottom;
        }

        node.updateBBox();
      } else {
        throw new Error(`Unknown stacking direction: ${node.direction}`);
      }
    } else if (node instanceof Repeat) {
      const hasExplicitWidth = node.options.width !== undefined;
      const hasExplicitHeight = node.options.height !== undefined;
      let w = node.options.width;
      let h = node.options.height;

      if (!hasExplicitWidth || !hasExplicitHeight) {
        const suggested = LayoutCalculator.suggestWidthHeight(node);
        if (!hasExplicitWidth) w = suggested.width;
        if (!hasExplicitHeight) h = suggested.height;
      }

      if (
        node.domain.length > 0 &&
        ((node instanceof RepeatX && !hasExplicitHeight) ||
          (node instanceof RepeatY && !hasExplicitWidth))
      ) {
        const sampleChild = node.func(node.domain[0]);
        this.computeLayout(sampleChild);

        if (node instanceof RepeatX && !hasExplicitHeight) {
          h = sampleChild.bbox.totalHeight();
        }

        if (node instanceof RepeatY && !hasExplicitWidth) {
          w = sampleChild.bbox.totalWidth();
        }
      }

      const bbox = new BBox(0, 0, w, h);
      bbox.setMargin(node.options.margin);
      node.bbox = bbox;
    } else {
      const element = node.element;
      const margin = LayoutCalculator.estimateMargin(element);
      let w = element.options.width;
      let h = element.options.height;

      if (w === undefined || h === undefined) {
        const suggested = LayoutCalculator.suggestWidthHeight(element);
        if (w === undefined) w = suggested.width;
        if (h === undefined) h = suggested.height;
      }

      const bbox = new BBox(0, 0, w, h);
      bbox.setMargin(margin);
      node.bbox = bbox;
    }
  }

  /**
   * Recursively renders the layout tree.
   * @param {Object} node - The layout node.
   * @param {d3.Selection} container - The SVG container selection.
   * @param {number} x - X position.
   * @param {number} y - Y position.
   */
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
        margin: margin,
      });
    } else {
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
  }

  /**
   * (Debug) Renders the bbox of the layout tree only.
   * @param {Object} node - The layout node.
   * @param {d3.Selection} container - The SVG container selection.
   * @param {number} x - X position.
   * @param {number} y - Y position.
   */
  static renderTreeBBoxOnly(node, container, x = 0, y = 0) {
    const g = container.append("g").attr("class", node.classTag);

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

  /**
   * Composes multiple elements into a single layout.
   * @param {Node} root - The root composition node.
   * @param {HTMLElement} container - The container element.
   */
  static layout(root, container) {
    container.innerHTML = "";

    this.computeLayout(root);
    const outer = root.bbox.outerRect();

    const svg = d3
      .select(container)
      .append("svg")
      .attr("width", outer.width + 2000)
      .attr("height", outer.height + 2000);

    this.renderTree(root, svg);
    this.renderTreeBBoxOnly(root, svg);

    // debug
    this.traverseTree(root, (n) => {
      // console.log(n);
      // console.log(n.classTag, n.bbox.contentRect(), n.bbox.outerRect());
    });
  }
}
