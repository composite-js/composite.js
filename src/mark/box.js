import * as d3 from "d3";
import { MarkRenderer } from "./mark.js";
import {
  bandRange,
  bandScale,
  categoricalDomain,
  linearScale,
  scaleSpan,
  xRange,
  yRange,
} from "./scale.js";
import { inferXYOrientation } from "./orientation.js";

/**
 * Renderer for box plots.
 */
export class BoxPlotRenderer extends MarkRenderer {
  /**
   * Creates an instance of BoxPlotRenderer.
   * @param {Object} options - Chart options.
   */
  constructor(options = {}) {
    super(options);
    this.color = options.color || "steelblue";
    this.showXAxis = options.showXAxis !== undefined ? options.showXAxis : true;
    this.showYAxis = options.showYAxis !== undefined ? options.showYAxis : true;
    this.xAxisName = options.xAxisName || "";
    this.yAxisName = options.yAxisName || "";
    this.xAxisPos = options.xAxisPos || "bottom";
    this.yAxisPos = options.yAxisPos || "left";
    this.boxWidth = options.boxWidth !== undefined ? options.boxWidth : 0.6;
    this.whiskerStrokeDasharray = options.whiskerStrokeDasharray;
    this.valueRangePadding =
      options.valueRangePadding !== undefined ? options.valueRangePadding : 0;
    this.outlierFill =
      options.outlierFill !== undefined ? options.outlierFill : "none";
    this.outlierOpacity = options.outlierOpacity;
    this.padding = options.padding || {
      xInner: 0.1,
      xOuter: 0.1,
      yInner: 0.1,
      yOuter: 0.1,
    };
  }

  /**
   * Renders a box plot.
   * @param {SVGElement} svg - The SVG container.
   * @param {Array} data - The data to render.
   * @returns {Object} Axis configuration object.
   */
  render(svg, data) {
    const orientation = inferXYOrientation("box", data, this.encoding);

    return orientation.valueChannel === "x"
      ? this._renderHorizontal(svg, data)
      : this._renderVertical(svg, data);
  }

  /**
   * Renders horizontal box plot.
   * @private
   */
  _renderHorizontal(svg, data) {
    const container = d3.select(svg);
    const xField = this.encoding.x;
    const yField = this.encoding.y;
    const margin = this.margin;
    const chartWidth = this.width;
    const chartHeight = this.height;

    const categoryField = yField;
    const valueField = xField;

    const scaleCategories = categoricalDomain(
      data,
      categoryField,
      this.encoding.yDomain,
    );
    const groupedData = d3.group(data, (d) => d[categoryField]);

    const boxData = scaleCategories
      .filter((category) => groupedData.has(category))
      .map((category) => {
        const values = groupedData
          .get(category)
          .map((d) => d[valueField])
          .sort(d3.ascending);
        const q1 = d3.quantile(values, 0.25);
        const median = d3.quantile(values, 0.5);
        const q3 = d3.quantile(values, 0.75);
        const iqr = q3 - q1;
        const min = Math.max(d3.min(values), q1 - 1.5 * iqr);
        const max = Math.min(d3.max(values), q3 + 1.5 * iqr);
        const outliers = values.filter((v) => v < min || v > max);

        return {
          category,
          q1,
          median,
          q3,
          min,
          max,
          outliers,
        };
      });

    const valueExtent = [
      d3.min(boxData, (d) =>
        d.outliers.length > 0 ? Math.min(d.min, ...d.outliers) : d.min,
      ),
      d3.max(boxData, (d) =>
        d.outliers.length > 0 ? Math.max(d.max, ...d.outliers) : d.max,
      ),
    ];

    const reverseY = this.xAxisPos === "top";
    const yScale = bandScale(
      scaleCategories,
      bandRange(chartHeight, reverseY),
      {
        inner: this.padding.yInner,
        outer: this.padding.yOuter,
      },
    );

    const reverseX = this.yAxisPos === "right";
    const xDomain = this.encoding.xDomain || [0, valueExtent[1]];
    const xScale = linearScale(
      xDomain,
      reverseX
        ? [chartWidth - this.valueRangePadding, this.valueRangePadding]
        : [this.valueRangePadding, chartWidth - this.valueRangePadding],
      { nice: !this.encoding.xDomain },
    );

    const actualBoxHeight = yScale.bandwidth() * this.boxWidth;
    const boxOffset = (yScale.bandwidth() - actualBoxHeight) / 2;

    boxData.forEach((d) => {
      const y = margin.top + yScale(d.category);
      const centerY = y + yScale.bandwidth() / 2;

      const whiskerLine = container
        .append("line")
        .attr("x1", margin.left + xScale(d.min))
        .attr("x2", margin.left + xScale(d.max))
        .attr("y1", centerY)
        .attr("y2", centerY)
        .attr("stroke", "black")
        .attr("stroke-width", 1);
      if (this.whiskerStrokeDasharray !== undefined) {
        whiskerLine.attr("stroke-dasharray", this.whiskerStrokeDasharray);
      }

      const minCap = container
        .append("line")
        .attr("x1", margin.left + xScale(d.min))
        .attr("x2", margin.left + xScale(d.min))
        .attr("y1", y + boxOffset)
        .attr("y2", y + boxOffset + actualBoxHeight)
        .attr("stroke", "black")
        .attr("stroke-width", 1);
      if (this.whiskerStrokeDasharray !== undefined) {
        minCap.attr("stroke-dasharray", this.whiskerStrokeDasharray);
      }

      const maxCap = container
        .append("line")
        .attr("x1", margin.left + xScale(d.max))
        .attr("x2", margin.left + xScale(d.max))
        .attr("y1", y + boxOffset)
        .attr("y2", y + boxOffset + actualBoxHeight)
        .attr("stroke", "black")
        .attr("stroke-width", 1);
      if (this.whiskerStrokeDasharray !== undefined) {
        maxCap.attr("stroke-dasharray", this.whiskerStrokeDasharray);
      }

      const boxSpan = scaleSpan(xScale, d.q1, d.q3);
      const boxX = margin.left + boxSpan.position;
      const boxW = boxSpan.size;

      const rect = container
        .append("rect")
        .attr("x", boxX)
        .attr("y", y + boxOffset)
        .attr("width", boxW)
        .attr("height", actualBoxHeight)
        .attr("stroke", "black")
        .attr("stroke-width", 1)
        .attr("opacity", 0.8);

      this.applyFillHover(rect, this.color);

      rect
        .append("title")
        .text(
          `${d.category}\nQ1: ${d.q1.toFixed(2)}\nMedian: ${d.median.toFixed(2)}\nQ3: ${d.q3.toFixed(2)}\nMin: ${d.min.toFixed(2)}\nMax: ${d.max.toFixed(2)}`,
        );

      container
        .append("line")
        .attr("x1", margin.left + xScale(d.median))
        .attr("x2", margin.left + xScale(d.median))
        .attr("y1", y + boxOffset)
        .attr("y2", y + boxOffset + actualBoxHeight)
        .attr("stroke", "white")
        .attr("stroke-width", 2);

      d.outliers.forEach((outlier) => {
        const circle = container
          .append("circle")
          .attr("cx", margin.left + xScale(outlier))
          .attr("cy", centerY)
          .attr("r", 3)
          .attr("fill", this.outlierFill)
          .attr("stroke", this.color)
          .attr("stroke-width", 1.5);
        if (this.outlierOpacity !== undefined) {
          circle.attr("opacity", this.outlierOpacity);
        }
      });
    });

    return this.axisConfig(
      { x: xScale, y: yScale },
      { margin, width: chartWidth, height: chartHeight },
    );
  }

  /**
   * Renders vertical box plot.
   * @private
   */
  _renderVertical(svg, data) {
    const container = d3.select(svg);
    const xField = this.encoding.x;
    const yField = this.encoding.y;
    const margin = this.margin;
    const chartWidth = this.width;
    const chartHeight = this.height;

    const categoryField = xField;
    const valueField = yField;

    const scaleCategories = categoricalDomain(
      data,
      categoryField,
      this.encoding.xDomain,
    );
    const groupedData = d3.group(data, (d) => d[categoryField]);

    const boxData = scaleCategories
      .filter((category) => groupedData.has(category))
      .map((category) => {
        const values = groupedData
          .get(category)
          .map((d) => d[valueField])
          .sort(d3.ascending);
        const q1 = d3.quantile(values, 0.25);
        const median = d3.quantile(values, 0.5);
        const q3 = d3.quantile(values, 0.75);
        const iqr = q3 - q1;
        const min = Math.max(d3.min(values), q1 - 1.5 * iqr);
        const max = Math.min(d3.max(values), q3 + 1.5 * iqr);
        const outliers = values.filter((v) => v < min || v > max);

        return {
          category,
          q1,
          median,
          q3,
          min,
          max,
          outliers,
        };
      });

    const valueExtent = [
      d3.min(boxData, (d) =>
        d.outliers.length > 0 ? Math.min(d.min, ...d.outliers) : d.min,
      ),
      d3.max(boxData, (d) =>
        d.outliers.length > 0 ? Math.max(d.max, ...d.outliers) : d.max,
      ),
    ];

    const reverseX = this.xAxisPos === "top";
    const xScale = bandScale(scaleCategories, xRange(chartWidth, reverseX), {
      inner: this.padding.xInner,
      outer: this.padding.xOuter,
    });

    const reverseY = this.yAxisPos === "right";
    const yScale = linearScale(
      this.encoding.yDomain || valueExtent,
      yRange(chartHeight, reverseY),
      { nice: !this.encoding.yDomain },
    );

    const actualBoxWidth = xScale.bandwidth() * this.boxWidth;
    const boxOffset = (xScale.bandwidth() - actualBoxWidth) / 2;

    boxData.forEach((d) => {
      const x = margin.left + xScale(d.category);
      const centerX = x + xScale.bandwidth() / 2;

      const whiskerLine = container
        .append("line")
        .attr("x1", centerX)
        .attr("x2", centerX)
        .attr("y1", margin.top + yScale(d.min))
        .attr("y2", margin.top + yScale(d.max))
        .attr("stroke", "black")
        .attr("stroke-width", 1);
      if (this.whiskerStrokeDasharray !== undefined) {
        whiskerLine.attr("stroke-dasharray", this.whiskerStrokeDasharray);
      }

      const minCap = container
        .append("line")
        .attr("x1", x + boxOffset)
        .attr("x2", x + boxOffset + actualBoxWidth)
        .attr("y1", margin.top + yScale(d.min))
        .attr("y2", margin.top + yScale(d.min))
        .attr("stroke", "black")
        .attr("stroke-width", 1);
      if (this.whiskerStrokeDasharray !== undefined) {
        minCap.attr("stroke-dasharray", this.whiskerStrokeDasharray);
      }

      const maxCap = container
        .append("line")
        .attr("x1", x + boxOffset)
        .attr("x2", x + boxOffset + actualBoxWidth)
        .attr("y1", margin.top + yScale(d.max))
        .attr("y2", margin.top + yScale(d.max))
        .attr("stroke", "black")
        .attr("stroke-width", 1);
      if (this.whiskerStrokeDasharray !== undefined) {
        maxCap.attr("stroke-dasharray", this.whiskerStrokeDasharray);
      }

      const boxSpan = scaleSpan(yScale, d.q1, d.q3);
      const boxY = margin.top + boxSpan.position;
      const boxHeight = boxSpan.size;

      const rect = container
        .append("rect")
        .attr("x", x + boxOffset)
        .attr("y", boxY)
        .attr("width", actualBoxWidth)
        .attr("height", boxHeight)
        .attr("stroke", "black")
        .attr("stroke-width", 1)
        .attr("opacity", 0.8);

      this.applyFillHover(rect, this.color);

      rect
        .append("title")
        .text(
          `${d.category}\nQ1: ${d.q1.toFixed(2)}\nMedian: ${d.median.toFixed(2)}\nQ3: ${d.q3.toFixed(2)}\nMin: ${d.min.toFixed(2)}\nMax: ${d.max.toFixed(2)}`,
        );

      container
        .append("line")
        .attr("x1", x + boxOffset)
        .attr("x2", x + boxOffset + actualBoxWidth)
        .attr("y1", margin.top + yScale(d.median))
        .attr("y2", margin.top + yScale(d.median))
        .attr("stroke", "white")
        .attr("stroke-width", 2);

      d.outliers.forEach((outlier) => {
        const circle = container
          .append("circle")
          .attr("cx", centerX)
          .attr("cy", margin.top + yScale(outlier))
          .attr("r", 3)
          .attr("fill", this.outlierFill)
          .attr("stroke", this.color)
          .attr("stroke-width", 1.5);
        if (this.outlierOpacity !== undefined) {
          circle.attr("opacity", this.outlierOpacity);
        }
      });
    });

    return this.axisConfig(
      { x: xScale, y: yScale },
      { margin, width: chartWidth, height: chartHeight },
    );
  }
}
