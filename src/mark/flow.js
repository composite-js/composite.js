import * as d3 from "d3";
import { MarkRenderer } from "./mark.js";

export class FlowDiagramRenderer extends MarkRenderer {
  constructor(options = {}) {
    super(options);
    this.sourceDomain = options.sourceDomain;
    this.targetDomain = options.targetDomain;
    this.color = options.color || "#f5b27c";
    this.opacity = options.opacity !== undefined ? options.opacity : 0.18;
    this.minStrokeWidth =
      options.minStrokeWidth !== undefined ? options.minStrokeWidth : 0.5;
    this.maxStrokeWidth =
      options.maxStrokeWidth !== undefined ? options.maxStrokeWidth : 8;
  }

  render(svg, data) {
    const container = d3.select(svg);
    const sourceField = this.encoding.source;
    const targetField = this.encoding.target;
    const valueField = this.encoding.value;
    const margin = this.margin;
    const width = this.width;
    const height = this.height;

    container.selectAll("*").remove();

    const sourceDomain = this.sourceDomain || [
      ...new Set(data.map((d) => d[sourceField])),
    ];
    const targetDomain = this.targetDomain || [
      ...new Set(data.map((d) => d[targetField])),
    ];

    const sourceScale = d3.scaleBand().domain(sourceDomain).range([0, height]);
    const targetScale = d3.scaleBand().domain(targetDomain).range([0, height]);

    const values = data.map((d) => d[valueField] || 0);
    const minValue = d3.min(values) ?? 0;
    const maxValue = d3.max(values) ?? 0;
    const strokeScale =
      minValue === maxValue
        ? () => this.maxStrokeWidth
        : d3
            .scaleLinear()
            .domain([minValue, maxValue])
            .range([this.minStrokeWidth, this.maxStrokeWidth]);

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
        .attr("stroke", this.color)
        .attr("stroke-width", strokeScale(d[valueField] || 0))
        .attr("stroke-linecap", "round")
        .attr("opacity", this.opacity);
    });

    return null;
  }
}
