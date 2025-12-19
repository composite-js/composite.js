import * as d3 from "d3";

/**
 * Creates a horizontal stack constraint between two charts.
 * @param {Array} charts - The two charts to stack.
 * @param {number} margin - The margin between the stacked charts.
 * @returns {Object} The stack constraint object.
 */
export function stackX(charts, margin) {
  return { type: "stack", charts, direction: "horizontal", margin };
}

/**
 * Creates a vertical stack constraint between two charts.
 * @param {Array} charts - The two charts to stack.
 * @param {number} margin - The margin between the stacked charts.
 * @returns {Object} The stack constraint object.
 */
export function stackY(charts, margin) {
  return { type: "stack", charts, direction: "vertical", margin };
}

/**
 * Calculates the margins required for a chart by actually rendering axes
 * and measuring their bounding boxes.
 * @param {Object} chart - The chart object.
 * @returns {Object} The calculated margins {top, right, bottom, left}.
 */
function estimateMargins(chart) {
  const {
    data,
    encoding,
    width = 400,
    height = 300,
    xAxisPos = "bottom",
    yAxisPos = "left",
    showXAxis = true,
    showYAxis = true,
    xAxisName,
    yAxisName,
    mark,
  } = chart.options;

  const margin = { top: 10, right: 10, bottom: 10, left: 10 };

  // If running in browser environment, render axes to measure actual bounds
  if (typeof document !== "undefined") {
    // Create temporary SVG for measurement
    const tempSvg = d3
      .create("svg")
      .attr("width", width + 100)
      .attr("height", height + 100);

    // Create scales based on data
    let xScale, yScale;

    if (encoding.x && encoding.y) {
      const xField = encoding.x;
      const yField = encoding.y;

      // Determine scale types based on data and mark type
      if (mark === "bar") {
        // For bar charts, typically one axis is band scale
        const xValues = data.map((d) => d[xField]);
        const yValues = data.map((d) => d[yField]);

        if (typeof xValues[0] === "string") {
          xScale = d3
            .scaleBand()
            .domain(xValues)
            .range([0, width])
            .padding(0.1);
        } else {
          xScale = d3
            .scaleLinear()
            .domain([0, d3.max(xValues)])
            .range([0, width]);
        }

        if (typeof yValues[0] === "string") {
          yScale = d3
            .scaleBand()
            .domain(yValues)
            .range([height, 0])
            .padding(0.1);
        } else {
          yScale = d3
            .scaleLinear()
            .domain([0, d3.max(yValues)])
            .range([height, 0]);
        }
      } else {
        // For other marks (line, scatter, etc.)
        const xValues = data.map((d) => d[xField]);
        const yValues = data.map((d) => d[yField]);

        xScale = d3.scaleLinear().domain(d3.extent(xValues)).range([0, width]);

        yScale = d3.scaleLinear().domain(d3.extent(yValues)).range([height, 0]);
      }

      // Render X axis if needed
      if (xScale && showXAxis) {
        const xAxisGenerator = xAxisPos === "top" ? d3.axisTop : d3.axisBottom;
        const xAxisGroup = tempSvg
          .append("g")
          .attr("class", "x-axis")
          .attr(
            "transform",
            `translate(50, ${xAxisPos === "top" ? 50 : 50 + height})`,
          )
          .call(xAxisGenerator(xScale));

        // Measure X axis bounds
        const xAxisBBox = xAxisGroup.node().getBBox();

        if (xAxisPos === "top") {
          margin.top = Math.max(
            margin.top,
            Math.abs(xAxisBBox.y) + xAxisBBox.height + 5,
          );
        } else {
          margin.bottom = Math.max(margin.bottom, xAxisBBox.height + 5);
        }

        // Add space for X axis label if present
        if (xAxisName) {
          margin.bottom += 20;
        }
      }

      // Render Y axis if needed
      if (yScale && showYAxis) {
        const yAxisGenerator =
          yAxisPos === "right" ? d3.axisRight : d3.axisLeft;
        const yAxisGroup = tempSvg
          .append("g")
          .attr("class", "y-axis")
          .attr(
            "transform",
            `translate(${yAxisPos === "right" ? 50 + width : 50}, 50)`,
          )
          .call(yAxisGenerator(yScale));

        // Measure Y axis bounds
        const yAxisBBox = yAxisGroup.node().getBBox();

        if (yAxisPos === "right") {
          margin.right = Math.max(margin.right, yAxisBBox.width + 5);
        } else {
          margin.left = Math.max(
            margin.left,
            Math.abs(yAxisBBox.x) + yAxisBBox.width + 5,
          );
        }

        // Add space for Y axis label if present
        if (yAxisName) {
          if (yAxisPos === "right") {
            margin.right += 20;
          } else {
            margin.left += 20;
          }
        }
      }
    }
  } else {
    // Fallback for non-browser environments (e.g., Node.js)
    // Use simple heuristics
    if (showXAxis) {
      margin.bottom += 30;
      if (xAxisName) margin.bottom += 20;
    }
    if (showYAxis) {
      if (yAxisPos === "right") {
        margin.right += 50;
        if (yAxisName) margin.right += 20;
      } else {
        margin.left += 50;
        if (yAxisName) margin.left += 20;
      }
    }
  }

  return margin;
}

/**
 * Suggests dimensions for a chart based on its data and configuration.
 * @param {Object} chart - The chart object.
 * @returns {Object} The suggested dimensions {width, height}.
 */
function suggestDimensions(chart) {
  const { data, encoding, mark, direction } = chart.options;
  const defaultWidth = 400;
  const defaultHeight = 300;

  if (mark === "bar") {
    if (direction === "horizontal" && encoding.y) {
      const uniqueY = new Set(data.map((d) => d[encoding.y])).size;
      return {
        width: defaultWidth,
        height: Math.max(defaultHeight, uniqueY * 20),
      };
    } else if (encoding.x) {
      const uniqueX = new Set(data.map((d) => d[encoding.x])).size;
      return {
        width: Math.max(defaultWidth, uniqueX * 20),
        height: defaultHeight,
      };
    }
  }

  return { width: defaultWidth, height: defaultHeight };
}

/**
 * Composes multiple charts into a single layout.
 * @param {Array} charts - The list of charts to compose.
 * @param {Object} options - Layout options including constraints.
 * @returns {Object} An object with a render method.
 */
export function composite(charts, { constraints = [] } = {}) {
  return {
    render(container) {
      // Initialize grid coordinates
      const coords = new Map();
      charts.forEach((chart) => coords.set(chart, { row: 0, col: 0 }));

      // Resolve constraints to determine relative positions
      for (let i = 0; i < charts.length; i++) {
        constraints.forEach((c) => {
          if (c.type === "stack") {
            const [c1, c2] = c.charts;
            const p1 = coords.get(c1);
            const p2 = coords.get(c2);

            if (!p1 || !p2) return;

            if (c.direction === "vertical") {
              p1.row = p2.row - 1;
              p1.col = p2.col;
            } else if (c.direction === "horizontal") {
              p1.col = p2.col - 1;
              p1.row = p2.row;
            }
          }
        });
      }

      // Normalize coordinates to be 1-based and positive
      let minRow = Infinity,
        minCol = Infinity;
      coords.forEach((p) => {
        if (p.row < minRow) minRow = p.row;
        if (p.col < minCol) minCol = p.col;
      });

      let maxRow = 0,
        maxCol = 0;
      coords.forEach((p) => {
        p.row = p.row - minRow + 1;
        p.col = p.col - minCol + 1;
        if (p.row > maxRow) maxRow = p.row;
        if (p.col > maxCol) maxCol = p.col;
      });

      // Calculate and propagate margins
      const chartMargins = new Map();
      charts.forEach((chart) => {
        chartMargins.set(chart, estimateMargins(chart));
      });

      // Infer dimensions
      const chartDimensions = new Map();
      charts.forEach((chart) => {
        let w = chart.options.width;
        let h = chart.options.height;
        if (w === undefined || w === -1) w = null;
        if (h === undefined || h === -1) h = null;
        chartDimensions.set(chart, { width: w, height: h });
      });

      let changed = true;
      while (changed) {
        changed = false;
        constraints.forEach((c) => {
          if (c.type === "stack") {
            const [c1, c2] = c.charts;
            const d1 = chartDimensions.get(c1);
            const d2 = chartDimensions.get(c2);
            if (!d1 || !d2) return;

            if (c.direction === "vertical") {
              if (d1.width !== null && d2.width !== null) {
                if (d1.width !== d2.width) {
                  throw new Error(
                    `Chart width mismatch in vertical stack: ${d1.width} vs ${d2.width}`,
                  );
                }
              } else if (d1.width !== null && d2.width === null) {
                d2.width = d1.width;
                changed = true;
              } else if (d1.width === null && d2.width !== null) {
                d1.width = d2.width;
                changed = true;
              }
            } else if (c.direction === "horizontal") {
              if (d1.height !== null && d2.height !== null) {
                if (d1.height !== d2.height) {
                  throw new Error(
                    `Chart height mismatch in horizontal stack: ${d1.height} vs ${d2.height}`,
                  );
                }
              } else if (d1.height !== null && d2.height === null) {
                d2.height = d1.height;
                changed = true;
              } else if (d1.height === null && d2.height !== null) {
                d1.height = d2.height;
                changed = true;
              }
            }
          }
        });
      }

      charts.forEach((chart) => {
        const dims = chartDimensions.get(chart);
        if (dims.width === null || dims.height === null) {
          const suggested = suggestDimensions(chart);
          if (dims.width === null && dims.height === null) {
            dims.width = suggested.width;
            dims.height = suggested.height;
          } else if (dims.width === null) {
            const ratio = suggested.width / suggested.height;
            dims.width = dims.height * ratio;
          } else if (dims.height === null) {
            const ratio = suggested.width / suggested.height;
            dims.height = dims.width / ratio;
          }
        }
      });

      for (let i = 0; i < 3; i++) {
        constraints.forEach((c) => {
          if (c.type === "stack") {
            const [c1, c2] = c.charts;
            const m1 = chartMargins.get(c1);
            const m2 = chartMargins.get(c2);

            if (!m1 || !m2) return;

            if (c.direction === "vertical") {
              const maxLeft = Math.max(m1.left, m2.left);
              const maxRight = Math.max(m1.right, m2.right);
              m1.left = m2.left = maxLeft;
              m1.right = m2.right = maxRight;
            } else if (c.direction === "horizontal") {
              const maxTop = Math.max(m1.top, m2.top);
              const maxBottom = Math.max(m1.bottom, m2.bottom);
              m1.top = m2.top = maxTop;
              m1.bottom = m2.bottom = maxBottom;
            }
          }
        });
      }

      // Apply specific margin overrides from constraints
      constraints.forEach((c) => {
        if (c.type === "stack" && c.margin !== undefined) {
          const [c1, c2] = c.charts;
          const m = c.margin;
          if (c.direction === "vertical") {
            const m1 = chartMargins.get(c1);
            if (m1) m1.bottom = m;
          } else if (c.direction === "horizontal") {
            const m1 = chartMargins.get(c1);
            if (m1) m1.right = m;
          }
        }
      });

      // Determine grid dimensions (row heights and column widths)
      const rowHeights = new Array(maxRow + 1).fill(0);
      const colWidths = new Array(maxCol + 1).fill(0);

      charts.forEach((chart) => {
        const { row, col } = coords.get(chart);
        const margin = chartMargins.get(chart);
        const dims = chartDimensions.get(chart);
        const w = dims.width + margin.left + margin.right;
        const h = dims.height + margin.top + margin.bottom;

        if (h > rowHeights[row]) rowHeights[row] = h;
        if (w > colWidths[col]) colWidths[col] = w;
      });

      // Render SVG and charts
      container.innerHTML = "";
      const gap = 10;

      const totalWidth =
        colWidths.slice(1).reduce((sum, w) => sum + w, 0) +
        Math.max(0, maxCol - 1) * gap;
      const totalHeight =
        rowHeights.slice(1).reduce((sum, h) => sum + h, 0) +
        Math.max(0, maxRow - 1) * gap;

      const svg = d3
        .select(container)
        .append("svg")
        .attr("width", totalWidth)
        .attr("height", totalHeight);

      const mainG = svg.append("g").attr("class", "main-layout");

      const getPos = (r, c) => {
        let x = 0;
        for (let i = 1; i < c; i++) x += colWidths[i] + gap;
        let y = 0;
        for (let i = 1; i < r; i++) y += rowHeights[i] + gap;
        return { x, y };
      };

      charts.forEach((chart) => {
        const { row, col } = coords.get(chart);
        const { x, y } = getPos(row, col);
        const margin = chartMargins.get(chart);
        const dims = chartDimensions.get(chart);

        const g = mainG
          .append("g")
          .attr("class", "chart-layer")
          .attr("transform", `translate(${x}, ${y})`);

        chart.render(g.node(), {
          margin,
          width: dims.width,
          height: dims.height,
        });
      });

      // Adjust layout if content exceeds SVG bounds
      if (typeof mainG.node().getBBox === "function") {
        const bbox = mainG.node().getBBox();
        if (bbox.width > 0 && bbox.height > 0) {
          const scale = Math.min(
            1,
            totalWidth / bbox.width,
            totalHeight / bbox.height,
          );
          const tx = -bbox.x * scale + (totalWidth - bbox.width * scale) / 2;
          const ty = -bbox.y * scale + (totalHeight - bbox.height * scale) / 2;

          mainG.attr("transform", `translate(${tx}, ${ty}) scale(${scale})`);
        }
      }
    },
  };
}
