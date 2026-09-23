import * as d3 from "d3";
import { ChartRenderer } from "../renderer.js";
import { bandScale, categoricalDomain, xRange, yRange } from "../scale.js";

export class HeatmapChartRenderer extends ChartRenderer {
  constructor(options = {}) {
    super(options);
    this.color = options.color || "#2166ac";
    this.padding = options.padding || { inner: 0, outer: 0 };
  }

  render(svg, data) {
    const container = d3.select(svg);
    container.selectAll("*").remove();

    const xField = this.encoding.x;
    const groupField = this.encoding.group;
    const valueField = this.encoding.y;
    const xScale = bandScale(
      categoricalDomain(data, xField, this.encoding.xDomain),
      xRange(this.width),
      {
        inner: this.padding.xInner ?? this.padding.inner ?? 0,
        outer: this.padding.xOuter ?? this.padding.outer ?? 0,
      },
    );
    const groupScale = bandScale(
      categoricalDomain(data, groupField, this.encoding.groupDomain),
      yRange(this.height, true),
      {
        inner: this.padding.yInner ?? this.padding.inner ?? 0,
        outer: this.padding.yOuter ?? this.padding.outer ?? 0,
      },
    );
    const domain =
      this.encoding.yDomain || d3.extent(data, (d) => d[valueField]);
    const color = d3
      .scaleLinear()
      .domain(domain[0] === domain[1] ? [domain[0] - 1, domain[1]] : domain)
      .range(["white", this.color])
      .clamp(true);

    data.forEach((datum, index) => {
      const x = xScale(datum[xField]);
      const y = groupScale(datum[groupField]);
      if (x === undefined || y === undefined) return;
      const rect = this.renderStyledRect({
        container,
        left: this.margin.left + x,
        top: this.margin.top + y,
        width: xScale.bandwidth(),
        height: groupScale.bandwidth(),
        value: datum[valueField],
        datum,
        index,
        orientation: "grid",
        role: "heatmap-cell",
        fill: color(datum[valueField]),
      });
      rect
        .append("title")
        .text(`${datum[xField]} / ${datum[groupField]}: ${datum[valueField]}`);
    });

    return this.axisConfig(
      { x: xScale, y: groupScale },
      { margin: this.margin, width: this.width, height: this.height },
    );
  }
}
