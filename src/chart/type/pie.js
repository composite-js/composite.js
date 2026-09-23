import * as d3 from "d3";
import { ChartRenderer } from "../renderer.js";

/**
 * Renderer for pie charts.
 */
export class PieChartRenderer extends ChartRenderer {
  /**
   * Creates an instance of PieChartRenderer.
   * @param {Object} options - Chart options.
   */
  constructor(options = {}) {
    super(options);
    this.colorScheme = options.colorScheme || d3.schemeCategory10;
    this.showLabels = options.showLabels || false;
    this.innerRadius = options.innerRadius || 0;
  }

  /**
   * Renders a pie chart.
   * @param {SVGElement} svg - The SVG container.
   * @param {Array} data - The data to render.
   * @returns {null} Pie charts don't return axis config.
   */
  render(svg, data) {
    const container = d3.select(svg);
    const categoryField = this.encoding.x;
    const valueField = this.encoding.y;
    const margin = this.margin;

    // Clear content
    container.selectAll("*").remove();

    const radius = Math.min(this.width, this.height) / 2;
    const pie = d3.pie().value((d) => d[valueField]);

    // Create color scale
    const uniqueCategories = this.encoding.xDomain || [
      ...new Set(data.map((d) => d[categoryField])),
    ];
    const color = d3.scaleOrdinal(this.colorScheme).domain(uniqueCategories);

    const g = container
      .append("g")
      .attr(
        "transform",
        `translate(${margin.left + this.width / 2}, ${margin.top + this.height / 2})`,
      );

    const arcs = g
      .selectAll("arc")
      .data(pie(data))
      .enter()
      .append("g")
      .attr("class", "arc");

    arcs.each((d, index, nodes) => {
      const path = this.renderStyledSector({
        container: d3.select(nodes[index]),
        arcDatum: d,
        startAngle: d.startAngle,
        endAngle: d.endAngle,
        innerRadius: this.innerRadius,
        outerRadius: radius,
        value: d.data[valueField],
        category: d.data[categoryField],
        datum: d.data,
        index,
        orientation: "radial",
        role: "sector",
        fill: color(d.data[categoryField]),
        stroke: "white",
      });

      path.attr("stroke", "white").style("stroke-width", "2px");
    });

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
