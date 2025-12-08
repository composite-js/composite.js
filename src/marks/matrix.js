import * as d3 from "d3";

/**
 * Renders a matrix chart (e.g., for set intersections).
 * @param {SVGElement} svg - The SVG container.
 * @param {Array} data - The data to render.
 * @param {Object} options - Chart options.
 */
export function drawMatrix(svg, data, options) {
  const { encoding = {}, width = 400, height = 300, stripe = true } = options;
  const container = d3.select(svg);

  const xField = encoding.x;
  const yField = encoding.y; // Expecting an array of strings

  const defaultMargin = { top: 40, right: 40, bottom: 40, left: 40 };
  const margin = options.margin || defaultMargin;

  const chartWidth = width;
  const chartHeight = height;

  // Identify all unique categories for Y axis (the sets)
  let sortedSets;
  if (encoding.yDomain) {
    sortedSets = encoding.yDomain;
  } else {
    const allSets = new Set();
    data.forEach((d) => {
      const sets = d[yField];
      if (Array.isArray(sets)) {
        sets.forEach((s) => allSets.add(s));
      }
    });
    sortedSets = Array.from(allSets).sort();
  }

  const stepWidth = chartWidth / data.length;
  const stepHeight = chartHeight / sortedSets.length;

  // Helper to get coordinates
  const getX = (i) => margin.left + i * stepWidth + stepWidth * 0.5;
  const getY = (setIndex) =>
    margin.top + setIndex * stepHeight + stepHeight * 0.5;

  // Draw Rows (Sets)
  sortedSets.forEach((setName, setIndex) => {
    // Draw Background Stripe
    if (stripe && setIndex % 2 === 0) {
      container
        .append("rect")
        .attr("x", margin.left)
        .attr("y", margin.top + setIndex * stepHeight)
        .attr("width", chartWidth)
        .attr("height", stepHeight)
        .attr("fill", "#f9f9f9");
    }
  });

  // Draw Columns (Intersections)
  data.forEach((d, i) => {
    const activeSets = new Set(d[yField] || []);
    const x = getX(i);

    // Find range of active sets for the vertical connecting line
    let minIndex = Infinity;
    let maxIndex = -Infinity;

    sortedSets.forEach((setName, setIndex) => {
      if (activeSets.has(setName)) {
        if (setIndex < minIndex) minIndex = setIndex;
        if (setIndex > maxIndex) maxIndex = setIndex;
      }
    });

    // Draw connecting line
    if (minIndex < maxIndex) {
      container
        .append("line")
        .attr("x1", x)
        .attr("y1", getY(minIndex))
        .attr("x2", x)
        .attr("y2", getY(maxIndex))
        .attr("stroke", "black")
        .attr("stroke-width", "2");
    }

    // Draw circles for each set
    sortedSets.forEach((setName, setIndex) => {
      const y = getY(setIndex);
      const isActive = activeSets.has(setName);

      container
        .append("circle")
        .attr("cx", x)
        .attr("cy", y)
        .attr("r", 5) // Slightly larger
        .attr("fill", isActive ? "black" : "#e0e0e0");
      // No stroke for inactive, just fill
    });
  });
}
