import * as d3 from "d3";
import { MarkRenderer } from "./mark.js";

export class FlowDiagramRenderer extends MarkRenderer {
  constructor(options = {}) {
    super(options);
    this.direction = options.direction || "horizontal";
    this.colors =
      options.colors || (Array.isArray(options.color) ? options.color : null);
    this.color = Array.isArray(options.color)
      ? options.color[0] || "#f5b27c"
      : options.color || "#f5b27c";
    this.colorBy = options.colorBy || "group";
    this.opacity = options.opacity !== undefined ? options.opacity : 0.18;
    this.showLabels =
      options.showLabels !== undefined ? options.showLabels : false;
    this.showXLabels =
      options.showXLabels !== undefined ? options.showXLabels : this.showLabels;
    this.showGroupLabels =
      options.showGroupLabels !== undefined
        ? options.showGroupLabels
        : this.showLabels;
    this.xLabelName = options.xLabelName || "";
    this.groupLabelName = options.groupLabelName || "";
    this.labelFill = options.labelFill || "currentColor";
    this.labelFontSize = options.labelFontSize || 10;
    this.labelPadding =
      options.labelPadding !== undefined ? options.labelPadding : 6;
    this.minStrokeWidth =
      options.minStrokeWidth !== undefined ? options.minStrokeWidth : 0.5;
    this.maxStrokeWidth =
      options.maxStrokeWidth !== undefined ? options.maxStrokeWidth : 8;
  }

  render(svg, data) {
    return this.direction === "vertical"
      ? this._renderVertical(svg, data)
      : this._renderHorizontal(svg, data);
  }

  _strokeScale(data, valueField) {
    const domain = this.encoding.yDomain;
    const values = data.map((d) => d[valueField] || 0);
    const minValue = domain ? domain[0] : (d3.min(values) ?? 0);
    const maxValue = domain ? domain[1] : (d3.max(values) ?? 0);

    return minValue === maxValue
      ? () => this.maxStrokeWidth
      : d3
          .scaleLinear()
          .domain([minValue, maxValue])
          .range([this.minStrokeWidth, this.maxStrokeWidth]);
  }

  _domains(data, xField, groupField) {
    return {
      xDomain: this.encoding.xDomain || [
        ...new Set(data.map((d) => d[xField])),
      ],
      groupDomain: this.encoding.groupDomain || [
        ...new Set(data.map((d) => d[groupField])),
      ],
    };
  }

  _colorScale(xDomain, groupDomain) {
    if (!this.colors) {
      return () => this.color;
    }

    const domain = this.colorBy === "x" ? xDomain : groupDomain;
    return d3.scaleOrdinal().domain(domain).range(this.colors);
  }

  _drawText(container, text, x, y, options = {}) {
    container
      .append("text")
      .attr("x", x)
      .attr("y", y)
      .attr("text-anchor", options.anchor || "middle")
      .attr("dominant-baseline", options.baseline || "middle")
      .attr("font-size", `${this.labelFontSize}px`)
      .attr("font-weight", options.weight || null)
      .attr("fill", this.labelFill)
      .text(text);
  }

  _drawHorizontalLabels(container, xScale, groupScale, xDomain, groupDomain) {
    const margin = this.margin;
    const width = this.width;

    if (this.xLabelName) {
      this._drawText(
        container,
        this.xLabelName,
        margin.left,
        margin.top - this.labelPadding * 2,
        { anchor: "start", weight: "700" },
      );
    }

    if (this.groupLabelName) {
      this._drawText(
        container,
        this.groupLabelName,
        margin.left + width,
        margin.top - this.labelPadding * 2,
        { anchor: "end", weight: "700" },
      );
    }

    if (this.showXLabels) {
      xDomain.forEach((value) => {
        this._drawText(
          container,
          value,
          margin.left - this.labelPadding,
          margin.top + xScale(value) + xScale.bandwidth() / 2,
          { anchor: "end" },
        );
      });
    }

    if (this.showGroupLabels) {
      groupDomain.forEach((value) => {
        this._drawText(
          container,
          value,
          margin.left + width + this.labelPadding,
          margin.top + groupScale(value) + groupScale.bandwidth() / 2,
          { anchor: "start" },
        );
      });
    }
  }

  _drawVerticalLabels(container, xScale, groupScale, xDomain, groupDomain) {
    const margin = this.margin;
    const height = this.height;

    if (this.xLabelName) {
      this._drawText(
        container,
        this.xLabelName,
        margin.left,
        margin.top - this.labelPadding * 2,
        { anchor: "start", weight: "700" },
      );
    }

    if (this.groupLabelName) {
      this._drawText(
        container,
        this.groupLabelName,
        margin.left,
        margin.top + height + this.labelPadding * 2,
        { anchor: "start", weight: "700" },
      );
    }

    if (this.showXLabels) {
      xDomain.forEach((value) => {
        this._drawText(
          container,
          value,
          margin.left + xScale(value) + xScale.bandwidth() / 2,
          margin.top - this.labelPadding,
        );
      });
    }

    if (this.showGroupLabels) {
      groupDomain.forEach((value) => {
        this._drawText(
          container,
          value,
          margin.left + groupScale(value) + groupScale.bandwidth() / 2,
          margin.top + height + this.labelPadding,
        );
      });
    }
  }

  _renderHorizontal(svg, data) {
    const container = d3.select(svg);
    const xField = this.encoding.x;
    const groupField = this.encoding.group;
    const valueField = this.encoding.y;
    const margin = this.margin;
    const width = this.width;
    const height = this.height;

    container.selectAll("*").remove();

    const { xDomain, groupDomain } = this._domains(data, xField, groupField);

    const xScale = d3.scaleBand().domain(xDomain).range([0, height]);
    const groupScale = d3.scaleBand().domain(groupDomain).range([0, height]);

    const strokeScale = this._strokeScale(data, valueField);
    const colorScale = this._colorScale(xDomain, groupDomain);

    this._drawHorizontalLabels(
      container,
      xScale,
      groupScale,
      xDomain,
      groupDomain,
    );

    data.forEach((d) => {
      const x1 = margin.left;
      const x2 = margin.left + width;
      const y1 = margin.top + xScale(d[xField]) + xScale.bandwidth() / 2;
      const y2 =
        margin.top + groupScale(d[groupField]) + groupScale.bandwidth() / 2;
      const midX = margin.left + width / 2;

      container
        .append("path")
        .attr("d", `M${x1},${y1}C${midX},${y1} ${midX},${y2} ${x2},${y2}`)
        .attr("fill", "none")
        .attr(
          "stroke",
          colorScale(this.colorBy === "x" ? d[xField] : d[groupField]),
        )
        .attr("stroke-width", strokeScale(d[valueField] || 0))
        .attr("stroke-linecap", "round")
        .attr("opacity", this.opacity);
    });

    return null;
  }

  _renderVertical(svg, data) {
    const container = d3.select(svg);
    const xField = this.encoding.x;
    const groupField = this.encoding.group;
    const valueField = this.encoding.y;
    const margin = this.margin;
    const width = this.width;
    const height = this.height;

    container.selectAll("*").remove();

    const { xDomain, groupDomain } = this._domains(data, xField, groupField);

    const xScale = d3.scaleBand().domain(xDomain).range([0, width]);
    const groupScale = d3.scaleBand().domain(groupDomain).range([0, width]);
    const strokeScale = this._strokeScale(data, valueField);
    const colorScale = this._colorScale(xDomain, groupDomain);

    this._drawVerticalLabels(
      container,
      xScale,
      groupScale,
      xDomain,
      groupDomain,
    );

    data.forEach((d) => {
      const x1 = margin.left + xScale(d[xField]) + xScale.bandwidth() / 2;
      const x2 =
        margin.left + groupScale(d[groupField]) + groupScale.bandwidth() / 2;
      const y1 = margin.top;
      const y2 = margin.top + height;
      const midY = margin.top + height / 2;

      container
        .append("path")
        .attr("d", `M${x1},${y1}C${x1},${midY} ${x2},${midY} ${x2},${y2}`)
        .attr("fill", "none")
        .attr(
          "stroke",
          colorScale(this.colorBy === "x" ? d[xField] : d[groupField]),
        )
        .attr("stroke-width", strokeScale(d[valueField] || 0))
        .attr("stroke-linecap", "round")
        .attr("opacity", this.opacity);
    });

    return null;
  }
}
