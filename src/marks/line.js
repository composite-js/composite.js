import * as d3 from "d3";

/**
 * Renders a line chart.
 * @param {SVGElement} svg - The SVG container.
 * @param {Array} data - The data to render.
 * @param {Object} options - Chart options.
 */
export function drawLineChart(svg, data, options) {
  const { encoding = {}, width = 400, height = 300 } = options;
  const container = d3.select(svg);

  const xField = encoding.x;
  const yField = encoding.y;
  const defaultMargin = { top: 40, right: 40, bottom: 40, left: 40 };
  const margin = options.margin || defaultMargin;

  const chartWidth = width;
  const chartHeight = height;

  const maxValue = Math.max(...data.map((d) => d[yField] || 0));
  const stepWidth = chartWidth / data.length;

  // Helper functions for coordinates
  const getX = (i) => margin.left + i * stepWidth + stepWidth * 0.5;
  const getY = (val) =>
    margin.top + chartHeight - (val / maxValue) * chartHeight;

  // Generate path data
  let pathD = "";
  const points = [];

  data.forEach((d, i) => {
    const value = d[yField];
    const x = getX(i);
    const y = getY(value);
    points.push({ x, y, value, label: d[xField] });

    if (i === 0) {
      pathD += `M ${x} ${y}`;
    } else {
      pathD += ` L ${x} ${y}`;
    }
  });

  // Draw line path
  container
    .append("path")
    .attr("d", pathD)
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

  // Draw X Axis Labels
  data.forEach((d, i) => {
    container
      .append("text")
      .attr("x", getX(i))
      .attr("y", margin.top + height + 20)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .text(d[xField]);
  });

  // Draw Axes
  container
    .append("line")
    .attr("x1", margin.left)
    .attr("y1", margin.top)
    .attr("x2", margin.left)
    .attr("y2", margin.top + height)
    .attr("stroke", "black");

  container
    .append("line")
    .attr("x1", margin.left)
    .attr("y1", margin.top + height)
    .attr("x2", margin.left + width)
    .attr("y2", margin.top + height)
    .attr("stroke", "black");
}
