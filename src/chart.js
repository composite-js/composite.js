import {
  BarChartRenderer,
  GroupBarChartRenderer,
  StackBarChartRenderer,
} from "./mark/bar.js";
import { LineChartRenderer } from "./mark/line.js";
import { MatrixChartRenderer } from "./mark/matrix.js";
import { ScatterChartRenderer } from "./mark/scatter.js";
import { BoxPlotRenderer } from "./mark/box.js";
import { BubbleChartRenderer } from "./mark/bubble.js";
import { PieChartRenderer } from "./mark/pie.js";
import { FlowDiagramRenderer } from "./mark/flow.js";
import { StreamGraphRenderer } from "./mark/stream.js";
import { AxisRenderer } from "./axis.js";
import * as d3 from "d3";

/**
 * Base class for all charts.
 */
export class Chart {
  /**
   * Creates an instance of Chart.
   * @param {Object} options - The chart configuration options.
   */
  constructor(options = {}) {
    this.data = options.data || [];
    this.mark = options.mark || "bar";
    this.encoding = options.encoding || {};
    this.width = options.width || 400;
    this.height = options.height || 300;
    this.margin = options.margin || {
      top: 40,
      right: 40,
      bottom: 40,
      left: 40,
    };
    this.bbox = { x: 0, y: 0, width: 0, height: 0 };
    this.options = options;

    // Resolve padding
    const padding = options.padding || {};
    const defaultPaddingValue = this.mark === "matrix" ? 0 : 0.1;
    const defaultInner =
      padding.inner !== undefined ? padding.inner : defaultPaddingValue;
    const defaultOuter =
      padding.outer !== undefined ? padding.outer : defaultPaddingValue;

    this.padding = {
      ...padding,
      xInner: padding.xInner !== undefined ? padding.xInner : defaultInner,
      xOuter: padding.xOuter !== undefined ? padding.xOuter : defaultOuter,
      yInner: padding.yInner !== undefined ? padding.yInner : defaultInner,
      yOuter: padding.yOuter !== undefined ? padding.yOuter : defaultOuter,
    };

    this._createRenderer();
  }

  /**
   * Creates the appropriate renderer based on mark type.
   * @private
   */
  _createRenderer() {
    const rendererOptions = {
      ...this.options,
      encoding: this.encoding,
      width: this.width,
      height: this.height,
      margin: this.margin,
      padding: this.padding,
    };

    switch (this.mark) {
      case "bar":
        this.renderer = new BarChartRenderer(rendererOptions);
        break;
      case "stackbar":
        this.renderer = new StackBarChartRenderer(rendererOptions);
        break;
      case "groupbar":
        this.renderer = new GroupBarChartRenderer(rendererOptions);
        break;
      case "line":
        this.renderer = new LineChartRenderer(rendererOptions);
        break;
      case "matrix":
        this.renderer = new MatrixChartRenderer(rendererOptions);
        break;
      case "scatter":
        this.renderer = new ScatterChartRenderer(rendererOptions);
        break;
      case "box":
        this.renderer = new BoxPlotRenderer(rendererOptions);
        break;
      case "bubble":
        this.renderer = new BubbleChartRenderer(rendererOptions);
        break;
      case "pie":
        this.renderer = new PieChartRenderer(rendererOptions);
        break;
      case "flow":
        this.renderer = new FlowDiagramRenderer(rendererOptions);
        break;
      case "stream":
        this.renderer = new StreamGraphRenderer(rendererOptions);
        break;
      default:
        throw new Error(`Unsupported mark type: ${this.mark}`);
    }
  }

  /**
   * Gets the total width including margins.
   * @returns {number} Total width.
   */
  getTotalWidth() {
    return this.width + this.margin.left + this.margin.right;
  }

  /**
   * Gets the total height including margins.
   * @returns {number} Total height.
   */
  getTotalHeight() {
    return this.height + this.margin.top + this.margin.bottom;
  }

  /**
   * Renders the chart into the specified DOM container.
   * @param {HTMLElement} container - The container element.
   * @param {Object} [renderOptions] - Optional render overrides.
   */
  render(container, renderOptions = {}) {
    // Clear container
    container.innerHTML = "";

    // Merge margins: renderOptions.margin > options.margin > defaultMargin
    const defaultMargin = { top: 40, right: 40, bottom: 40, left: 40 };
    const currentMargin = {
      ...defaultMargin,
      ...this.margin,
      ...renderOptions.margin,
    };

    const currentWidth =
      renderOptions.width !== undefined ? renderOptions.width : this.width;
    const currentHeight =
      renderOptions.height !== undefined ? renderOptions.height : this.height;

    let svg;
    const isSvgContainer =
      typeof SVGElement !== "undefined" && container instanceof SVGElement;

    if (isSvgContainer) {
      svg = container;
    } else {
      svg = d3
        .create("svg")
        .attr("width", currentWidth + currentMargin.left + currentMargin.right)
        .attr(
          "height",
          currentHeight + currentMargin.top + currentMargin.bottom,
        )
        .node();
      container.appendChild(svg);
    }

    // Validate encoding (skip for marks that don't use x/y)
    const yField = this.encoding.y;
    const xField = this.encoding.x;

    if (
      this.mark !== "matrix" &&
      this.mark !== "pie" &&
      this.mark !== "flow" &&
      (!yField || !xField)
    ) {
      console.warn("Missing encoding configuration for x or y.");
      return;
    }

    // Update renderer with new options
    this.renderer.width = currentWidth;
    this.renderer.height = currentHeight;
    this.renderer.margin = currentMargin;

    // Render the mark
    const axisConfig = this.renderer.render(svg, this.data);

    // Draw axes using the config returned by mark renderers
    if (axisConfig) {
      const axisRenderer = new AxisRenderer(axisConfig.axisOptions);
      axisRenderer.render(svg, axisConfig.scales, axisConfig.dimensions);
    }
  }
}
