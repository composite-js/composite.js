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

function scaleContainsZero(scale) {
  if (typeof scale?.invert !== "function") return false;
  const domain = scale.domain();
  return d3.min(domain) <= 0 && d3.max(domain) >= 0;
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
    this.zeroBaselineChannel = options.zeroBaselineChannel;
    this.categorySigns = options.categorySigns;
    this.xAxisPosExplicit =
      options.xAxisPosExplicit ?? options.xAxisPos !== undefined;
    this.yAxisPosExplicit =
      options.yAxisPosExplicit ?? options.yAxisPos !== undefined;
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

    if (this.zeroBaselineChannel === "x" && scaleContainsZero(xScale)) {
      const x = margin.left + xScale(0);
      moveToBack(
        container
          .append("line")
          .attr("class", "zero-baseline")
          .attr("x1", x)
          .attr("x2", x)
          .attr("y1", margin.top)
          .attr("y2", margin.top + height)
          .attr("stroke", "#475569"),
      );
    }

    if (this.zeroBaselineChannel === "y" && scaleContainsZero(yScale)) {
      const y = margin.top + yScale(0);
      moveToBack(
        container
          .append("line")
          .attr("class", "zero-baseline")
          .attr("x1", margin.left)
          .attr("x2", margin.left + width)
          .attr("y1", y)
          .attr("y2", y)
          .attr("stroke", "#475569"),
      );
    }

    // Draw X Axis
    if (xScale && this.showXAxis) {
      this._drawXAxis(container, xScale, yScale, margin, width, height);
    }

    // Draw Y Axis
    if (yScale && this.showYAxis) {
      this._drawYAxis(container, xScale, yScale, margin, width, height);
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
  _drawXAxis(container, xScale, yScale, margin, width, height) {
    const xAxisGenerator = this.xAxisPos === "top" ? d3.axisTop : d3.axisBottom;
    const edgeTransform =
      this.xAxisPos === "top"
        ? `translate(${margin.left}, ${margin.top})`
        : `translate(${margin.left}, ${margin.top + height})`;
    const atZero =
      this.zeroBaselineChannel === "y" &&
      !this.xAxisPosExplicit &&
      scaleContainsZero(yScale);
    const signedCategories =
      atZero && this.categorySigns instanceof Map && xScale.bandwidth;
    const xTransform = atZero
      ? `translate(${margin.left}, ${margin.top + yScale(0)})`
      : edgeTransform;

    const axis = xAxisGenerator(xScale);
    if (this.xTickCount !== undefined) axis.ticks(this.xTickCount);
    if (this.xTickFormat !== undefined) axis.tickFormat(this.xTickFormat);

    if (this.showXGrid) {
      const gridAxis = xAxisGenerator(xScale).tickSize(-height);
      if (this.xTickCount !== undefined) gridAxis.ticks(this.xTickCount);
      drawGrid(container, gridAxis, "x-grid", edgeTransform);
    }

    const xAxisGroup = container
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", xTransform)
      .call(axis);

    if (signedCategories) {
      const positiveIsAbove = yScale(1) < yScale(0);
      xAxisGroup.selectAll(".tick").each((category, index, nodes) => {
        const tick = d3.select(nodes[index]);
        const sign = this.categorySigns.get(category) ?? 0;
        const labelBelow = sign < 0 ? !positiveIsAbove : positiveIsAbove;
        if (sign === "mixed") {
          tick.select("line").attr("y2", 0);
          tick
            .select("text")
            .attr("y", height - yScale(0) + 9)
            .attr("dy", "0.71em");
        } else if (labelBelow) {
          tick.select("line").attr("y2", 6);
          tick.select("text").attr("y", 9).attr("dy", "0.71em");
        } else {
          tick.select("line").attr("y2", -6);
          tick.select("text").attr("y", -9).attr("dy", "0em");
        }
      });
    }

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
  _drawYAxis(container, xScale, yScale, margin, width, height) {
    const yAxisGenerator =
      this.yAxisPos === "right" ? d3.axisRight : d3.axisLeft;
    const edgeTransform =
      this.yAxisPos === "right"
        ? `translate(${margin.left + width}, ${margin.top})`
        : `translate(${margin.left}, ${margin.top})`;
    const signedCategories =
      this.zeroBaselineChannel === "x" &&
      !this.yAxisPosExplicit &&
      scaleContainsZero(xScale) &&
      this.categorySigns instanceof Map &&
      yScale.bandwidth;
    const yTransform = signedCategories
      ? `translate(${margin.left + xScale(0)}, ${margin.top})`
      : edgeTransform;

    const axis = yAxisGenerator(yScale);
    if (this.yTickCount !== undefined) axis.ticks(this.yTickCount);
    if (this.yTickFormat !== undefined) axis.tickFormat(this.yTickFormat);

    if (this.showYGrid) {
      const gridAxis = yAxisGenerator(yScale).tickSize(-width);
      if (this.yTickCount !== undefined) gridAxis.ticks(this.yTickCount);
      drawGrid(container, gridAxis, "y-grid", edgeTransform);
    }

    const yAxisGroup = container
      .append("g")
      .attr("class", "y-axis")
      .attr("transform", yTransform)
      .call(axis);

    if (signedCategories) {
      const positiveIsRight = xScale(1) > xScale(0);
      yAxisGroup.select(".domain").remove();
      yAxisGroup.selectAll(".tick").each((category, index, nodes) => {
        const tick = d3.select(nodes[index]);
        const sign = this.categorySigns.get(category) ?? 0;
        const labelOnRight = sign < 0 ? positiveIsRight : !positiveIsRight;
        if (sign === "mixed") {
          tick.select("line").attr("x2", 0);
          tick
            .select("text")
            .attr("x", -xScale(0) - 9)
            .attr("text-anchor", "end");
        } else if (labelOnRight) {
          tick.select("line").attr("x2", 6);
          tick.select("text").attr("x", 9).attr("text-anchor", "start");
        } else {
          tick.select("line").attr("x2", -6);
          tick.select("text").attr("x", -9).attr("text-anchor", "end");
        }
      });
    }

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
