import * as d3 from "d3";
import { MarkRenderer } from "./mark.js";
import { bandScale, categoricalDomain } from "./scale.js";
import { inferXYOrientation } from "./orientation.js";

export class ProportionalAreaChartRenderer extends MarkRenderer {
  constructor(options = {}) {
    super(options);
    this.shape = options.shape || "circle";
    this.color = options.color || "steelblue";
    this.colors = options.colors;
    this.colorScheme = options.colorScheme || d3.schemeCategory10;
    this.opacity = options.opacity !== undefined ? options.opacity : 0.72;
    this.showXAxis =
      options.showXAxis !== undefined ? options.showXAxis : false;
    this.showYAxis =
      options.showYAxis !== undefined ? options.showYAxis : false;
    this.padding = options.padding || {
      xInner: 0.15,
      xOuter: 0.15,
      yInner: 0.15,
      yOuter: 0.15,
    };
  }

  render(svg, data) {
    const orientation = inferXYOrientation("pac", data, this.encoding);

    return orientation.valueChannel === "y"
      ? this._renderHorizontal(svg, data)
      : this._renderVertical(svg, data);
  }

  _categoryDomain(data, categoryField, categoryChannel) {
    return categoricalDomain(
      data,
      categoryField,
      this.encoding[`${categoryChannel}Domain`],
    );
  }

  _maxShapeSize(bandwidth, crossSize) {
    return Math.max(0, Math.min(bandwidth, crossSize));
  }

  _sizeScale(data, maxShapeSize, valueField, valueChannel) {
    const configuredDomain = this.encoding[`${valueChannel}Domain`];
    const maxValue =
      configuredDomain !== undefined
        ? d3.max(configuredDomain, (value) => Math.max(0, Number(value) || 0))
        : d3.max(data, (d) => Math.max(0, Number(d[valueField]) || 0));

    if (!maxValue) {
      return () => 0;
    }

    return (value) =>
      Math.sqrt(Math.max(0, Number(value) || 0) / maxValue) * maxShapeSize;
  }

  _colorScale(categories) {
    if (this.colors) {
      return d3.scaleOrdinal().domain(categories).range(this.colors);
    }

    return () => this.color;
  }

  _drawShape(container, d, x, y, size, color, categoryField, valueField) {
    if (this.shape === "square") {
      const rect = container
        .append("rect")
        .attr("x", x - size / 2)
        .attr("y", y - size / 2)
        .attr("width", size)
        .attr("height", size)
        .attr("opacity", this.opacity)
        .attr("stroke", "white")
        .attr("stroke-width", 1);

      this.applyFillHover(rect, color);
      rect.append("title").text(`${d[categoryField]}: ${d[valueField]}`);
      return;
    }

    const circle = container
      .append("circle")
      .attr("cx", x)
      .attr("cy", y)
      .attr("r", size / 2)
      .attr("opacity", this.opacity)
      .attr("stroke", "white")
      .attr("stroke-width", 1);

    this.applyFillHover(circle, color);
    circle.append("title").text(`${d[categoryField]}: ${d[valueField]}`);
  }

  _renderVertical(svg, data) {
    const orientation = inferXYOrientation("pac", data, this.encoding);
    const container = d3.select(svg);
    const categoryField = orientation.categoryField;
    const valueField = orientation.valueField;
    const margin = this.margin;
    const chartWidth = this.width;
    const chartHeight = this.height;
    const categories = this._categoryDomain(
      data,
      categoryField,
      orientation.categoryChannel,
    );

    container.selectAll("*").remove();

    const yScale = bandScale(categories, [0, chartHeight], {
      inner: this.padding.yInner,
      outer: this.padding.yOuter,
    });
    const maxShapeSize = this._maxShapeSize(yScale.bandwidth(), chartWidth);
    const sizeScale = this._sizeScale(
      data,
      maxShapeSize,
      valueField,
      orientation.valueChannel,
    );
    const colorScale = this._colorScale(categories);

    data.forEach((d) => {
      const size = sizeScale(d[valueField]);
      const x = margin.left + chartWidth / 2;
      const y = margin.top + yScale(d[categoryField]) + yScale.bandwidth() / 2;

      this._drawShape(
        container,
        d,
        x,
        y,
        size,
        colorScale(d[categoryField]),
        categoryField,
        valueField,
      );
    });

    return this.axisConfig(
      { y: yScale },
      { margin, width: chartWidth, height: chartHeight },
    );
  }

  _renderHorizontal(svg, data) {
    const orientation = inferXYOrientation("pac", data, this.encoding);
    const container = d3.select(svg);
    const categoryField = orientation.categoryField;
    const valueField = orientation.valueField;
    const margin = this.margin;
    const chartWidth = this.width;
    const chartHeight = this.height;
    const categories = this._categoryDomain(
      data,
      categoryField,
      orientation.categoryChannel,
    );

    container.selectAll("*").remove();

    const xScale = bandScale(categories, [0, chartWidth], {
      inner: this.padding.xInner,
      outer: this.padding.xOuter,
    });
    const maxShapeSize = this._maxShapeSize(xScale.bandwidth(), chartHeight);
    const sizeScale = this._sizeScale(
      data,
      maxShapeSize,
      valueField,
      orientation.valueChannel,
    );
    const colorScale = this._colorScale(categories);

    data.forEach((d) => {
      const size = sizeScale(d[valueField]);
      const x = margin.left + xScale(d[categoryField]) + xScale.bandwidth() / 2;
      const y = margin.top + chartHeight / 2;

      this._drawShape(
        container,
        d,
        x,
        y,
        size,
        colorScale(d[categoryField]),
        categoryField,
        valueField,
      );
    });

    return this.axisConfig(
      { x: xScale },
      { margin, width: chartWidth, height: chartHeight },
    );
  }
}
