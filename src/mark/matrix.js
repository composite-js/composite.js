import * as d3 from "d3";
import { MarkRenderer } from "./mark.js";
import { categoricalDomain } from "./scale.js";

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
    this.color = options.color || "black";
    this.showXAxis =
      options.showXAxis !== undefined ? options.showXAxis : false;
    this.showYAxis =
      options.showYAxis !== undefined ? options.showYAxis : false;
    this.xAxisPos = options.xAxisPos || "bottom";
    this.yAxisPos = options.yAxisPos || "left";
    this.labelFontSize = options.labelFontSize || 10;
    this.circleRadius = options.circleRadius || 5;
    this.stripe = options.stripe !== undefined ? options.stripe : true;
    this.padding = options.padding || {
      xInner: 0,
      xOuter: 0,
      yInner: 0,
      yOuter: 0,
    };
  }

  _domainFromData(data, field, fallback = []) {
    if (fallback?.length) {
      return fallback;
    }

    return [...new Set(data.map((d) => d[field]))];
  }

  _clamp01(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return 0;
    }

    return Math.max(0, Math.min(1, numeric));
  }

  _isNeutralColor(color) {
    const parsed = d3.color(color);
    if (!parsed) {
      return false;
    }

    return parsed.r === parsed.g && parsed.g === parsed.b;
  }

  _continuousFill(value) {
    const amount = this._clamp01(value);
    const parsed = d3.color(this.color);
    if (!parsed || this._isNeutralColor(this.color)) {
      return d3.interpolateRgb("#e0e0e0", parsed || "black")(amount);
    }

    const target = d3.hsl(parsed);
    const source = d3.hsl(parsed);
    source.s = Math.max(0.08, target.s * 0.18);
    source.l = Math.min(0.92, Math.max(target.l, 0.86));

    return d3.interpolateHsl(source, target)(amount);
  }

  _drawLabels(container, xScale, yScale, xDomain, yDomain) {
    const margin = this.margin;
    const chartHeight = this.height;
    const chartWidth = this.width;

    if (this.showXAxis) {
      const y =
        this.xAxisPos === "top"
          ? margin.top - 6
          : margin.top + chartHeight + this.labelFontSize + 4;

      xDomain.forEach((label) => {
        container
          .append("text")
          .attr("class", "matrix-column-label")
          .attr("x", margin.left + xScale(label) + xScale.bandwidth() * 0.5)
          .attr("y", y)
          .attr("text-anchor", "middle")
          .attr("font-size", `${this.labelFontSize}px`)
          .text(label);
      });
    }

    if (this.showYAxis) {
      const x =
        this.yAxisPos === "right"
          ? margin.left + chartWidth + 8
          : margin.left - 8;
      const anchor = this.yAxisPos === "right" ? "start" : "end";

      yDomain.forEach((label) => {
        container
          .append("text")
          .attr("class", "matrix-row-label")
          .attr("x", x)
          .attr("y", margin.top + yScale(label) + yScale.bandwidth() * 0.5 + 3)
          .attr("text-anchor", anchor)
          .attr("font-size", `${this.labelFontSize}px`)
          .text(label);
      });
    }
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
    const valueField = this.encoding.value;
    const margin = this.margin;
    const chartWidth = this.width;
    const chartHeight = this.height;
    const isValueMatrix = Boolean(valueField);

    // Identify all unique categories for Y axis (the sets)
    let sortedSets;
    if (this.encoding.yDomain) {
      sortedSets = this.encoding.yDomain;
    } else if (isValueMatrix) {
      sortedSets = categoricalDomain(data, yField, this.encoding.yDomain);
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
    const xDomain = categoricalDomain(data, xField, this.encoding.xDomain);
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
    const getX = (value) => margin.left + xScale(value) + stepWidth * 0.5;
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

    this._drawLabels(container, xScale, yScale, xDomain, sortedSets);

    if (isValueMatrix) {
      data.forEach((d) => {
        const x = margin.left + xScale(d[xField]) + stepWidth * 0.5;
        const y = margin.top + yScale(d[yField]) + stepHeight * 0.5;

        container
          .append("circle")
          .attr("cx", x)
          .attr("cy", y)
          .attr("r", this.circleRadius)
          .attr("fill", this._continuousFill(d[valueField]));
      });

      return null;
    }

    // Draw Columns (Intersections)
    const dataByX = new Map(data.map((d) => [d[xField], d]));
    xDomain.forEach((xValue) => {
      const d = dataByX.get(xValue) || { [xField]: xValue, [yField]: [] };
      const activeSets = new Set(d[yField] || []);
      const x = getX(xValue);

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
          .attr("r", this.circleRadius)
          .attr("fill", isActive ? this.color : "#e0e0e0");
        // No stroke for inactive, just fill
      });
    });

    return null;
  }
}
