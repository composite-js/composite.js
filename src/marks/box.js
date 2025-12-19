import * as d3 from "d3";

/**
 * Renders a box plot.
 * @param {SVGElement} svg - The SVG container.
 * @param {Array} data - The data to render. Each item should have a category field and a value field.
 * @param {Object} options - Chart options.
 */
export function drawBoxPlot(svg, data, options) {
  const {
    encoding = {},
    width = 400,
    height = 300,
    direction = "vertical", // 'vertical' | 'horizontal'
    color = "steelblue",
    showXAxis = true,
    showYAxis = true,
    xAxisName = "",
    yAxisName = "",
    xAxisPos = "bottom",
    yAxisPos = "left",
    boxWidth = 0.6, // Width of boxes as fraction of band
  } = options;

  const container = d3.select(svg);

  const xField = encoding.x;
  const yField = encoding.y;

  const defaultMargin = { top: 40, right: 40, bottom: 40, left: 60 };
  const margin = options.margin || defaultMargin;

  const chartWidth = width;
  const chartHeight = height;

  // For horizontal: y is category, x is value
  // For vertical: x is category, y is value
  const categoryField = direction === "horizontal" ? yField : xField;
  const valueField = direction === "horizontal" ? xField : yField;

  // Group data by category
  const categories = [...new Set(data.map((d) => d[categoryField]))];
  const groupedData = d3.group(data, (d) => d[categoryField]);

  // Calculate statistics for each group
  const boxData = categories.map((category) => {
    const values = groupedData
      .get(category)
      .map((d) => d[valueField])
      .sort(d3.ascending);
    const q1 = d3.quantile(values, 0.25);
    const median = d3.quantile(values, 0.5);
    const q3 = d3.quantile(values, 0.75);
    const iqr = q3 - q1;
    const min = Math.max(d3.min(values), q1 - 1.5 * iqr);
    const max = Math.min(d3.max(values), q3 + 1.5 * iqr);
    const outliers = values.filter((v) => v < min || v > max);

    return {
      category,
      q1,
      median,
      q3,
      min,
      max,
      outliers,
    };
  });

  // Calculate value extent for the value axis
  const valueExtent = [
    d3.min(boxData, (d) =>
      d.outliers.length > 0 ? Math.min(d.min, ...d.outliers) : d.min,
    ),
    d3.max(boxData, (d) =>
      d.outliers.length > 0 ? Math.max(d.max, ...d.outliers) : d.max,
    ),
  ];

  let xScale, yScale;

  if (direction === "horizontal") {
    // Horizontal: y is category (band), x is value (linear)
    yScale = d3
      .scaleBand()
      .domain(categories)
      .range([0, chartHeight])
      .padding(0.2);

    const reverseX = yAxisPos === "right";
    xScale = d3
      .scaleLinear()
      .domain([0, valueExtent[1]])
      .range(reverseX ? [chartWidth, 0] : [0, chartWidth])
      .nice();

    const actualBoxHeight = yScale.bandwidth() * boxWidth;
    const boxOffset = (yScale.bandwidth() - actualBoxHeight) / 2;

    // Draw each horizontal box
    boxData.forEach((d) => {
      const y = margin.top + yScale(d.category);
      const centerY = y + yScale.bandwidth() / 2;

      // Horizontal line from min to max (whiskers)
      container
        .append("line")
        .attr("x1", margin.left + xScale(d.min))
        .attr("x2", margin.left + xScale(d.max))
        .attr("y1", centerY)
        .attr("y2", centerY)
        .attr("stroke", "black")
        .attr("stroke-width", 1);

      // Min whisker cap
      container
        .append("line")
        .attr("x1", margin.left + xScale(d.min))
        .attr("x2", margin.left + xScale(d.min))
        .attr("y1", y + boxOffset)
        .attr("y2", y + boxOffset + actualBoxHeight)
        .attr("stroke", "black")
        .attr("stroke-width", 1);

      // Max whisker cap
      container
        .append("line")
        .attr("x1", margin.left + xScale(d.max))
        .attr("x2", margin.left + xScale(d.max))
        .attr("y1", y + boxOffset)
        .attr("y2", y + boxOffset + actualBoxHeight)
        .attr("stroke", "black")
        .attr("stroke-width", 1);

      // Box (Q1 to Q3)
      const boxX = margin.left + xScale(reverseX ? d.q3 : d.q1);
      const boxW = Math.abs(xScale(d.q3) - xScale(d.q1));

      const rect = container
        .append("rect")
        .attr("x", boxX)
        .attr("y", y + boxOffset)
        .attr("width", boxW)
        .attr("height", actualBoxHeight)
        .attr("fill", color)
        .attr("stroke", "black")
        .attr("stroke-width", 1)
        .attr("opacity", 0.8)
        .on("mouseenter", function () {
          d3.select(this).attr("fill", "orange");
        })
        .on("mouseleave", function () {
          d3.select(this).attr("fill", color);
        });

      // Tooltip
      rect
        .append("title")
        .text(
          `${d.category}\nQ1: ${d.q1.toFixed(2)}\nMedian: ${d.median.toFixed(2)}\nQ3: ${d.q3.toFixed(2)}\nMin: ${d.min.toFixed(2)}\nMax: ${d.max.toFixed(2)}`,
        );

      // Median line
      container
        .append("line")
        .attr("x1", margin.left + xScale(d.median))
        .attr("x2", margin.left + xScale(d.median))
        .attr("y1", y + boxOffset)
        .attr("y2", y + boxOffset + actualBoxHeight)
        .attr("stroke", "white")
        .attr("stroke-width", 2);

      // Outliers
      d.outliers.forEach((outlier) => {
        container
          .append("circle")
          .attr("cx", margin.left + xScale(outlier))
          .attr("cy", centerY)
          .attr("r", 3)
          .attr("fill", "none")
          .attr("stroke", color)
          .attr("stroke-width", 1.5);
      });
    });
  } else {
    xScale = d3
      .scaleBand()
      .domain(categories)
      .range([0, chartWidth])
      .padding(0.2);

    yScale = d3
      .scaleLinear()
      .domain(valueExtent)
      .range([chartHeight, 0])
      .nice();

    const actualBoxWidth = xScale.bandwidth() * boxWidth;
    const boxOffset = (xScale.bandwidth() - actualBoxWidth) / 2;

    // Draw each vertical box
    boxData.forEach((d) => {
      const x = margin.left + xScale(d.category);
      const centerX = x + xScale.bandwidth() / 2;

      // Vertical line from min to max (whiskers)
      container
        .append("line")
        .attr("x1", centerX)
        .attr("x2", centerX)
        .attr("y1", margin.top + yScale(d.min))
        .attr("y2", margin.top + yScale(d.max))
        .attr("stroke", "black")
        .attr("stroke-width", 1);

      // Min whisker cap
      container
        .append("line")
        .attr("x1", x + boxOffset)
        .attr("x2", x + boxOffset + actualBoxWidth)
        .attr("y1", margin.top + yScale(d.min))
        .attr("y2", margin.top + yScale(d.min))
        .attr("stroke", "black")
        .attr("stroke-width", 1);

      // Max whisker cap
      container
        .append("line")
        .attr("x1", x + boxOffset)
        .attr("x2", x + boxOffset + actualBoxWidth)
        .attr("y1", margin.top + yScale(d.max))
        .attr("y2", margin.top + yScale(d.max))
        .attr("stroke", "black")
        .attr("stroke-width", 1);

      // Box (Q1 to Q3)
      const boxY = margin.top + yScale(d.q3);
      const boxHeight = yScale(d.q1) - yScale(d.q3);

      const rect = container
        .append("rect")
        .attr("x", x + boxOffset)
        .attr("y", boxY)
        .attr("width", actualBoxWidth)
        .attr("height", boxHeight)
        .attr("fill", color)
        .attr("stroke", "black")
        .attr("stroke-width", 1)
        .attr("opacity", 0.8)
        .on("mouseenter", function () {
          d3.select(this).attr("fill", "orange");
        })
        .on("mouseleave", function () {
          d3.select(this).attr("fill", color);
        });

      // Tooltip
      rect
        .append("title")
        .text(
          `${d.category}\nQ1: ${d.q1.toFixed(2)}\nMedian: ${d.median.toFixed(2)}\nQ3: ${d.q3.toFixed(2)}\nMin: ${d.min.toFixed(2)}\nMax: ${d.max.toFixed(2)}`,
        );

      // Median line
      container
        .append("line")
        .attr("x1", x + boxOffset)
        .attr("x2", x + boxOffset + actualBoxWidth)
        .attr("y1", margin.top + yScale(d.median))
        .attr("y2", margin.top + yScale(d.median))
        .attr("stroke", "white")
        .attr("stroke-width", 2);

      // Outliers
      d.outliers.forEach((outlier) => {
        container
          .append("circle")
          .attr("cx", centerX)
          .attr("cy", margin.top + yScale(outlier))
          .attr("r", 3)
          .attr("fill", "none")
          .attr("stroke", color)
          .attr("stroke-width", 1.5);
      });
    });
  }

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
