import * as d3 from "d3";
import { MarkRenderer } from "./mark.js";
import { continuousDomain, linearScale, xRange, yRange } from "./scale.js";

/**
 * Renderer for scatter plots.
 */
export class ScatterChartRenderer extends MarkRenderer {
  /**
   * Creates an instance of ScatterChartRenderer.
   * @param {Object} options - Chart options.
   */
  constructor(options = {}) {
    super(options);
    this.color = options.color || "steelblue";
    this.radius = options.radius || 4;
    this.showXAxis = options.showXAxis !== undefined ? options.showXAxis : true;
    this.showYAxis = options.showYAxis !== undefined ? options.showYAxis : true;
    this.xAxisName = options.xAxisName || "";
    this.yAxisName = options.yAxisName || "";
    this.xAxisPos = options.xAxisPos || "bottom";
    this.yAxisPos = options.yAxisPos || "left";
  }

  /**
   * Renders a scatter plot.
   * @param {SVGElement} svg - The SVG container.
   * @param {Array} data - The data to render.
   * @returns {Object} Axis configuration object.
   */
  render(svg, data) {
    const container = d3.select(svg);
    const xField = this.encoding.x;
    const yField = this.encoding.y;
    const margin = this.margin;
    const chartWidth = this.width;
    const chartHeight = this.height;

    const xScale = linearScale(
      continuousDomain(data, xField, this.encoding.xDomain),
      xRange(chartWidth),
      { nice: this.encoding.xDomain === undefined },
    );

    const yScale = linearScale(
      continuousDomain(data, yField, this.encoding.yDomain),
      yRange(chartHeight),
      { nice: this.encoding.yDomain === undefined },
    );

    // Draw Points
    data.forEach((d) => {
      const cx = margin.left + xScale(d[xField]);
      const cy = margin.top + yScale(d[yField]);

      const radius = this.radius;
      const color = this.color;
      const circle = container
        .append("circle")
        .attr("cx", cx)
        .attr("cy", cy)
        .attr("r", radius)
        .attr("fill", color)
        .attr("opacity", 0.7)
        .attr("stroke", "white")
        .attr("stroke-width", 1)
        .on("mouseenter", function () {
          d3.select(this)
            .attr("fill", "orange")
            .attr("r", radius * 1.5);
        })
        .on("mouseleave", function () {
          d3.select(this).attr("fill", color).attr("r", radius);
        });

      // Tooltip
      circle
        .append("title")
        .text(`x: ${d[xField].toFixed(2)}, y: ${d[yField].toFixed(2)}`);
    });

    return this.axisConfig(
      { x: xScale, y: yScale },
      { margin, width: chartWidth, height: chartHeight },
    );
  }
}
