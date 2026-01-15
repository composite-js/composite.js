import * as d3 from "d3";
import { MarkRenderer } from "./mark.js";

/**
 * Renderer for pie charts.
 */
export class PieChartRenderer extends MarkRenderer {
  /**
   * Creates an instance of PieChartRenderer.
   * @param {Object} options - Chart options.
   */
  constructor(options = {}) {
    super(options);
    this.colorScheme = options.colorScheme || d3.schemeCategory10;
    this.showLabels = options.showLabels || false;
  }

  /**
   * Renders a pie chart.
   * @param {SVGElement} svg - The SVG container.
   * @param {Array} data - The data to render.
   * @returns {null} Pie charts don't return axis config.
   */
  render(svg, data) {
    const container = d3.select(svg);
    const valueField = this.encoding.y || this.encoding.value;
    const categoryField = this.encoding.color || this.encoding.category || "id";

    // Clear content
    container.selectAll("*").remove();

    const radius = Math.min(this.width, this.height) / 2;
    const pie = d3.pie().value((d) => d[valueField]);
    const arc = d3.arc().innerRadius(0).outerRadius(radius);

    // Create color scale
    const uniqueCategories = [...new Set(data.map((d) => d[categoryField]))];
    const color = d3.scaleOrdinal(this.colorScheme).domain(uniqueCategories);

    const g = container
      .append("g")
      .attr("transform", `translate(${this.width / 2}, ${this.height / 2})`);

    const arcs = g
      .selectAll("arc")
      .data(pie(data))
      .enter()
      .append("g")
      .attr("class", "arc");

    arcs
      .append("path")
      .attr("d", arc)
      .attr("fill", (d) => color(d.data[categoryField]))
      .attr("stroke", "white")
      .style("stroke-width", "2px");

    if (this.showLabels) {
      const labelArc = d3
        .arc()
        .outerRadius(radius - 40)
        .innerRadius(radius - 40);
      arcs
        .append("text")
        .attr("transform", (d) => `translate(${labelArc.centroid(d)})`)
        .attr("dy", "0.35em")
        .text((d) => d.data[categoryField]);
    }

    return null;
  }
}
