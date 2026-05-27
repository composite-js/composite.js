import * as d3 from "d3";
import { MarkRenderer } from "./mark.js";
import {
  bandRange,
  bandScale,
  categoricalDomain,
  linearScale,
  xRange,
  yRange,
} from "./scale.js";
import { inferXYOrientation } from "./orientation.js";

export class DumbbellChartRenderer extends MarkRenderer {
  constructor(options = {}) {
    super(options);
    this.colors = options.colors ||
      options.colorScheme || ["#1f77b4", "#ff5a5f"];
    this.lineColor = options.lineColor || "#b8c0ff";
    this.lineWidth = options.lineWidth !== undefined ? options.lineWidth : 2;
    this.radius = options.radius !== undefined ? options.radius : 4;
    this.padding = options.padding || {
      xInner: 0.1,
      xOuter: 0.1,
      yInner: 0.1,
      yOuter: 0.1,
    };
  }

  render(svg, data) {
    const orientation = inferXYOrientation("dumbbell", data, this.encoding);

    return orientation.valueChannel === "y"
      ? this._renderHorizontal(svg, data)
      : this._renderVertical(svg, data);
  }

  _groupPairs(data, categoryField) {
    const grouped = d3.group(data, (d) => d[categoryField]);
    const pairs = Array.from(grouped, ([category, rows]) => {
      if (rows.length !== 2) {
        throw new Error(
          `Dumbbell chart requires exactly two data points for each category; "${category}" has ${rows.length}.`,
        );
      }

      return { category, rows };
    });

    return pairs;
  }

  _valueDomain(data, field, configuredDomain) {
    if (configuredDomain) {
      return configuredDomain;
    }

    const extent = d3.extent(data, (d) => Number(d[field]));
    if (extent[0] === extent[1]) {
      const pad = Math.abs(extent[0]) * 0.05 || 1;
      return [extent[0] - pad, extent[1] + pad];
    }

    return extent;
  }

  _drawPair(container, pair, getX, getY, valueField) {
    const [first, second] = pair.rows;
    const x1 = getX(first);
    const y1 = getY(first);
    const x2 = getX(second);
    const y2 = getY(second);

    container
      .append("line")
      .attr("x1", x1)
      .attr("y1", y1)
      .attr("x2", x2)
      .attr("y2", y2)
      .attr("stroke", this.lineColor)
      .attr("stroke-width", this.lineWidth)
      .attr("stroke-linecap", "round");

    pair.rows.forEach((d, index) => {
      const color = this.colors[index % this.colors.length];
      const circle = container
        .append("circle")
        .attr("cx", getX(d))
        .attr("cy", getY(d))
        .attr("r", this.radius)
        .attr("stroke", "white")
        .attr("stroke-width", 1);

      this.applyFillHover(circle, color);
      circle.append("title").text(`${pair.category}: ${d[valueField]}`);
    });
  }

  _renderVertical(svg, data) {
    const container = d3.select(svg);
    const valueField = this.encoding.x;
    const categoryField = this.encoding.y;
    const margin = this.margin;
    const chartWidth = this.width;
    const chartHeight = this.height;

    container.selectAll("*").remove();

    const pairs = this._groupPairs(data, categoryField);
    const categories = categoricalDomain(
      pairs,
      "category",
      this.encoding.yDomain,
    );
    const reverseX = this.xAxisPos === "top";
    const xScale = linearScale(
      this._valueDomain(data, valueField, this.encoding.xDomain),
      xRange(chartWidth, reverseX),
    );
    const yScale = bandScale(categories, bandRange(chartHeight), {
      inner: this.padding.yInner,
      outer: this.padding.yOuter,
    });

    pairs.forEach((pair) => {
      this._drawPair(
        container,
        pair,
        (d) => margin.left + xScale(d[valueField]),
        () => margin.top + yScale(pair.category) + yScale.bandwidth() / 2,
        valueField,
      );
    });

    return this.axisConfig(
      { x: xScale, y: yScale },
      { margin, width: chartWidth, height: chartHeight },
    );
  }

  _renderHorizontal(svg, data) {
    const container = d3.select(svg);
    const categoryField = this.encoding.x;
    const valueField = this.encoding.y;
    const margin = this.margin;
    const chartWidth = this.width;
    const chartHeight = this.height;

    container.selectAll("*").remove();

    const pairs = this._groupPairs(data, categoryField);
    const categories = categoricalDomain(
      pairs,
      "category",
      this.encoding.xDomain,
    );
    const reverseX = this.xAxisPos === "top";
    const xScale = bandScale(categories, xRange(chartWidth, reverseX), {
      inner: this.padding.xInner,
      outer: this.padding.xOuter,
    });
    const reverseY = this.yAxisPos === "right";
    const yScale = linearScale(
      this._valueDomain(data, valueField, this.encoding.yDomain),
      yRange(chartHeight, reverseY),
    );

    pairs.forEach((pair) => {
      this._drawPair(
        container,
        pair,
        () => margin.left + xScale(pair.category) + xScale.bandwidth() / 2,
        (d) => margin.top + yScale(d[valueField]),
        valueField,
      );
    });

    return this.axisConfig(
      { x: xScale, y: yScale },
      { margin, width: chartWidth, height: chartHeight },
    );
  }
}
