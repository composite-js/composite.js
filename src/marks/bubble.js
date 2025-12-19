import * as d3 from "d3";

/**
 * Renders a bubble chart (scatter plot).
 * @param {SVGElement} svg - The SVG container.
 * @param {Array} data - The data to render.
 * @param {Object} options - Chart options.
 */
export function drawBubbleChart(svg, data, options) {
  const {
    encoding = {},
    width = 400,
    height = 300,
    color = "steelblue",
    maxRadius = 10,
    showXAxis = true,
    showYAxis = true,
    xAxisName = "",
    yAxisName = "",
    xAxisPos = "bottom",
    yAxisPos = "left",
    padding = 0.1,
  } = options;
  const container = d3.select(svg);

  const xField = encoding.x;
  const yField = encoding.y;
  const sizeField = encoding.size;

  const defaultMargin = { top: 40, right: 40, bottom: 40, left: 40 };
  const margin = options.margin || defaultMargin;

  const chartWidth = width;
  const chartHeight = height;

  // Create a group for the chart content
  container.selectAll("*").remove();
  const g = container
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const reverseX = xAxisPos === "top";
  const reverseY = yAxisPos === "right";

  // Create scales
  // Check if x is categorical or quantitative
  const xIsCategorical = typeof data[0][xField] === "string";
  let xScale;
  if (xIsCategorical) {
    const domain = encoding.xDomain || data.map((d) => d[xField]);
    xScale = d3
      .scaleBand()
      .domain(domain)
      .range(reverseX ? [chartWidth, 0] : [0, chartWidth])
      .padding(padding);
  } else {
    let domain = encoding.xDomain;
    if (!domain) {
      const xExtent = d3.extent(data, (d) => d[xField]);
      // Add some padding to the domain
      const xPadding = (xExtent[1] - xExtent[0]) * 0.05 || 1;
      domain = [xExtent[0] - xPadding, xExtent[1] + xPadding];
    }
    xScale = d3
      .scaleLinear()
      .domain(domain)
      .range(reverseX ? [chartWidth, 0] : [0, chartWidth]);
  }

  // Check if y is categorical or quantitative
  const yIsCategorical = typeof data[0][yField] === "string";
  let yScale;
  if (yIsCategorical) {
    const domain = encoding.yDomain || data.map((d) => d[yField]);
    yScale = d3
      .scaleBand()
      .domain(domain)
      .range(reverseY ? [0, chartHeight] : [chartHeight, 0])
      .padding(padding);
  } else {
    let domain = encoding.yDomain;
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
    rScale = d3.scaleSqrt().domain([0, sizeExtent[1]]).range([0, maxRadius]);
  }

  // Draw bubbles
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
      .attr("fill", color)
      .attr("opacity", 0.7)
      .attr("stroke", "white")
      .attr("stroke-width", 1)
      .on("mouseenter", function () {
        d3.select(this).attr("fill", "orange");
      })
      .on("mouseleave", function () {
        d3.select(this).attr("fill", color);
      });

    // Tooltip
    circle
      .append("title")
      .text(
        `${xField}: ${d[xField]}, ${yField}: ${d[yField]}${sizeField ? `, ${sizeField}: ${d[sizeField]}` : ""}`,
      );
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
