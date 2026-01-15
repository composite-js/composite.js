import * as d3 from "d3";
import { MarkRenderer } from "./mark.js";

/**
 * Renderer for matrix charts (e.g., for set intersections).
 */
export class MatrixChartRenderer extends MarkRenderer {
  /**
   * Creates an instance of MatrixChartRenderer.
   * @param {Object} options - Chart options.
   */
  constructor(options = {}) {
    super(options);
    this.stripe = options.stripe !== undefined ? options.stripe : true;
    this.padding = options.padding || {
      xInner: 0,
      xOuter: 0,
      yInner: 0,
      yOuter: 0,
    };
  }

  /**
   * Renders a matrix chart.
   * @param {SVGElement} svg - The SVG container.
   * @param {Array} data - The data to render.
   * @returns {null} Matrix charts don't return axis config.
   */
  render(svg, data) {
    const container = d3.select(svg);
    const xField = this.encoding.x;
    const yField = this.encoding.y; // Expecting an array of strings
    const margin = this.margin;
    const chartWidth = this.width;
    const chartHeight = this.height;

    // Identify all unique categories for Y axis (the sets)
    let sortedSets;
    if (this.encoding.yDomain) {
      sortedSets = this.encoding.yDomain;
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

    // Use scaleBand for X axis
    const xDomain = data.map((d) => d[xField]);
    const xScale = d3
      .scaleBand()
      .domain(xDomain)
      .range([0, chartWidth])
      .paddingInner(this.padding.xInner)
      .paddingOuter(this.padding.xOuter);

    // Use scaleBand for Y axis
    const yScale = d3
      .scaleBand()
      .domain(sortedSets)
      .range([0, chartHeight])
      .paddingInner(this.padding.yInner)
      .paddingOuter(this.padding.yOuter);

    const stepWidth = xScale.bandwidth();
    const stepHeight = yScale.bandwidth();

    // Helper to get coordinates
    const getX = (i) => margin.left + xScale(data[i][xField]) + stepWidth * 0.5;
    const getY = (setIndex) =>
      margin.top + yScale(sortedSets[setIndex]) + stepHeight * 0.5;

    // Draw Rows (Sets)
    sortedSets.forEach((setName, setIndex) => {
      // Draw Background Stripe
      if (this.stripe && setIndex % 2 === 0) {
        container
          .append("rect")
          .attr("x", margin.left)
          .attr("y", margin.top + yScale(setName))
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

    return null;
  }
}
