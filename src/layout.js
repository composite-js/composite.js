import * as d3 from "d3";

/**
 * Creates a stack constraint between two charts.
 * @param {Array} charts - The two charts to stack.
 * @param {string} direction - 'vertical' or 'horizontal'.
 * @param {number} margin - The margin between the stacked charts.
 * @returns {Object} The stack constraint object.
 */
export function stack(charts, direction, margin) {
  return { type: "stack", charts, direction, margin };
}

const context =
  typeof document !== "undefined"
    ? document.createElement("canvas").getContext("2d")
    : null;

/**
 * Measures the width of a text string.
 * @param {string} text - The text to measure.
 * @param {number} [fontSize=10] - The font size.
 * @returns {number} The estimated or measured width.
 */
function measureText(text, fontSize = 10) {
  if (context) {
    context.font = `${fontSize}px sans-serif`;
    return context.measureText(text).width;
  }
  return String(text).length * fontSize * 0.6;
}

/**
 * Estimates the margins required for a chart based on its axes and labels.
 * @param {Object} chart - The chart object.
 * @returns {Object} The calculated margins {top, right, bottom, left}.
 */
function estimateMargins(chart) {
  const {
    data,
    encoding,
    yAxisAlign = "left",
    hideAxisLabels = false,
    yAxisLabel,
    direction = "vertical",
    showLabels = false,
  } = chart.options;

  const margin = { top: 10, right: 10, bottom: 10, left: 10 };

  if (chart.options.mark === "bar") {
    if (direction === "vertical") {
      if (yAxisLabel) margin.left += 30;
      if (!hideAxisLabels && encoding.x) margin.bottom += 20;
      if (showLabels) margin.top += 15;
    } else {
      if (!hideAxisLabels && encoding.y) {
        const labels = data.map((d) => d[encoding.y]);
        const maxLabelWidth = Math.max(
          0,
          ...labels.map((l) => measureText(l, 12)),
        );

        if (yAxisAlign === "right") {
          margin.right += maxLabelWidth + 10;
        } else {
          margin.left += maxLabelWidth + 10;
        }
      }
      if (encoding.x) margin.bottom += 20;
    }
  }

  return margin;
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
        const w = (chart.options.width || 0) + margin.left + margin.right;
        const h = (chart.options.height || 0) + margin.top + margin.bottom;

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

        const g = svg
          .append("g")
          .attr("class", "chart-layer")
          .attr("transform", `translate(${x}, ${y})`);

        chart.render(g.node(), { margin });
      });
    },
  };
}
