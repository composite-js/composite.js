import * as d3 from "d3";
import { MarkRenderer } from "./mark.js";

export class FlowDiagramRenderer extends MarkRenderer {
  constructor(options = {}) {
    super(options);
    this.sourceDomain = options.sourceDomain;
    this.targetDomain = options.targetDomain;
    this.direction = options.direction || "horizontal";
    this.colors = options.colors || (Array.isArray(options.color) ? options.color : null);
    this.color = Array.isArray(options.color)
      ? options.color[0] || "#f5b27c"
      : options.color || "#f5b27c";
    this.colorBy = options.colorBy || "target";
    this.opacity = options.opacity !== undefined ? options.opacity : 0.18;
    this.showLabels =
      options.showLabels !== undefined ? options.showLabels : false;
    this.showSourceLabels =
      options.showSourceLabels !== undefined
        ? options.showSourceLabels
        : this.showLabels;
    this.showTargetLabels =
      options.showTargetLabels !== undefined
        ? options.showTargetLabels
        : this.showLabels;
    this.sourceLabelName = options.sourceLabelName || "";
    this.targetLabelName = options.targetLabelName || "";
    this.labelFill = options.labelFill || "currentColor";
    this.labelFontSize = options.labelFontSize || 10;
    this.labelPadding = options.labelPadding !== undefined ? options.labelPadding : 6;
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
    const values = data.map((d) => d[valueField] || 0);
    const minValue = d3.min(values) ?? 0;
    const maxValue = d3.max(values) ?? 0;

    return minValue === maxValue
      ? () => this.maxStrokeWidth
      : d3
          .scaleLinear()
          .domain([minValue, maxValue])
          .range([this.minStrokeWidth, this.maxStrokeWidth]);
  }

  _domains(data, sourceField, targetField) {
    return {
      sourceDomain: this.sourceDomain || [
        ...new Set(data.map((d) => d[sourceField])),
      ],
      targetDomain: this.targetDomain || [
        ...new Set(data.map((d) => d[targetField])),
      ],
    };
  }

  _colorScale(sourceDomain, targetDomain) {
    if (!this.colors) {
      return () => this.color;
    }

    const domain = this.colorBy === "source" ? sourceDomain : targetDomain;
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

  _drawHorizontalLabels(container, sourceScale, targetScale, sourceDomain, targetDomain) {
    const margin = this.margin;
    const width = this.width;

    if (this.sourceLabelName) {
      this._drawText(
        container,
        this.sourceLabelName,
        margin.left,
        margin.top - this.labelPadding * 2,
        { anchor: "start", weight: "700" },
      );
    }

    if (this.targetLabelName) {
      this._drawText(
        container,
        this.targetLabelName,
        margin.left + width,
        margin.top - this.labelPadding * 2,
        { anchor: "end", weight: "700" },
      );
    }

    if (this.showSourceLabels) {
      sourceDomain.forEach((value) => {
        this._drawText(
          container,
          value,
          margin.left - this.labelPadding,
          margin.top + sourceScale(value) + sourceScale.bandwidth() / 2,
          { anchor: "end" },
        );
      });
    }

    if (this.showTargetLabels) {
      targetDomain.forEach((value) => {
        this._drawText(
          container,
          value,
          margin.left + width + this.labelPadding,
          margin.top + targetScale(value) + targetScale.bandwidth() / 2,
          { anchor: "start" },
        );
      });
    }
  }

  _drawVerticalLabels(container, sourceScale, targetScale, sourceDomain, targetDomain) {
    const margin = this.margin;
    const height = this.height;

    if (this.sourceLabelName) {
      this._drawText(
        container,
        this.sourceLabelName,
        margin.left,
        margin.top - this.labelPadding * 2,
        { anchor: "start", weight: "700" },
      );
    }

    if (this.targetLabelName) {
      this._drawText(
        container,
        this.targetLabelName,
        margin.left,
        margin.top + height + this.labelPadding * 2,
        { anchor: "start", weight: "700" },
      );
    }

    if (this.showSourceLabels) {
      sourceDomain.forEach((value) => {
        this._drawText(
          container,
          value,
          margin.left + sourceScale(value) + sourceScale.bandwidth() / 2,
          margin.top - this.labelPadding,
        );
      });
    }

    if (this.showTargetLabels) {
      targetDomain.forEach((value) => {
        this._drawText(
          container,
          value,
          margin.left + targetScale(value) + targetScale.bandwidth() / 2,
          margin.top + height + this.labelPadding,
        );
      });
    }
  }

  _renderHorizontal(svg, data) {
    const container = d3.select(svg);
    const sourceField = this.encoding.source;
    const targetField = this.encoding.target;
    const valueField = this.encoding.value;
    const margin = this.margin;
    const width = this.width;
    const height = this.height;

    container.selectAll("*").remove();

    const { sourceDomain, targetDomain } = this._domains(
      data,
      sourceField,
      targetField,
    );

    const sourceScale = d3.scaleBand().domain(sourceDomain).range([0, height]);
    const targetScale = d3.scaleBand().domain(targetDomain).range([0, height]);

    const strokeScale = this._strokeScale(data, valueField);
    const colorScale = this._colorScale(sourceDomain, targetDomain);

    this._drawHorizontalLabels(
      container,
      sourceScale,
      targetScale,
      sourceDomain,
      targetDomain,
    );

    data.forEach((d) => {
      const x1 = margin.left;
      const x2 = margin.left + width;
      const y1 =
        margin.top + sourceScale(d[sourceField]) + sourceScale.bandwidth() / 2;
      const y2 =
        margin.top + targetScale(d[targetField]) + targetScale.bandwidth() / 2;
      const midX = margin.left + width / 2;

      container
        .append("path")
        .attr("d", `M${x1},${y1}C${midX},${y1} ${midX},${y2} ${x2},${y2}`)
        .attr("fill", "none")
        .attr(
          "stroke",
          colorScale(this.colorBy === "source" ? d[sourceField] : d[targetField]),
        )
        .attr("stroke-width", strokeScale(d[valueField] || 0))
        .attr("stroke-linecap", "round")
        .attr("opacity", this.opacity);
    });

    return null;
  }

  _renderVertical(svg, data) {
    const container = d3.select(svg);
    const sourceField = this.encoding.source;
    const targetField = this.encoding.target;
    const valueField = this.encoding.value;
    const margin = this.margin;
    const width = this.width;
    const height = this.height;

    container.selectAll("*").remove();

    const { sourceDomain, targetDomain } = this._domains(
      data,
      sourceField,
      targetField,
    );

    const sourceScale = d3.scaleBand().domain(sourceDomain).range([0, width]);
    const targetScale = d3.scaleBand().domain(targetDomain).range([0, width]);
    const strokeScale = this._strokeScale(data, valueField);
    const colorScale = this._colorScale(sourceDomain, targetDomain);

    this._drawVerticalLabels(
      container,
      sourceScale,
      targetScale,
      sourceDomain,
      targetDomain,
    );

    data.forEach((d) => {
      const x1 =
        margin.left + sourceScale(d[sourceField]) + sourceScale.bandwidth() / 2;
      const x2 =
        margin.left + targetScale(d[targetField]) + targetScale.bandwidth() / 2;
      const y1 = margin.top;
      const y2 = margin.top + height;
      const midY = margin.top + height / 2;

      container
        .append("path")
        .attr("d", `M${x1},${y1}C${x1},${midY} ${x2},${midY} ${x2},${y2}`)
        .attr("fill", "none")
        .attr(
          "stroke",
          colorScale(this.colorBy === "source" ? d[sourceField] : d[targetField]),
        )
        .attr("stroke-width", strokeScale(d[valueField] || 0))
        .attr("stroke-linecap", "round")
        .attr("opacity", this.opacity);
    });

    return null;
  }
}
