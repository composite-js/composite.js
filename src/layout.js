import * as d3 from "d3";
import { Chart } from "./chart";
import { BBox } from "./utils/bbox";

export function chart(config) {
  const node = new Node();
  node.element = new Chart(config);
  return node;
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
  render(container) {
    if (this.element) {
      this.element.render(container);
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

    let alignedNodes = [];

    for (let i = 0; i < nodes.length; i++) {
      const alignedNode =
        this.align[i] !== undefined && this.align[i] !== null
          ? this.align[i]
          : nodes[i];

      alignedNodes.push(alignedNode);
    }

    this._syncPadding(alignedNodes, direction);
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
   * Synchronizes padding across nodes.
   * @private
   */
  _syncPadding(nodes, direction) {
    // TODO: implement this!!!
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

    this.options = {
      paddingInner: this.paddingInner,
      paddingOuter: this.paddingOuter,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
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
    const {
      data,
      encoding,
      width = 400,
      height = 300,
      xAxisPos = "bottom",
      yAxisPos = "left",
      showXAxis = true,
      showYAxis = true,
      xAxisName,
      yAxisName,
      mark,
    } = node.options;

    const margin = { top: 10, right: 10, bottom: 10, left: 10 };

    // Create temporary SVG for measurement
    const tempSvg = d3
      .create("svg")
      .attr("width", width + 100)
      .attr("height", height + 100);

    // Create scales based on data
    let xScale, yScale;

    if (encoding?.x && encoding?.y) {
      const xField = encoding.x;
      const yField = encoding.y;

      // Determine scale types based on data and mark type
      if (mark === "bar") {
        const xValues = data.map((d) => d[xField]);
        const yValues = data.map((d) => d[yField]);

        if (typeof xValues[0] === "string") {
          xScale = d3
            .scaleBand()
            .domain(xValues)
            .range([0, width])
            .padding(0.1);
        } else {
          xScale = d3
            .scaleLinear()
            .domain([0, d3.max(xValues)])
            .range([0, width]);
        }

        if (typeof yValues[0] === "string") {
          yScale = d3
            .scaleBand()
            .domain(yValues)
            .range([height, 0])
            .padding(0.1);
        } else {
          yScale = d3
            .scaleLinear()
            .domain([0, d3.max(yValues)])
            .range([height, 0]);
        }
      } else {
        const xValues = data.map((d) => d[xField]);
        const yValues = data.map((d) => d[yField]);

        xScale = d3.scaleLinear().domain(d3.extent(xValues)).range([0, width]);
        yScale = d3.scaleLinear().domain(d3.extent(yValues)).range([height, 0]);
      }

      // Render X axis if needed
      if (xScale && showXAxis) {
        const xAxisGenerator = xAxisPos === "top" ? d3.axisTop : d3.axisBottom;
        const xAxisGroup = tempSvg
          .append("g")
          .attr("class", "x-axis")
          .attr(
            "transform",
            `translate(50, ${xAxisPos === "top" ? 50 : 50 + height})`,
          )
          .call(xAxisGenerator(xScale));

        const xAxisBBox = xAxisGroup.node().getBBox();

        if (xAxisPos === "top") {
          margin.top = Math.max(
            margin.top,
            Math.abs(xAxisBBox.y) + xAxisBBox.height + 5,
          );
        } else {
          margin.bottom = Math.max(margin.bottom, xAxisBBox.height + 5);
        }

        if (xAxisName) {
          margin.bottom += 20;
        }
      }

      // Render Y axis if needed
      if (yScale && showYAxis) {
        const yAxisGenerator =
          yAxisPos === "right" ? d3.axisRight : d3.axisLeft;
        const yAxisGroup = tempSvg
          .append("g")
          .attr("class", "y-axis")
          .attr(
            "transform",
            `translate(${yAxisPos === "right" ? 50 + width : 50}, 50)`,
          )
          .call(yAxisGenerator(yScale));

        const yAxisBBox = yAxisGroup.node().getBBox();

        if (yAxisPos === "right") {
          margin.right = Math.max(margin.right, yAxisBBox.width + 5);
        } else {
          margin.left = Math.max(
            margin.left,
            Math.abs(yAxisBBox.x) + yAxisBBox.width + 5,
          );
        }

        if (yAxisName) {
          if (yAxisPos === "right") {
            margin.right += 20;
          } else {
            margin.left += 20;
          }
        }
      }
    }

    return margin;
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
        // TODO: current aligning strategy: align by the stack (if any) child height
        // This is a bad strategy. We need to improve it later.
        console.log(node.children[0]);
        let sharedHeight = node.children[0].bbox.contentRect().height;
        for (let i = 1; i < node.children.length; i++) {
          if (Node.isStack(node.children[i])) {
            sharedHeight = node.children[i].bbox.contentRect().height;
            break;
          }
        }

        let currentX = 0;
        const sharedY = 0;
        for (let i = 0; i < node.children.length; i++) {
          const bbox = node.children[i].bbox;
          currentX += bbox.margin.left;

          bbox.translateTo(currentX, sharedY);
          bbox.setSize(-1, sharedHeight);

          currentX += bbox.contentRect().width + bbox.margin.right;
        }

        // compute margin
        const margin = {
          left: node.children[0].bbox.margin.left,
          right: node.children[n - 1].bbox.margin.right,
          top: Math.max(...node.children.map((c) => c.bbox.margin.top)),
          bottom: Math.max(...node.children.map((c) => c.bbox.margin.bottom)),
        };

        // update bbox
        node.bbox.translateTo(margin.left, margin.top);
        node.bbox.setSize(currentX - margin.left - margin.right, sharedHeight);
        node.bbox.setMargin(margin);
      } else if (node.direction === "vertical") {
        let sharedWidth = node.children[0].bbox.contentRect().width;
        for (let i = 1; i < node.children.length; i++) {
          if (Node.isStack(node.children[i])) {
            sharedWidth = node.children[i].bbox.contentRect().width;
            break;
          }
        }

        let currentY = 0;
        const sharedX = 0;
        for (let i = 0; i < node.children.length; i++) {
          const bbox = node.children[i].bbox;
          currentY += bbox.margin.top;

          bbox.translateTo(sharedX, currentY);
          bbox.setSize(sharedWidth, -1);

          currentY += bbox.contentRect().height + bbox.margin.bottom;
        }

        const margin = {
          top: node.children[0].bbox.margin.top,
          bottom: node.children[n - 1].bbox.margin.bottom,
          left: Math.max(...node.children.map((c) => c.bbox.margin.left)),
          right: Math.max(...node.children.map((c) => c.bbox.margin.right)),
        };

        node.bbox.translateTo(margin.left, margin.top);
        node.bbox.setSize(sharedWidth, currentY - margin.top - margin.bottom);
        node.bbox.setMargin(margin);
      } else {
        throw new Error(`Unknown stacking direction: ${node.direction}`);
      }
    } else if (node instanceof Repeat) {
      // TODO
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
      const margin = node.bbox.margin;
      const g = container
        .append("g")
        .attr("class", node.classTag)
        .attr("transform", `translate(${x + margin.left}, ${y + margin.top})`);

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
    const g = container
      .append("g")
      .attr("class", node.classTag)
      .attr("transform", `translate(${x}, ${y})`);

    this.traverseTree(node, (n) => {
      const bbox = n.bbox;
      g.append("rect")
        .attr("x", bbox.outerRect().x)
        .attr("y", bbox.outerRect().y)
        .attr("width", bbox.outerRect().width)
        .attr("height", bbox.outerRect().height)
        .attr("fill", "none")
        .attr("stroke", "red")
        .attr("stroke-dasharray", "4 2");

      g.append("rect")
        .attr("x", bbox.contentRect().x)
        .attr("y", bbox.contentRect().y)
        .attr("width", bbox.contentRect().width)
        .attr("height", bbox.contentRect().height)
        .attr("fill", "none")
        .attr("stroke", "blue")
        .attr("stroke-dasharray", "4 2");
    });
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
      console.log(n);
      // console.log(n.classTag, n.bbox.contentRect(), n.bbox.outerRect());
    });
  }
}
