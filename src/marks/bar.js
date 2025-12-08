import * as d3 from "d3";

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
    reverse = false, // For horizontal: grow right-to-left
    showLabels = false, // Show value labels on bars
    yAxisAlign = "left", // 'left' | 'right' for horizontal chart labels
    hideAxisLabels = false, // Hide category labels
    yAxisLabel = "", // Label for Y axis
  } = options;
  const container = d3.select(svg);

  const xField = encoding.x;
  const yField = encoding.y;

  const defaultMargin = { top: 40, right: 40, bottom: 40, left: 40 };
  const margin = options.margin || defaultMargin;

  const chartWidth = width;
  const chartHeight = height;

  if (direction === "horizontal") {
    // Horizontal Bar Chart: x=value, y=category

    const maxValue = Math.max(...data.map((d) => d[xField] || 0));
    const stepHeight = chartHeight / data.length;
    const barHeight = stepHeight * 0.8;

    data.forEach((d, i) => {
      const value = d[xField];
      const barWidth = (value / maxValue) * chartWidth;

      let x, y;
      y = margin.top + i * stepHeight + (stepHeight - barHeight) / 2;

      if (reverse) {
        // Grow from right to left
        x = margin.left + width - barWidth;
      } else {
        // Grow from left to right
        x = margin.left;
      }

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
          .attr("font-size", "10px")
          .text(value);

        if (reverse) {
          label.attr("x", x - 5).attr("text-anchor", "end");
        } else {
          label.attr("x", x + barWidth + 5).attr("text-anchor", "start");
        }
      }

      // Y Axis Labels (Categories)
      if (!hideAxisLabels) {
        const text = container
          .append("text")
          .attr("y", y + barHeight / 2 + 4)
          .attr("font-size", "12px")
          .text(d[yField]);

        if (yAxisAlign === "right") {
          text.attr("x", margin.left + width + 5).attr("text-anchor", "start");
        } else {
          text.attr("x", margin.left - 5).attr("text-anchor", "end");
        }
      }
    });

    // Draw Axes
    // Y Axis line
    const yAxis = container
      .append("line")
      .attr("y1", margin.top)
      .attr("y2", margin.top + height)
      .attr("stroke", "black");

    if (reverse) {
      yAxis.attr("x1", margin.left + width).attr("x2", margin.left + width);
    } else {
      yAxis.attr("x1", margin.left).attr("x2", margin.left);
    }

    // X Axis line
    const xAxis = container
      .append("line")
      .attr("x1", margin.left)
      .attr("y1", margin.top + height)
      .attr("x2", margin.left + width)
      .attr("y2", margin.top + height)
      .attr("stroke", "black");

    // X Axis Labels (Min/Max)
    const label0 = container
      .append("text")
      .attr("y", margin.top + height + 15)
      .attr("font-size", "10px")
      .text("0");

    const labelMax = container
      .append("text")
      .attr("y", margin.top + height + 15)
      .attr("font-size", "10px")
      .text(maxValue);

    if (reverse) {
      label0.attr("x", margin.left + width).attr("text-anchor", "middle");
      labelMax.attr("x", margin.left).attr("text-anchor", "middle");
    } else {
      label0.attr("x", margin.left).attr("text-anchor", "middle");
      labelMax.attr("x", margin.left + width).attr("text-anchor", "middle");
    }
  } else {
    // Vertical Bar Chart: x=category, y=value

    const maxValue = Math.max(...data.map((d) => d[yField] || 0));
    const stepWidth = chartWidth / data.length;
    const barWidth = stepWidth * 0.8;

    data.forEach((d, i) => {
      const value = d[yField];
      const barHeight = (value / maxValue) * chartHeight;

      const x = margin.left + i * stepWidth + (stepWidth - barWidth) / 2;
      const y = margin.top + height - barHeight;

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
          .attr("font-size", "10px")
          .text(value);
      }

      // X Axis Labels (Category)
      if (!hideAxisLabels) {
        container
          .append("text")
          .attr("x", x + barWidth / 2)
          .attr("y", margin.top + height + 15)
          .attr("text-anchor", "middle")
          .attr("font-size", "12px")
          .text(d[xField]);
      }
    });

    // Draw Axes
    container
      .append("line")
      .attr("x1", margin.left)
      .attr("y1", margin.top)
      .attr("x2", margin.left)
      .attr("y2", margin.top + height)
      .attr("stroke", "black");

    // Y Axis Label
    if (yAxisLabel) {
      container
        .append("text")
        .attr("x", margin.left - 30)
        .attr("y", margin.top + height / 2)
        .attr("text-anchor", "middle")
        .attr(
          "transform",
          `rotate(-90, ${margin.left - 30}, ${margin.top + height / 2})`,
        )
        .attr("font-size", "14px")
        .text(yAxisLabel);
    }

    container
      .append("line")
      .attr("x1", margin.left)
      .attr("y1", margin.top + height)
      .attr("x2", margin.left + width)
      .attr("y2", margin.top + height)
      .attr("stroke", "black");
  }
}
