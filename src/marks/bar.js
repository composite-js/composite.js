import * as d3 from "d3";
import { drawAxes } from "../axis.js";

/**
 * Renders a bar chart.
 * @param {SVGElement} svg - The SVG container.
 * @param {Array} data - The data to render.
 * @param {Object} options - Chart options.
 */
export function drawBarChart(svg, data, options) {
  const {
    encoding = {},
    width = 400,
    height = 300,
    direction = "vertical", // 'vertical' | 'horizontal'
    color = "steelblue",
    showLabels = false, // Show value labels on bars
    showXAxisLabel = true, // Show X axis labels
    showYAxisLabel = true, // Show Y axis labels
    xAxisName = "", // Label for X axis
    yAxisName = "", // Label for Y axis
    xAxisPos = "bottom", // 'top' | 'bottom'
    yAxisPos = "left", // 'left' | 'right'
    padding = 0.2, // Padding between bars
  } = options;
  const container = d3.select(svg);

  const xField = encoding.x;
  const yField = encoding.y;
  const defaultMargin = { top: 40, right: 40, bottom: 40, left: 40 };
  const margin = options.margin || defaultMargin;

  const chartWidth = width;
  const chartHeight = height;

  if (direction === "horizontal") {
    const maxValue = Math.max(...data.map((d) => d[xField] || 0));

    const yScale = d3
      .scaleBand()
      .domain(data.map((d) => d[yField]))
      .range([0, chartHeight])
      .padding(padding);

    // Reverse x scale if xAxisPos is 'right' (grow right-to-left)
    const reverseX = yAxisPos === "right";
    const xScale = d3
      .scaleLinear()
      .domain([0, maxValue])
      .range(reverseX ? [chartWidth, 0] : [0, chartWidth]);

    data.forEach((d) => {
      const value = d[xField];
      const barWidth = Math.abs(xScale(value) - xScale(0));
      const barHeight = yScale.bandwidth();

      const x = margin.left + (reverseX ? xScale(value) : xScale(0));
      const y = margin.top + yScale(d[yField]);

      const rect = container
        .append("rect")
        .attr("x", x)
        .attr("y", y)
        .attr("width", barWidth)
        .attr("height", barHeight)
        .attr("fill", color)
        .on("mouseenter", function () {
          d3.select(this).attr("fill", "orange");
        })
        .on("mouseleave", function () {
          d3.select(this).attr("fill", color);
        });

      // Tooltip
      rect.append("title").text(`${d[yField]}: ${value}`);

      // Value Labels
      if (showLabels) {
        const label = container
          .append("text")
          .attr("y", y + barHeight / 2 + 4)
          .attr("font-size", "12px")
          .text(value);

        if (reverseX) {
          label.attr("x", x - 5).attr("text-anchor", "end");
        } else {
          label.attr("x", x + barWidth + 5).attr("text-anchor", "start");
        }
      }
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
  } else {
    // Vertical Bar Chart: x=category, y=value
    const maxValue = Math.max(...data.map((d) => d[yField] || 0));

    // Reverse x scale if xAxisPos is 'top'
    const reverseX = xAxisPos === "top";
    const xScale = d3
      .scaleBand()
      .domain(data.map((d) => d[xField]))
      .range(reverseX ? [chartWidth, 0] : [0, chartWidth])
      .padding(padding);

    // Reverse y scale if yAxisPos is 'right'
    const reverseY = yAxisPos === "right";
    const yScale = d3
      .scaleLinear()
      .domain([0, maxValue])
      .range(reverseY ? [0, chartHeight] : [chartHeight, 0]);

    data.forEach((d) => {
      const value = d[yField];
      const barWidth = xScale.bandwidth();
      const barHeight = chartHeight - yScale(value);

      const x = margin.left + xScale(d[xField]);
      const y = margin.top + yScale(value);

      const rect = container
        .append("rect")
        .attr("x", x)
        .attr("y", y)
        .attr("width", barWidth)
        .attr("height", barHeight)
        .attr("fill", color)
        .on("mouseenter", function () {
          d3.select(this).attr("fill", "orange");
        })
        .on("mouseleave", function () {
          d3.select(this).attr("fill", color);
        });

      // Tooltip
      rect.append("title").text(`${d[xField]}: ${value}`);

      // Value Labels
      if (showLabels) {
        container
          .append("text")
          .attr("x", x + barWidth / 2)
          .attr("y", y - 5)
          .attr("text-anchor", "middle")
          .attr("font-size", "12px")
          .text(value);
      }
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
}
