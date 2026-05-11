import * as d3 from "d3";

/**
 * Base class for mark renderers.
 */
export class MarkRenderer {
  /**
   * Creates an instance of MarkRenderer.
   * @param {Object} options - Chart options.
   */
  constructor(options = {}) {
    this.options = options;
    this.encoding = options.encoding || {};
    this.width = options.width || 400;
    this.height = options.height || 300;
    this.margin = options.margin || {
      top: 40,
      right: 40,
      bottom: 40,
      left: 40,
    };
    this.showXAxis = options.showXAxis !== undefined ? options.showXAxis : true;
    this.showYAxis = options.showYAxis !== undefined ? options.showYAxis : true;
    this.xAxisName = options.xAxisName || "";
    this.yAxisName = options.yAxisName || "";
    this.xAxisPos = options.xAxisPos || "bottom";
    this.yAxisPos = options.yAxisPos || "left";
  }

  getAxisOptions() {
    return {
      showXAxis: this.showXAxis,
      showYAxis: this.showYAxis,
      xAxisName: this.xAxisName,
      yAxisName: this.yAxisName,
      xAxisPos: this.xAxisPos,
      yAxisPos: this.yAxisPos,
    };
  }

  axisConfig(scales, dimensions) {
    return {
      scales,
      dimensions,
      axisOptions: this.getAxisOptions(),
    };
  }

  applyFillHover(selection, normalFill, hoverFill = "orange") {
    return selection
      .attr("fill", normalFill)
      .on("mouseenter", function () {
        d3.select(this).attr("fill", hoverFill);
      })
      .on("mouseleave", function () {
        d3.select(this).attr("fill", normalFill);
      });
  }

  applyOpacityHover(selection, hoverOpacity = 0.7, normalOpacity = 1) {
    return selection
      .on("mouseenter", function () {
        d3.select(this).attr("opacity", hoverOpacity);
      })
      .on("mouseleave", function () {
        d3.select(this).attr("opacity", normalOpacity);
      });
  }

  /**
   * Renders the chart. Must be implemented by subclasses.
   * @param {SVGElement} svg - The SVG container.
   * @param {Array} data - The data to render.
   * @returns {Object|null} Axis configuration object or null.
   */
  render(svg, data) {
    throw new Error("render method must be implemented by subclass");
  }
}
