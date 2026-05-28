import * as d3 from "d3";
import { MarkRenderer } from "./mark.js";
import {
  categoricalDomain,
  continuousDomain,
  linearScale,
  xRange,
  yRange,
} from "./scale.js";

/**
 * Renderer for bubble charts.
 */
export class BubbleChartRenderer extends MarkRenderer {
  /**
   * Creates an instance of BubbleChartRenderer.
   * @param {Object} options - Chart options.
   */
  constructor(options = {}) {
    super(options);
    this.color = options.color || "steelblue";
    this.maxRadius = options.maxRadius !== undefined ? options.maxRadius : 10;
    this.showXAxis = options.showXAxis !== undefined ? options.showXAxis : true;
    this.showYAxis = options.showYAxis !== undefined ? options.showYAxis : true;
    this.xAxisName = options.xAxisName || "";
    this.yAxisName = options.yAxisName || "";
    this.xAxisPos = options.xAxisPos || "bottom";
    this.yAxisPos = options.yAxisPos || "left";
    this.padding = options.padding !== undefined ? options.padding : 0.1;
  }

  /**
   * Renders a bubble chart.
   * @param {SVGElement} svg - The SVG container.
   * @param {Array} data - The data to render.
   * @returns {Object} Axis configuration object.
   */
  render(svg, data) {
    const container = d3.select(svg);
    const xField = this.encoding.x;
    const yField = this.encoding.y;
    const sizeField = this.encoding.size;
    const margin = this.margin;
    const chartWidth = this.width;
    const chartHeight = this.height;

    container.selectAll("*").remove();
    const _g = container
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const reverseX = this.xAxisPos === "top";
    const reverseY = this.yAxisPos === "right";

    const xIsCategorical = typeof data[0][xField] === "string";
    let xScale;
    if (xIsCategorical) {
      const domain = categoricalDomain(data, xField, this.encoding.xDomain);
      xScale = d3
        .scaleBand()
        .domain(domain)
        .range(xRange(chartWidth, reverseX))
        .padding(this.padding);
    } else {
      xScale = linearScale(
        continuousDomain(data, xField, this.encoding.xDomain, {
          padRatio: 0.05,
        }),
        xRange(chartWidth, reverseX),
      );
    }

    const yIsCategorical = typeof data[0][yField] === "string";
    let yScale;
    if (yIsCategorical) {
      const domain = categoricalDomain(data, yField, this.encoding.yDomain);
      yScale = d3
        .scaleBand()
        .domain(domain)
        .range(yRange(chartHeight, reverseY))
        .padding(this.padding);
    } else {
      yScale = linearScale(
        continuousDomain(data, yField, this.encoding.yDomain, {
          padRatio: 0.05,
        }),
        yRange(chartHeight, reverseY),
      );
    }

    let rScale;
    if (sizeField) {
      const sizeExtent = d3.extent(data, (d) => d[sizeField]);
      rScale = d3
        .scaleSqrt()
        .domain([0, sizeExtent[1]])
        .range([0, this.maxRadius]);
    }

    data.forEach((d, index) => {
      const cx =
        margin.left +
        (xIsCategorical
          ? xScale(d[xField]) + xScale.bandwidth() / 2
          : xScale(d[xField]));
      const cy =
        margin.top +
        (yIsCategorical
          ? yScale(d[yField]) + yScale.bandwidth() / 2
          : yScale(d[yField]));
      const r = sizeField ? rScale(d[sizeField]) : 5;

      const circle = this.renderStyledCircle({
        container,
        centerX: cx,
        centerY: cy,
        radius: r,
        left: cx - r,
        top: cy - r,
        width: r * 2,
        height: r * 2,
        value: sizeField ? d[sizeField] : undefined,
        datum: d,
        index,
        orientation: "point",
        role: "bubble",
        fill: this.color,
        opacity: 0.7,
        stroke: "white",
        strokeWidth: 1,
      });

      this.applyFillHover(circle, this.color);

      circle
        .append("title")
        .text(
          `${xField}: ${d[xField]}, ${yField}: ${d[yField]}${sizeField ? `, ${sizeField}: ${d[sizeField]}` : ""}`,
        );
    });

    return this.axisConfig(
      { x: xScale, y: yScale },
      { margin, width: chartWidth, height: chartHeight },
    );
  }
}
