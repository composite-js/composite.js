import * as d3 from "d3";
import { Chart } from "./chart";
import { BBox } from "./utils/bbox";

/**
 * Base class for layout nodes (charts, compositions, repeats).
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
   * Renders the layout node.
   * @param {HTMLElement} container - The container element.
   */
  render(container) {
    throw new Error("render method must be implemented by subclass");
  }
}

/**
 * Base class for all compositions (Stack, Repeat, etc.)
 */
export class Composition extends Node {
  constructor() {
    super();
    this.classTag = ""; // to identify composition type name, stated by subclass
  }
}

/**
 * Stack class for stacking charts (formerly Composition).
 */
export class Stack extends Composition {
  /**
   * Creates an instance of Stack.
   * @param {Array} charts - Array of chart instances.
   * @param {string} direction - Stacking direction ('horizontal' | 'vertical').
   * @param {Object} options - Composition options.
   */
  constructor(charts, direction, options = {}) {
    super();
    this.children = charts;
    this.direction = direction;
    this.internalConstraints = [];
    this.isStack = true;
    this.type = "stack";
    this.classTag = direction === "horizontal" ? "stackX" : "stackY";

    let margin = undefined;
    let align = [];

    options = options || {};
    margin = options.margin || 0;
    align = options.align || [];

    let alignedCharts = [];

    for (let i = 0; i < charts.length; i++) {
      const alignedChart =
        align[i] !== undefined && align[i] !== null ? align[i] : charts[i];

      if (
        !(alignedChart instanceof Chart) &&
        !(alignedChart instanceof Repeat)
      ) {
        throw new Error("Alignment targets must be charts or repeats");
      }

      alignedCharts.push(alignedChart);
    }

    this._syncPadding(alignedCharts, direction);

    for (let i = 0; i < charts.length - 1; i++) {
      const c1 = alignedCharts[i];
      const c2 = alignedCharts[i + 1];
      this.internalConstraints.push({
        type: "stack",
        charts: [c1, c2],
        direction,
        margin: margin,
      });
    }
  }

  /**
   * Gets all charts from a node (flattening compositions).
   * @private
   */
  _getAllCharts(node) {
    if (node instanceof Stack) {
      return node.flatten().charts;
    }
    return [node];
  }

  /**
   * Synchronizes padding across charts.
   * @private
   */
  _syncPadding(charts, direction) {
    // TODO: implement this!!!
  }

  /**
   * Flattens the composition tree.
   * @returns {Object} Object with charts and constraints arrays.
   */
  flatten() {
    let allCharts = [];
    let allConstraints = [...this.internalConstraints];

    this.children.forEach((c) => {
      if (c instanceof Stack) {
        const res = c.flatten();
        allCharts.push(...res.charts);
        allConstraints.push(...res.constraints);
      } else {
        allCharts.push(c);
      }
    });

    return { charts: [...new Set(allCharts)], constraints: allConstraints };
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
 * Creates a horizontal composition of charts.
 * @param {Array} charts - Array of chart instances.
 * @param {Object} options - Composition options.
 * @returns {Stack} A Stack instance.
 */
export function stackX(charts, options) {
  return new Stack(charts, "horizontal", options);
}

/**
 * Creates a vertical composition of charts.
 * @param {Array} charts - Array of chart instances.
 * @param {Object} options - Composition options.
 * @returns {Stack} A Stack instance.
 */
export function stackY(charts, options) {
  return new Stack(charts, "vertical", options);
}

/**
 * Base class for repeat compositions.
 */
export class Repeat extends Composition {
  /**
   * Creates an instance of Repeat.
   * @param {Array} domain - The list of categorical values.
   * @param {Function} func - A function that takes a value and returns a chart.
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
   * @param {Function} func - A function that takes a value and returns a chart.
   * @param {Object} options - Repeat options { paddingInner, paddingOuter }.
   */
  constructor(domain, func, options = {}) {
    super(domain, func, options);
    this.classTag = "repeatX";
  }

  /**
   * Renders the repeated charts.
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
      const chart = this.func(value);
      const g = gParent
        .append("g")
        .attr("transform", `translate(${xScale(value)}, 0)`);

      chart.render(g.node(), { width: bandwidth, height: height });
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
   * @param {Function} func - A function that takes a value and returns a chart.
   * @param {Object} options - Repeat options { paddingInner, paddingOuter }.
   */
  constructor(domain, func, options = {}) {
    super(domain, func, options);
    this.classTag = "repeatY";
  }

  /**
   * Renders the repeated charts.
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
      const chart = this.func(value);
      const g = gParent
        .append("g")
        .attr("transform", `translate(0, ${yScale(value)})`);

      chart.render(g.node(), { width: width, height: bandwidth });
    });
  }
}

/**
 * Layout calculator utility class.
 */
export class LayoutCalculator {
  /**
   * Calculates the margin required for a chart by actually rendering axes
   * and measuring their bounding boxes.
   * @param {Object} chart - The chart object.
   * @returns {Object} The calculated margin {top, right, bottom, left}.
   */
  static estimatemargin(chart) {
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
    } = chart.options;

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
   * Suggests width & height for a chart based on its data and configuration.
   * @param {Object} chart - The chart object.
   * @returns {Object} The suggested dimensions {width, height}.
   */
  static suggestWidthHeight(chart) {
    const { data, encoding, mark, direction } = chart.options;
    const defaultWidth = 400;
    const defaultHeight = 300;

    if (chart.isRepeat) {
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
  static _normalizeMargin(margin) {
    return {
      top: margin?.top || 0,
      right: margin?.right || 0,
      bottom: margin?.bottom || 0,
      left: margin?.left || 0,
    };
  }

  static _translateBBox(bbox, dx, dy) {
    if (!(bbox instanceof BBox)) {
      throw new TypeError("_translateBBox(bbox): bbox must be a BBox");
    }

    const translated = new BBox(
      bbox.content.x + dx,
      bbox.content.y + dy,
      bbox.content.width,
      bbox.content.height,
    );
    translated.margin = this._normalizeMargin(bbox.margin);
    return translated;
  }

  /**
   * Helper to find the relative layout position of a target node within a computed tree.
   * @param {Object} computedNode - The current computed node to search within.
   * @param {Node} targetNode - The target node to find.
   * @returns {Object|null} The layout box {x, y, width, height} relative to computedNode, or null.
   */
  static findNodeLayout(computedNode, targetNode) {
    if (computedNode.node === targetNode) {
      if (computedNode.bbox instanceof BBox) {
        return {
          x: computedNode.bbox.content.x,
          y: computedNode.bbox.content.y,
          width: computedNode.bbox.content.width,
          height: computedNode.bbox.content.height,
        };
      }

      // Back-compat fallback if bbox is a plain rect
      if (computedNode.bbox && computedNode.bbox.width !== undefined) {
        return { ...computedNode.bbox };
      }

      return {
        x: 0,
        y: 0,
        width: computedNode.width,
        height: computedNode.height,
      };
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

  /**
   * Recursively computes the dimensions and positions of the layout tree.
   * @param {Node} node - The layout node.
   * @returns {Object} Computed layout node with dimensions and children positions.
   */
  static computeLayout(node) {
    if (node instanceof Stack) {
      const childrenNodes = node.children.map((child) =>
        this.computeLayout(child),
      );

      if (childrenNodes.length === 0) {
        throw new Error("Invalid: composition node has no children.");
      }

      // Initialize children positions
      childrenNodes.forEach((c) => {
        c.x = 0;
        c.y = 0;
      });

      const constraints = node.internalConstraints || [];
      const isVertical = node.direction === "vertical";

      // 1. Stack along main axis with gaps
      let currentPos = 0;
      for (let i = 0; i < childrenNodes.length; i++) {
        const child = childrenNodes[i];

        if (!(child.node.bbox instanceof BBox)) {
          throw new Error("Invalid layout tree: child.bbox must be a BBox");
        }

        const childOuter = child.node.bbox.outerRect();

        if (isVertical) {
          child.y = currentPos;
        } else {
          child.x = currentPos;
        }

        // Determine gap after this child
        let gap = 0;
        // Check constraint associated with this gap (between i and i+1)
        if (i < childrenNodes.length - 1) {
          const constraint = constraints[i];
          if (constraint && constraint.margin !== undefined) {
            gap = constraint.margin;
          }
        }

        if (isVertical) {
          currentPos += childOuter.height + gap;
        } else {
          currentPos += childOuter.width + gap;
        }
      }

      // 2. Align along cross axis using constraints
      // Propagate alignment offsets
      for (let i = 0; i < childrenNodes.length - 1; i++) {
        const constraint = constraints[i];
        if (!constraint) continue;

        const [t1, t2] = constraint.charts;
        // Find layout relative to the respective child root
        const layout1 = this.findNodeLayout(childrenNodes[i], t1);
        const layout2 = this.findNodeLayout(childrenNodes[i + 1], t2);

        if (layout1 && layout2) {
          if (isVertical) {
            // Align Horizontally (X)
            // We want child[i].x + layout1.x === child[i+1].x + layout2.x
            // child[i+1].x = child[i].x + layout1.x - layout2.x
            const diff = layout1.x - layout2.x;
            childrenNodes[i + 1].x = childrenNodes[i].x + diff;
          } else {
            // Align Vertically (Y)
            const diff = layout1.y - layout2.y;
            childrenNodes[i + 1].y = childrenNodes[i].y + diff;
          }
        }
      }

      // 3. Normalize positions so the union outerRect starts at (0,0)
      const minOuterX = Math.min(
        ...childrenNodes.map((c) => (c.x || 0) + c.node.bbox.outerRect().x),
      );
      const minOuterY = Math.min(
        ...childrenNodes.map((c) => (c.y || 0) + c.node.bbox.outerRect().y),
      );

      childrenNodes.forEach((c) => {
        c.x = (c.x || 0) - minOuterX;
        c.y = (c.y || 0) - minOuterY;
      });

      // 4. Compute union bbox using BBox.union()
      let unionBBox = null;
      for (const child of childrenNodes) {
        const placed = this._translateBBox(
          child.node.bbox,
          child.x || 0,
          child.y || 0,
        );
        unionBBox = unionBBox ? unionBBox.union(placed) : placed;
      }

      if (!unionBBox) {
        throw new Error("Invalid: composition node has no children.");
      }

      const outer = unionBBox.outerRect();

      // Ensure the composition's bbox outerRect origin is (0,0)
      if (outer.x !== 0 || outer.y !== 0) {
        childrenNodes.forEach((c) => {
          c.x = (c.x || 0) - outer.x;
          c.y = (c.y || 0) - outer.y;
        });
        unionBBox = this._translateBBox(unionBBox, -outer.x, -outer.y);
      }

      node.bbox = unionBBox;

      return {
        type: "composition",
        node,
        children: childrenNodes,
      };
    } else {
      const margin = LayoutCalculator.estimatemargin(node);
      let w = node.options.width;
      let h = node.options.height;

      if (w === undefined || h === undefined) {
        const suggested = LayoutCalculator.suggestWidthHeight(node);
        if (w === undefined) w = suggested.width;
        if (h === undefined) h = suggested.height;
      }

      const normalizedMargin = this._normalizeMargin(margin);
      const bbox = new BBox(0, 0, w, h);
      bbox.setMargin(normalizedMargin);
      node.bbox = bbox;

      return {
        type: "leaf",
        node,
      };
    }
  }

  /**
   * Recursively renders the layout tree.
   * @param {Object} computedNode - The computed layout node.
   * @param {d3.Selection} container - The SVG container selection.
   * @param {number} x - X position.
   * @param {number} y - Y position.
   */
  static renderTree(computedNode, container, x, y) {
    if (computedNode.type === "leaf") {
      const { node } = computedNode;
      const margin = this._normalizeMargin(node.bbox.margin);
      const g = container
        .append("g")
        .attr("class", node.classTag || "leaf")
        .attr("transform", `translate(${x + margin.left}, ${y + margin.top})`);

      node.render(g.node(), {
        width: node.bbox.content.width,
        height: node.bbox.content.height,
        margin: margin,
      });
    } else {
      const { node } = computedNode;
      const group = container
        .append("g")
        .attr("class", `${node.classTag}`)
        .attr("transform", `translate(${x}, ${y})`);

      computedNode.children.forEach((child) => {
        this.renderTree(child, group, child.x, child.y);
      });
    }
  }

  /**
   * Composes multiple charts into a single layout.
   * @param {Node} root - The root composition node.
   * @param {HTMLElement} container - The container element.
   */
  static layout(root, container) {
    container.innerHTML = "";

    const computedTree = this.computeLayout(root);
    const outer = computedTree.node.bbox.outerRect();

    const svg = d3
      .select(container)
      .append("svg")
      .attr("width", outer.width)
      .attr("height", outer.height);

    this.renderTree(computedTree, svg, 0, 0);
  }
}
