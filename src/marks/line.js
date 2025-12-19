import * as d3 from "d3";

/**
 * Renders a line chart.
 * @param {SVGElement} svg - The SVG container.
 * @param {Array} data - The data to render.
 * @param {Object} options - Chart options.
 */
export function drawLineChart(svg, data, options) {
  const {
    encoding = {},
    width = 400,
    height = 300,
    showXAxis = true,
    showYAxis = true,
    xAxisName = "",
    yAxisName = "",
    xAxisPos = "bottom",
    yAxisPos = "left",
  } = options;
  const container = d3.select(svg);

  const xField = encoding.x;
  const yField = encoding.y;
  const defaultMargin = { top: 40, right: 40, bottom: 40, left: 40 };
  const margin = options.margin || defaultMargin;

  const chartWidth = width;
  const chartHeight = height;

  const maxValue = Math.max(...data.map((d) => d[yField] || 0));

  const xScale = d3
    .scalePoint()
    .domain(data.map((d) => d[xField]))
    .range([0, chartWidth])
    .padding(0.5);

  const yScale = d3.scaleLinear().domain([0, maxValue]).range([chartHeight, 0]);

  // Helper functions for coordinates
  const getX = (val) => margin.left + xScale(val);
  const getY = (val) => margin.top + yScale(val);

  data.forEach((d, i) => {
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
      showXAxis,
      showYAxis,
      xAxisName,
      yAxisName,
      xAxisPos,
      yAxisPos,
    },
  };
}
