import * as d3 from "d3";
import { MarkRenderer } from "./mark.js";

/**
 * Renderer for line charts.
 */
export class LineChartRenderer extends MarkRenderer {
  /**
   * Creates an instance of LineChartRenderer.
   * @param {Object} options - Chart options.
   */
  constructor(options = {}) {
    super(options);
    this.showXAxis = options.showXAxis !== undefined ? options.showXAxis : true;
    this.showYAxis = options.showYAxis !== undefined ? options.showYAxis : true;
    this.xAxisName = options.xAxisName || "";
    this.yAxisName = options.yAxisName || "";
    this.xAxisPos = options.xAxisPos || "bottom";
    this.yAxisPos = options.yAxisPos || "left";
  }

  /**
   * Renders a line chart.
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

    container.selectAll("*").remove();
    const g = container
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const maxValue = Math.max(...data.map((d) => d[yField] || 0));

    const xScale = d3
      .scalePoint()
      .domain(data.map((d) => d[xField]))
      .range([0, chartWidth])
      .padding(0.5);

    const yScale = d3
      .scaleLinear()
      .domain([0, maxValue])
      .range([chartHeight, 0]);

    // Helper functions for coordinates
    const getX = (val) => margin.left + xScale(val);
    const getY = (val) => margin.top + yScale(val);

    const points = [];
    data.forEach((d) => {
      const value = d[yField];
      const x = getX(d[xField]);
      const y = getY(value);
      points.push({ x, y, value, label: d[xField] });
    });

    // Generate path data
    const line = d3
      .line()
      .x((d) => xScale(d[xField]))
      .y((d) => yScale(d[yField]));

    // Draw line path
    g.append("path")
      .datum(data)
      .attr("d", line)
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", "2");

    // Draw data points
    points.forEach((p) => {
      const circle = container
        .append("circle")
        .attr("cx", p.x)
        .attr("cy", p.y)
        .attr("r", 4)
        .attr("fill", "white")
        .attr("stroke", "steelblue")
        .attr("stroke-width", "2")
        .on("mouseenter", function () {
          d3.select(this).attr("fill", "orange").attr("r", 6);
        })
        .on("mouseleave", function () {
          d3.select(this).attr("fill", "white").attr("r", 4);
        });

      circle.append("title").text(`${p.label}: ${p.value}`);
    });

    return {
      scales: { x: xScale, y: yScale },
      dimensions: { margin, width: chartWidth, height: chartHeight },
      axisOptions: {
        showXAxis: this.showXAxis,
        showYAxis: this.showYAxis,
        xAxisName: this.xAxisName,
        yAxisName: this.yAxisName,
        xAxisPos: this.xAxisPos,
        yAxisPos: this.yAxisPos,
      },
    };
  }
}
