import * as d3 from "d3";
import { ChartRenderer } from "../renderer.js";
import {
  categoricalDomain,
  linearScale,
  pointScale,
  xRange,
  yRange,
} from "../scale.js";

/**
 * Renderer for stream graphs.
 */
export class StreamGraphRenderer extends ChartRenderer {
  constructor(options = {}) {
    super(options);
    this.colorScheme = options.colorScheme || d3.schemePastel1;
    this.colors = options.colors;
    this.opacity = options.opacity !== undefined ? options.opacity : 0.75;
    this.curve = options.curve || d3.curveBasis;
    this.direction = options.direction || "horizontal";
    this.showXAxis =
      options.showXAxis !== undefined ? options.showXAxis : false;
    this.showYAxis =
      options.showYAxis !== undefined ? options.showYAxis : false;
  }

  render(svg, data) {
    const container = d3.select(svg);
    const xField = this.encoding.x;
    const yField = this.encoding.y;
    const groupField = this.encoding.group;
    const margin = this.margin;
    const chartWidth = this.width;
    const chartHeight = this.height;

    container.selectAll("*").remove();

    const xDomain = categoricalDomain(data, xField, this.encoding.xDomain);
    const seriesKeys = this.encoding.groupDomain || [
      ...new Set(data.map((d) => d[groupField])),
    ];

    const byX = d3.group(data, (d) => d[xField]);
    const pivotedData = xDomain.map((xValue) => {
      const row = { [xField]: xValue };
      const rows = byX.get(xValue) || [];

      seriesKeys.forEach((key) => {
        const datum = rows.find((d) => d[groupField] === key);
        row[key] = datum ? Number(datum[yField]) || 0 : 0;
      });

      return row;
    });

    const stack = d3
      .stack()
      .keys(seriesKeys)
      .value((d, key) => d[key])
      .order(d3.stackOrderInsideOut)
      .offset(d3.stackOffsetWiggle);

    const layers = stack(pivotedData);
    const yExtent = d3.extent(layers.flat(2));

    const xScale = pointScale(xDomain, xRange(chartWidth), 0);

    const valueScale = linearScale(
      this.encoding.yDomain || yExtent,
      this.direction === "vertical" ? xRange(chartWidth) : yRange(chartHeight),
    );

    const colorScale = d3
      .scaleOrdinal()
      .domain(seriesKeys)
      .range(this.colors || this.colorScheme);

    const yScale =
      this.direction === "vertical"
        ? pointScale(xDomain, [0, chartHeight], 0)
        : valueScale;

    const area =
      this.direction === "vertical"
        ? d3
            .area()
            .y((d) => margin.top + yScale(d.data[xField]))
            .x0((d) => margin.left + valueScale(d[0]))
            .x1((d) => margin.left + valueScale(d[1]))
            .curve(this.curve)
        : d3
            .area()
            .x((d) => margin.left + xScale(d.data[xField]))
            .y0((d) => margin.top + valueScale(d[0]))
            .y1((d) => margin.top + valueScale(d[1]))
            .curve(this.curve);

    layers.forEach((layer) => {
      const path = container
        .append("path")
        .datum(layer)
        .attr("d", area)
        .attr("fill", colorScale(layer.key))
        .attr("opacity", this.opacity)
        .attr("stroke", "none");

      this.applyOpacityHover(
        path,
        Math.max(0.35, this.opacity - 0.2),
        this.opacity,
      );
      path.append("title").text(layer.key);
    });

    return this.axisConfig(
      this.direction === "vertical"
        ? { x: valueScale, y: yScale }
        : { x: xScale, y: valueScale },
      { margin, width: chartWidth, height: chartHeight },
    );
  }
}
