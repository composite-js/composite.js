import * as d3 from "d3";
import { drawAxes } from "../axis.js";

/**
 * Renders a scatter plot.
 * @param {SVGElement} svg - The SVG container.
 * @param {Array} data - The data to render.
 * @param {Object} options - Chart options.
 */
export function drawScatter(svg, data, options) {
  const {
    encoding = {},
    width = 400,
    height = 300,
    color = "steelblue",
    radius = 4,
    showXAxisLabel = true,
    showYAxisLabel = true,
    xAxisName = "",
    yAxisName = "",
    xAxisPos = "bottom",
    yAxisPos = "left",
  } = options;
  const container = d3.select(svg);

  const xField = encoding.x;
  const yField = encoding.y;

  const defaultMargin = { top: 40, right: 40, bottom: 40, left: 60 };
  const margin = options.margin || defaultMargin;

  const chartWidth = width;
  const chartHeight = height;

  // Scales
  const xExtent = d3.extent(data, (d) => d[xField]);
  const yExtent = d3.extent(data, (d) => d[yField]);

  const xScale = d3.scaleLinear().domain(xExtent).range([0, chartWidth]).nice();

  const yScale = d3
    .scaleLinear()
    .domain(yExtent)
    .range([chartHeight, 0])
    .nice();

  // Draw Points
  data.forEach((d) => {
    const cx = margin.left + xScale(d[xField]);
    const cy = margin.top + yScale(d[yField]);

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

  // Draw Axes
  drawAxes(
    svg,
    { x: xScale, y: yScale },
    { margin, width: chartWidth, height: chartHeight },
    {
      showXAxisLabel,
      showYAxisLabel,
      xAxisName,
      yAxisName,
      xAxisPos,
      yAxisPos,
    },
  );
}
