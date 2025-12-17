import * as d3 from "d3";

/**
 * Renders axes for a chart.
 * @param {SVGElement} svg - The SVG container.
 * @param {Object} scales - The scales { x, y }.
 * @param {Object} dimensions - The dimensions { margin, width, height }.
 * @param {Object} options - Axis options { xAxisName, yAxisName, showXAxis, showYAxis, xAxisPos, yAxisPos }.
 */
export function drawAxes(svg, scales, dimensions, options = {}) {
  const { x: xScale, y: yScale } = scales;
  const { margin, width, height } = dimensions;
  const {
    showXAxis = true,
    showYAxis = true,
    xAxisName,
    yAxisName,
    xAxisPos = "bottom",
    yAxisPos = "left",
  } = options;

  const container = d3.select(svg);

  // Draw X Axis
  if (xScale && showXAxis) {
    const xAxisGenerator = xAxisPos === "top" ? d3.axisTop : d3.axisBottom;
    const xTransform =
      xAxisPos === "top"
        ? `translate(${margin.left}, ${margin.top})`
        : `translate(${margin.left}, ${margin.top + height})`;

    container
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", xTransform)
      .call(xAxisGenerator(xScale));

    if (xAxisName) {
      const labelY =
        xAxisPos === "top" ? margin.top - 30 : margin.top + height + 30;
      container
        .append("text")
        .attr("x", margin.left + (xScale.range()[1] - xScale.range()[0]) / 2)
        .attr("y", labelY)
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .text(xAxisName);
    }
  }

  // Draw Y Axis
  if (yScale && showYAxis) {
    const yAxisGenerator = yAxisPos === "right" ? d3.axisRight : d3.axisLeft;
    const yTransform =
      yAxisPos === "right"
        ? `translate(${margin.left + width}, ${margin.top})`
        : `translate(${margin.left}, ${margin.top})`;

    const yAxisGroup = container
      .append("g")
      .attr("class", "y-axis")
      .attr("transform", yTransform)
      .call(yAxisGenerator(yScale));

    if (yAxisName) {
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
        yAxisPos === "right"
          ? margin.left + width + labelOffset
          : margin.left - labelOffset;
      container
        .append("text")
        .attr("x", labelX)
        .attr("y", margin.top + height / 2)
        .attr("text-anchor", "middle")
        .attr("transform", `rotate(-90, ${labelX}, ${margin.top + height / 2})`)
        .attr("font-size", "12px")
        .text(yAxisName);
    }
  }
}
