import * as d3 from "d3";
import { ChartRenderer } from "../renderer.js";
import {
  bandScale,
  categoricalDomain,
  continuousDomain,
  valueDomain,
  linearScale,
  xRange,
  yRange,
} from "../scale.js";

/**
 * Renderer for single- and multi-series line charts.
 */
export class LineChartRenderer extends ChartRenderer {
  constructor(options = {}) {
    super(options);
    this.color = options.color || "steelblue";
    this.colorScheme = options.colorScheme || d3.schemeCategory10;
    this.showPoints = options.showPoints !== false;
    this.pointRadius = options.pointRadius ?? 4;
    this.strokeWidth = options.strokeWidth ?? 2;
    this.padding = options.padding || { xInner: 0.1, xOuter: 0.1 };
  }

  render(svg, data) {
    const container = d3.select(svg);
    const xField = this.encoding.x;
    const yField = this.encoding.y;
    const groupField = this.encoding.group;
    const margin = this.margin;
    const chartWidth = this.width;
    const chartHeight = this.height;
    const reverseX = this.options.reverseX ?? this.xAxisPos === "top";
    const reverseY = this.options.reverseY ?? this.yAxisPos === "right";

    container.selectAll("*").remove();
    const g = container
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const configuredXDomain = this.encoding.xDomain;
    const sample = data.find((datum) => datum[xField] !== undefined);
    const categoricalX =
      typeof sample?.[xField] === "string" ||
      configuredXDomain?.some((value) => typeof value === "string");
    const xScale = categoricalX
      ? bandScale(
          categoricalDomain(data, xField, configuredXDomain),
          xRange(chartWidth, reverseX),
          this.padding,
        )
      : linearScale(
          continuousDomain(data, xField, configuredXDomain),
          xRange(chartWidth, reverseX),
        );
    const xPosition = categoricalX
      ? (datum) => xScale(datum[xField]) + xScale.bandwidth() / 2
      : (datum) => xScale(Number(datum[xField]));

    const maxValue = Math.max(...data.map((datum) => datum[yField] || 0));
    const yScale = linearScale(
      valueDomain(maxValue, this.encoding.yDomain),
      yRange(chartHeight, reverseY),
    );

    const groupDomain = groupField
      ? this.encoding.groupDomain || [
          ...new Set(data.map((datum) => datum[groupField])),
        ]
      : [undefined];
    const colorScale = d3
      .scaleOrdinal()
      .domain(groupDomain)
      .range(this.colorScheme);
    const series = groupDomain.map((key) => ({
      key,
      data: groupField
        ? data.filter((datum) => datum[groupField] === key)
        : data,
    }));
    const line = d3
      .line()
      .x(xPosition)
      .y((datum) => yScale(datum[yField]));
    const pointRadius = this.pointRadius;

    series.forEach(({ key, data: seriesData }) => {
      const color = groupField ? colorScale(key) : this.color;
      g.append("path")
        .datum(seriesData)
        .attr("class", "line-series")
        .attr("data-series", key === undefined ? "" : String(key))
        .attr("d", line)
        .attr("fill", "none")
        .attr("stroke", color)
        .attr("stroke-width", this.strokeWidth);

      if (!this.showPoints) return;
      seriesData.forEach((datum) => {
        const value = datum[yField];
        const circle = container
          .append("circle")
          .attr("class", "line-point")
          .attr("data-series", key === undefined ? "" : String(key))
          .attr("cx", margin.left + xPosition(datum))
          .attr("cy", margin.top + yScale(value))
          .attr("r", pointRadius)
          .attr("fill", "white")
          .attr("stroke", color)
          .attr("stroke-width", 2)
          .on("mouseenter", function () {
            d3.select(this)
              .attr("fill", "orange")
              .attr("r", Math.max(6, pointRadius + 2));
          })
          .on("mouseleave", function () {
            d3.select(this).attr("fill", "white").attr("r", pointRadius);
          });

        const label = groupField
          ? `${datum[xField]} - ${key}: ${value}`
          : `${datum[xField]}: ${value}`;
        circle.append("title").text(label);
      });
    });

    return this.axisConfig(
      { x: xScale, y: yScale, ...(groupField ? { group: colorScale } : {}) },
      { margin, width: chartWidth, height: chartHeight },
    );
  }
}
