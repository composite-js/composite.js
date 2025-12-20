import * as d3 from "d3";

/**
 * Renders a stacked bar chart.
 * @param {SVGElement} svg - The SVG container.
 * @param {Array} data - The data to render (array of objects with category, value, and stack fields).
 * @param {Object} options - Chart options.
 */
export function drawStackBarChart(svg, data, options) {
  const {
    encoding = {},
    width = 400,
    height = 300,
    direction = "vertical", // 'vertical' | 'horizontal'
    colorScheme = d3.schemeCategory10,
    showLabels = false,
    showXAxis = true,
    showYAxis = true,
    xAxisName = "",
    yAxisName = "",
    xAxisPos = "bottom",
    yAxisPos = "left",
    padding = 0.2,
  } = options;

  const container = d3.select(svg);
  const categoryField = encoding.y; // Category axis (e.g., genre)
  const valueField = encoding.x; // Value axis (e.g., size)
  const stackField = encoding.stack; // Stack field (e.g., type)

  const defaultMargin = { top: 40, right: 40, bottom: 40, left: 40 };
  const margin = options.margin || defaultMargin;

  const chartWidth = width;
  const chartHeight = height;

  container.selectAll("*").remove();

  // Get unique categories and stack keys
  const categories = [...new Set(data.map((d) => d[categoryField]))];
  const stackKeys = [...new Set(data.map((d) => d[stackField]))];

  // Pivot data: { category: { stackKey1: value1, stackKey2: value2, ... } }
  const pivotedData = categories.map((cat) => {
    const entry = { [categoryField]: cat };
    stackKeys.forEach((key) => {
      const item = data.find(
        (d) => d[categoryField] === cat && d[stackField] === key,
      );
      entry[key] = item ? item[valueField] : 0;
    });
    return entry;
  });

  // Create stack generator
  const stack = d3.stack().keys(stackKeys);
  const stackedData = stack(pivotedData);

  // Calculate max stacked value
  const maxValue = d3.max(stackedData, (layer) => d3.max(layer, (d) => d[1]));

  // Color scale
  const colorScale = d3.scaleOrdinal().domain(stackKeys).range(colorScheme);

  if (direction === "horizontal") {
    // Horizontal stack bar chart
    const yScale = d3
      .scaleBand()
      .domain(categories)
      .range([0, chartHeight])
      .padding(padding);

    const reverseX = yAxisPos === "right";
    const xScale = d3
      .scaleLinear()
      .domain([0, maxValue])
      .range(reverseX ? [chartWidth, 0] : [0, chartWidth]);

    // Draw stacked bars
    stackedData.forEach((layer) => {
      const stackKey = layer.key;
      layer.forEach((d) => {
        const category = d.data[categoryField];
        const x0 = xScale(d[0]);
        const x1 = xScale(d[1]);
        const barX = reverseX ? Math.min(x0, x1) : Math.min(x0, x1);
        const barWidth = Math.abs(x1 - x0);
        const barHeight = yScale.bandwidth();
        const y = yScale(category);

        const rect = container
          .append("rect")
          .attr("x", margin.left + barX)
          .attr("y", margin.top + y)
          .attr("width", barWidth)
          .attr("height", barHeight)
          .attr("fill", colorScale(stackKey))
          .on("mouseenter", function () {
            d3.select(this).attr("opacity", 0.7);
          })
          .on("mouseleave", function () {
            d3.select(this).attr("opacity", 1);
          });

        rect.append("title").text(`${category} - ${stackKey}: ${d[1] - d[0]}`);

        if (showLabels && barWidth > 20) {
          container
            .append("text")
            .attr("x", margin.left + barX + barWidth / 2)
            .attr("y", margin.top + y + barHeight / 2 + 4)
            .attr("text-anchor", "middle")
            .attr("font-size", "10px")
            .attr("fill", "white")
            .text(d[1] - d[0]);
        }
      });
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
  } else {
    // Vertical stack bar chart
    const xScale = d3
      .scaleBand()
      .domain(categories)
      .range([0, chartWidth])
      .padding(padding);

    const reverseY = yAxisPos === "right";
    const yScale = d3
      .scaleLinear()
      .domain([0, maxValue])
      .range(reverseY ? [0, chartHeight] : [chartHeight, 0]);

    // Draw stacked bars
    stackedData.forEach((layer) => {
      const stackKey = layer.key;
      layer.forEach((d) => {
        const category = d.data[categoryField];
        const y0 = yScale(d[0]);
        const y1 = yScale(d[1]);
        const barY = Math.min(y0, y1);
        const barHeight = Math.abs(y1 - y0);
        const barWidth = xScale.bandwidth();
        const x = xScale(category);

        const rect = container
          .append("rect")
          .attr("x", margin.left + x)
          .attr("y", margin.top + barY)
          .attr("width", barWidth)
          .attr("height", barHeight)
          .attr("fill", colorScale(stackKey))
          .on("mouseenter", function () {
            d3.select(this).attr("opacity", 0.7);
          })
          .on("mouseleave", function () {
            d3.select(this).attr("opacity", 1);
          });

        rect.append("title").text(`${category} - ${stackKey}: ${d[1] - d[0]}`);

        if (showLabels && barHeight > 15) {
          container
            .append("text")
            .attr("x", margin.left + x + barWidth / 2)
            .attr("y", margin.top + barY + barHeight / 2 + 4)
            .attr("text-anchor", "middle")
            .attr("font-size", "10px")
            .attr("fill", "white")
            .text(d[1] - d[0]);
        }
      });
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
}

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
    showXAxis = true, // Show X axis labels
    showYAxis = true, // Show Y axis labels
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

  // Create a group for the chart content
  container.selectAll("*").remove();
  const g = container
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

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
  } else {
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
}
