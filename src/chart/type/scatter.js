import * as d3 from "d3";
import { ChartRenderer } from "../renderer.js";
import { continuousDomain, linearScale, xRange, yRange } from "../scale.js";

/**
 * Renderer for scatter plots.
 */
export class ScatterChartRenderer extends ChartRenderer {
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
    const reverseX = this.xAxisPos === "top";
    const reverseY = this.yAxisPos === "right";

    const xScale = linearScale(
      continuousDomain(data, xField, this.encoding.xDomain),
      xRange(chartWidth, reverseX),
      { nice: this.encoding.xDomain === undefined },
    );

    const yScale = linearScale(
      continuousDomain(data, yField, this.encoding.yDomain),
      yRange(chartHeight, reverseY),
      { nice: this.encoding.yDomain === undefined },
    );
    const anchors = [];

    // Draw Points
    data.forEach((d, index) => {
      const cx = margin.left + xScale(d[xField]);
      const cy = margin.top + yScale(d[yField]);

      const radius = this.radius;
      const color = this.color;
      const circle = this.renderStyledCircle({
        container,
        centerX: cx,
        centerY: cy,
        radius,
        left: cx - radius,
        top: cy - radius,
        width: radius * 2,
        height: radius * 2,
        value: d[yField],
        datum: d,
        index,
        orientation: "point",
        role: "point",
        fill: color,
        opacity: 0.7,
        stroke: "white",
        strokeWidth: 1,
      });
      if (circle.node()?.tagName === "circle") {
        circle
          .on("mouseenter", function () {
            d3.select(this)
              .attr("fill", "orange")
              .attr("r", radius * 1.5);
          })
          .on("mouseleave", function () {
            d3.select(this).attr("fill", color).attr("r", radius);
          });
      } else {
        this.applyFillHover(circle, color);
      }
      anchors.push(
        this.rectLinkAnchor(
          d,
          xField,
          yField,
          cx - radius,
          cy - radius,
          radius * 2,
          radius * 2,
        ),
      );

      // Tooltip
      circle
        .append("title")
        .text(`x: ${d[xField].toFixed(2)}, y: ${d[yField].toFixed(2)}`);
    });

    return this.axisConfig(
      { x: xScale, y: yScale },
      { margin, width: chartWidth, height: chartHeight },
      { linkAnchors: { channels: ["x", "y"], anchors } },
    );
  }
}
