import * as d3 from "d3";
import { MarkRenderer } from "./mark.js";

export class ProportionalAreaChartRenderer extends MarkRenderer {
  constructor(options = {}) {
    super(options);
    this.direction = options.direction || "vertical";
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
    return this.direction === "horizontal"
      ? this._renderHorizontal(svg, data)
      : this._renderVertical(svg, data);
  }

  _domains(data) {
    const categoryField = this.encoding.category;
    return (
      this.encoding.categoryDomain ||
      this.encoding.xDomain ||
      this.encoding.yDomain || [...new Set(data.map((d) => d[categoryField]))]
    );
  }

  _maxShapeSize(mainSize, crossSize) {
    return Math.max(0, Math.min(mainSize, crossSize));
  }

  _sizeScale(data, maxShapeSize) {
    const valueField = this.encoding.value;
    const maxValue = d3.max(data, (d) =>
      Math.max(0, Number(d[valueField]) || 0),
    );

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
    const container = d3.select(svg);
    const categoryField = this.encoding.category;
    const valueField = this.encoding.value;
    const margin = this.margin;
    const chartWidth = this.width;
    const chartHeight = this.height;
    const categories = this._domains(data);

    container.selectAll("*").remove();

    const maxShapeSize = this._maxShapeSize(chartHeight, chartWidth);
    const maxRadius = maxShapeSize / 2;
    const yScale = d3
      .scalePoint()
      .domain(categories)
      .range([maxRadius, chartHeight - maxRadius]);
    const sizeScale = this._sizeScale(data, maxShapeSize);
    const colorScale = this._colorScale(categories);

    data.forEach((d) => {
      const size = sizeScale(d[valueField]);
      const x = margin.left + chartWidth / 2;
      const y = margin.top + yScale(d[categoryField]);

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
    const container = d3.select(svg);
    const categoryField = this.encoding.category;
    const valueField = this.encoding.value;
    const margin = this.margin;
    const chartWidth = this.width;
    const chartHeight = this.height;
    const categories = this._domains(data);

    container.selectAll("*").remove();

    const maxShapeSize = this._maxShapeSize(chartWidth, chartHeight);
    const maxRadius = maxShapeSize / 2;
    const xScale = d3
      .scalePoint()
      .domain(categories)
      .range([maxRadius, chartWidth - maxRadius]);
    const sizeScale = this._sizeScale(data, maxShapeSize);
    const colorScale = this._colorScale(categories);

    data.forEach((d) => {
      const size = sizeScale(d[valueField]);
      const x = margin.left + xScale(d[categoryField]);
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
