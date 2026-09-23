import * as d3 from "d3";
import { ChartRenderer } from "../renderer.js";
import { continuousDomain, linearScale, xRange, yRange } from "../scale.js";

export class HistogramChartRenderer extends ChartRenderer {
  constructor(options = {}) {
    super(options);
    this.color = options.color || "steelblue";
    this.binCount = options.binCount ?? 10;
  }

  render(svg, data) {
    const container = d3.select(svg);
    container.selectAll("*").remove();

    const field = this.encoding.x;
    const domain = continuousDomain(data, field, this.encoding.xDomain);
    const [start, end] = domain;
    const thresholds = d3
      .range(1, this.binCount)
      .map((index) => start + ((end - start) * index) / this.binCount);
    const bins = d3
      .bin()
      .value((datum) => datum[field])
      .domain(domain)
      .thresholds(thresholds)(data);
    const xScale = linearScale(domain, xRange(this.width));
    const yScale = linearScale(
      this.encoding.yDomain || [0, d3.max(bins, (bin) => bin.length) || 0],
      yRange(this.height),
    );

    bins.forEach((bin, index) => {
      const x0 = xScale(bin.x0);
      const x1 = xScale(bin.x1);
      const y = yScale(bin.length);
      const baseline = yScale(0);
      const rect = this.renderStyledRect({
        container,
        left: this.margin.left + Math.min(x0, x1),
        top: this.margin.top + Math.min(y, baseline),
        width: Math.max(0, Math.abs(x1 - x0) - 1),
        height: Math.abs(y - baseline),
        value: bin.length,
        datum: bin,
        index,
        orientation: "vertical",
        role: "histogram-bin",
        fill: this.color,
      });
      rect.append("title").text(`${bin.x0}–${bin.x1}: ${bin.length}`);
    });

    return this.axisConfig(
      { x: xScale, y: yScale },
      { margin: this.margin, width: this.width, height: this.height },
    );
  }
}
