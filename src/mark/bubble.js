import * as d3 from "d3";
import { MarkRenderer } from "./mark.js";

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
      const domain = this.encoding.xDomain || data.map((d) => d[xField]);
      xScale = d3
        .scaleBand()
        .domain(domain)
        .range(reverseX ? [chartWidth, 0] : [0, chartWidth])
        .padding(this.padding);
    } else {
      let domain = this.encoding.xDomain;
      if (!domain) {
        const xExtent = d3.extent(data, (d) => d[xField]);
        const xPadding = (xExtent[1] - xExtent[0]) * 0.05 || 1;
        domain = [xExtent[0] - xPadding, xExtent[1] + xPadding];
      }
      xScale = d3
        .scaleLinear()
        .domain(domain)
        .range(reverseX ? [chartWidth, 0] : [0, chartWidth]);
    }

    const yIsCategorical = typeof data[0][yField] === "string";
    let yScale;
    if (yIsCategorical) {
      const domain = this.encoding.yDomain || data.map((d) => d[yField]);
      yScale = d3
        .scaleBand()
        .domain(domain)
        .range(reverseY ? [0, chartHeight] : [chartHeight, 0])
        .padding(this.padding);
    } else {
      let domain = this.encoding.yDomain;
      if (!domain) {
        const yExtent = d3.extent(data, (d) => d[yField]);
        const yPadding = (yExtent[1] - yExtent[0]) * 0.05 || 1;
        domain = [yExtent[0] - yPadding, yExtent[1] + yPadding];
      }
      yScale = d3
        .scaleLinear()
        .domain(domain)
        .range(reverseY ? [0, chartHeight] : [chartHeight, 0]);
    }

    let rScale;
    if (sizeField) {
      const sizeExtent = d3.extent(data, (d) => d[sizeField]);
      rScale = d3
        .scaleSqrt()
        .domain([0, sizeExtent[1]])
        .range([0, this.maxRadius]);
    }

    data.forEach((d) => {
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

      const circle = container
        .append("circle")
        .attr("cx", cx)
        .attr("cy", cy)
        .attr("r", r)
        .attr("opacity", 0.7)
        .attr("stroke", "white")
        .attr("stroke-width", 1);

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
