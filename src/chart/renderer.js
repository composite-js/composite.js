import * as d3 from "d3";
import {
  normalizeMarkStyle,
  renderStyledCircle,
  renderStyledRect,
  renderStyledSector,
} from "./style.js";
import { validateChartConfig } from "./validation.js";

/**
 * Base class for chart renderers.
 */
export class ChartRenderer {
  /**
   * Creates an instance of ChartRenderer.
   * @param {Object} options - Chart options.
   */
  constructor(options = {}) {
    this.options = options;
    this.mark = options.mark || "";
    this.encoding = options.encoding || {};
    this.width = options.width ?? 400;
    this.height = options.height ?? 300;
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
    this.xTickFormat = options.xTickFormat;
    this.yTickFormat = options.yTickFormat;
    this.xTickCount = options.xTickCount;
    this.yTickCount = options.yTickCount;
    this.showXGrid = options.showXGrid === true;
    this.showYGrid = options.showYGrid === true;
    this.markStyle = normalizeMarkStyle(options.markStyle);
  }

  validate(data = this.options.data) {
    if (!this.options.mark) return;

    validateChartConfig({
      ...this.options,
      data,
      encoding: this.encoding,
    });
  }

  getAxisOptions() {
    return {
      showXAxis: this.showXAxis,
      showYAxis: this.showYAxis,
      xAxisName: this.xAxisName,
      yAxisName: this.yAxisName,
      xAxisPos: this.xAxisPos,
      yAxisPos: this.yAxisPos,
      xTickFormat: this.xTickFormat,
      yTickFormat: this.yTickFormat,
      xTickCount: this.xTickCount,
      yTickCount: this.yTickCount,
      showXGrid: this.showXGrid,
      showYGrid: this.showYGrid,
    };
  }

  axisConfig(scales, dimensions, extras = {}) {
    return {
      scales,
      dimensions,
      axisOptions: this.getAxisOptions(),
      ...extras,
    };
  }

  rectLinkAnchor(datum, xField, yField, x, y, width, height) {
    const centerX = x + width / 2;
    const centerY = y + height / 2;

    return {
      x: datum[xField],
      y: datum[yField],
      left: { x, y: centerY },
      right: { x: x + width, y: centerY },
      top: { x: centerX, y },
      bottom: { x: centerX, y: y + height },
    };
  }

  applyFillHover(selection, normalFill, hoverFill = "orange") {
    const setFill = (node, fill) => {
      const selected = d3.select(node).attr("fill", fill);

      if (node.getAttribute("data-mark-style") !== "sketch") return;

      node.querySelectorAll("path").forEach((path) => {
        if (path.getAttribute("data-sketch-fill") !== "true") return;

        const pathSelection = d3.select(path);
        if (path.getAttribute("stroke") !== "none") {
          pathSelection.attr("stroke", fill);
        }
        if (path.getAttribute("fill") !== "none") {
          pathSelection.attr("fill", fill);
        }
      });

      return selected;
    };

    return selection
      .each(function () {
        setFill(this, normalFill);
      })
      .attr("fill", normalFill)
      .on("mouseenter", function () {
        setFill(this, hoverFill);
      })
      .on("mouseleave", function () {
        setFill(this, normalFill);
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

  styleContext(context) {
    return {
      mark: this.mark,
      encoding: this.encoding,
      styleOptions: this.markStyle.options,
      ...context,
    };
  }

  renderStyledRect(context) {
    return renderStyledRect(this.markStyle, this.styleContext(context));
  }

  renderStyledCircle(context) {
    return renderStyledCircle(this.markStyle, this.styleContext(context));
  }

  renderStyledSector(context) {
    return renderStyledSector(this.markStyle, this.styleContext(context));
  }

  /**
   * Renders the chart. Must be implemented by subclasses.
   * @param {SVGElement} svg - The SVG container.
   * @param {Array} data - The data to render.
   * @returns {Object|null} Axis configuration object or null.
   */
  render(svg, data) {
    void svg;
    void data;
    throw new Error("render method must be implemented by subclass");
  }
}
