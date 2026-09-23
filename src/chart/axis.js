import * as d3 from "d3";

function moveToBack(selection) {
  const node = selection.node();
  const parent = node?.parentNode;
  const firstChild = parent?.children?.[0] || parent?.firstChild;

  if (parent && firstChild && firstChild !== node) {
    parent.insertBefore(node, firstChild);
  }
}

function drawGrid(container, axis, className, transform) {
  const grid = container
    .append("g")
    .attr("class", className)
    .attr("transform", transform)
    .attr("pointer-events", "none")
    .call(axis.tickFormat(() => "").tickSizeOuter(0));

  grid.select(".domain").remove();
  grid.selectAll("text").remove();
  moveToBack(grid);
}

/**
 * Axis renderer class for drawing chart axes.
 */
export class AxisRenderer {
  /**
   * Creates an instance of AxisRenderer.
   * @param {Object} options - Axis configuration options.
   */
  constructor(options = {}) {
    this.showXAxis = options.showXAxis !== undefined ? options.showXAxis : true;
    this.showYAxis = options.showYAxis !== undefined ? options.showYAxis : true;
    this.xAxisName = options.xAxisName || "";
    this.yAxisName = options.yAxisName || "";
    this.xAxisPos = options.xAxisPos || "bottom";
    this.yAxisPos = options.yAxisPos || "left";
    this.xTickFormat = options.xTickFormat;
    this.yTickFormat = options.yTickFormat;
    this.xTickCount = options.xTickCount;
    this.yTickCount = options.yTickCount;
    this.showXGrid = options.showXGrid === true;
    this.showYGrid = options.showYGrid === true;
  }

  /**
   * Renders axes for a chart.
   * @param {SVGElement} svg - The SVG container.
   * @param {Object} scales - The scales { x, y }.
   * @param {Object} dimensions - The dimensions { margin, width, height }.
   */
  render(svg, scales, dimensions) {
    const { x: xScale, y: yScale } = scales;
    const { margin, width, height } = dimensions;
    const container = d3.select(svg);

    // Draw X Axis
    if (xScale && this.showXAxis) {
      this._drawXAxis(container, xScale, margin, width, height);
    }

    // Draw Y Axis
    if (yScale && this.showYAxis) {
      this._drawYAxis(container, yScale, margin, width, height);
    }
  }

  /**
   * Draws the X axis.
   * @private
   * @param {d3.Selection} container - The SVG container selection.
   * @param {d3.Scale} xScale - The X scale.
   * @param {Object} margin - The margin object.
   * @param {number} width - The chart width.
   * @param {number} height - The chart height.
   */
  _drawXAxis(container, xScale, margin, width, height) {
    const xAxisGenerator = this.xAxisPos === "top" ? d3.axisTop : d3.axisBottom;
    const xTransform =
      this.xAxisPos === "top"
        ? `translate(${margin.left}, ${margin.top})`
        : `translate(${margin.left}, ${margin.top + height})`;

    const axis = xAxisGenerator(xScale);
    if (this.xTickCount !== undefined) axis.ticks(this.xTickCount);
    if (this.xTickFormat !== undefined) axis.tickFormat(this.xTickFormat);

    if (this.showXGrid) {
      const gridAxis = xAxisGenerator(xScale).tickSize(-height);
      if (this.xTickCount !== undefined) gridAxis.ticks(this.xTickCount);
      drawGrid(container, gridAxis, "x-grid", xTransform);
    }

    container
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", xTransform)
      .call(axis);

    if (this.xAxisName) {
      const labelY =
        this.xAxisPos === "top" ? margin.top - 30 : margin.top + height + 30;
      const xRange = xScale.range();
      const labelX = margin.left + (d3.min(xRange) + d3.max(xRange)) / 2;
      container
        .append("text")
        .attr("x", labelX)
        .attr("y", labelY)
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .text(this.xAxisName);
    }
  }

  /**
   * Draws the Y axis.
   * @private
   * @param {d3.Selection} container - The SVG container selection.
   * @param {d3.Scale} yScale - The Y scale.
   * @param {Object} margin - The margin object.
   * @param {number} width - The chart width.
   * @param {number} height - The chart height.
   */
  _drawYAxis(container, yScale, margin, width, height) {
    const yAxisGenerator =
      this.yAxisPos === "right" ? d3.axisRight : d3.axisLeft;
    const yTransform =
      this.yAxisPos === "right"
        ? `translate(${margin.left + width}, ${margin.top})`
        : `translate(${margin.left}, ${margin.top})`;

    const axis = yAxisGenerator(yScale);
    if (this.yTickCount !== undefined) axis.ticks(this.yTickCount);
    if (this.yTickFormat !== undefined) axis.tickFormat(this.yTickFormat);

    if (this.showYGrid) {
      const gridAxis = yAxisGenerator(yScale).tickSize(-width);
      if (this.yTickCount !== undefined) gridAxis.ticks(this.yTickCount);
      drawGrid(container, gridAxis, "y-grid", yTransform);
    }

    const yAxisGroup = container
      .append("g")
      .attr("class", "y-axis")
      .attr("transform", yTransform)
      .call(axis);

    if (this.yAxisName) {
      // Calculate offset based on the maximum width of tick labels
      let maxTickLabelWidth = 0;
      yAxisGroup.selectAll(".tick text").each(function () {
        const bbox = this.getBBox();
        if (bbox.width > maxTickLabelWidth) {
          maxTickLabelWidth = bbox.width;
        }
      });

      const labelOffset = maxTickLabelWidth + 20;
      const labelX =
        this.yAxisPos === "right"
          ? margin.left + width + labelOffset
          : margin.left - labelOffset;
      container
        .append("text")
        .attr("x", labelX)
        .attr("y", margin.top + height / 2)
        .attr("text-anchor", "middle")
        .attr("transform", `rotate(-90, ${labelX}, ${margin.top + height / 2})`)
        .attr("font-size", "12px")
        .text(this.yAxisName);
    }
  }
}
