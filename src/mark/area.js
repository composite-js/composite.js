import * as d3 from "d3";
import { MarkRenderer } from "./mark.js";

/**
 * Renderer for area charts.
 */
export class AreaChartRenderer extends MarkRenderer {
  /**
   * Creates an instance of AreaChartRenderer.
   * @param {Object} options - Chart options.
   */
  constructor(options = {}) {
    super(options);
    this.color = options.color || "steelblue";
    this.fillOpacity =
      options.fillOpacity !== undefined ? options.fillOpacity : 0.25;
    this.strokeWidth =
      options.strokeWidth !== undefined ? options.strokeWidth : 2;
    this.showPoints =
      options.showPoints !== undefined ? options.showPoints : true;
  }

  /**
   * Renders an area chart.
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
    const values = [...data].sort(
      (a, b) => Number(a[xField]) - Number(b[xField]),
    );

    container.selectAll("*").remove();
    const g = container
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const xExtent = d3.extent(values, (d) => Number(d[xField]));
    const yMax = d3.max(values, (d) => Number(d[yField])) || 0;

    const xScale = d3
      .scaleLinear()
      .domain(this.encoding.xDomain || xExtent || [0, 1])
      .range([0, chartWidth]);

    const yScale = d3
      .scaleLinear()
      .domain(this.encoding.yDomain || [0, yMax])
      .range([chartHeight, 0]);

    const area = d3
      .area()
      .x((d) => xScale(Number(d[xField])))
      .y0(yScale(0))
      .y1((d) => yScale(Number(d[yField])));

    const line = d3
      .line()
      .x((d) => xScale(Number(d[xField])))
      .y((d) => yScale(Number(d[yField])));

    g.append("path")
      .datum(values)
      .attr("d", area)
      .attr("fill", this.color)
      .attr("fill-opacity", this.fillOpacity);

    g.append("path")
      .datum(values)
      .attr("d", line)
      .attr("fill", "none")
      .attr("stroke", this.color)
      .attr("stroke-width", this.strokeWidth);

    if (this.showPoints) {
      values.forEach((d) => {
        const xValue = Number(d[xField]);
        const yValue = Number(d[yField]);
        const circle = container
          .append("circle")
          .attr("cx", margin.left + xScale(xValue))
          .attr("cy", margin.top + yScale(yValue))
          .attr("r", 4)
          .attr("fill", "white")
          .attr("stroke", this.color)
          .attr("stroke-width", "2")
          .on("mouseenter", function () {
            d3.select(this).attr("fill", "orange").attr("r", 6);
          })
          .on("mouseleave", function () {
            d3.select(this).attr("fill", "white").attr("r", 4);
          });

        circle.append("title").text(`${xValue}: ${yValue}`);
      });
    }

    return this.axisConfig(
      { x: xScale, y: yScale },
      { margin, width: chartWidth, height: chartHeight },
    );
  }
}
