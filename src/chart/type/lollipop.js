import * as d3 from "d3";
import { ChartRenderer } from "../renderer.js";
import { inferXYOrientation } from "../orientation.js";
import {
  bandScale,
  bandRange,
  categoricalDomain,
  linearScale,
  valueDomain,
  xRange,
  yRange,
} from "../scale.js";

export class LollipopChartRenderer extends ChartRenderer {
  constructor(options = {}) {
    super(options);
    this.color = options.color || "steelblue";
    this.radius = options.radius ?? 5;
    this.strokeWidth = options.strokeWidth ?? 2;
    this.padding = options.padding || { xInner: 0.1, xOuter: 0.1 };
  }

  render(svg, data) {
    const container = d3.select(svg);
    container.selectAll("*").remove();

    const orientation = inferXYOrientation("lollipop", data, this.encoding);
    const horizontal = orientation.direction === "horizontal";
    const categoryField = orientation.categoryField;
    const valueField = orientation.valueField;
    const categoryChannel = orientation.categoryChannel;
    const valueChannel = orientation.valueChannel;
    const categoryScale = bandScale(
      categoricalDomain(
        data,
        categoryField,
        this.encoding[`${categoryChannel}Domain`],
      ),
      horizontal ? bandRange(this.height) : xRange(this.width),
      this.padding,
    );
    const valueScale = linearScale(
      valueDomain(
        d3.max(data, (datum) => datum[valueField]),
        this.encoding[`${valueChannel}Domain`],
      ),
      horizontal ? xRange(this.width) : yRange(this.height),
    );

    data.forEach((datum, index) => {
      const center =
        categoryScale(datum[categoryField]) + categoryScale.bandwidth() / 2;
      const tip = valueScale(datum[valueField]);
      const baseline = valueScale(0);
      const cx = this.margin.left + (horizontal ? tip : center);
      const cy = this.margin.top + (horizontal ? center : tip);

      container
        .append("line")
        .attr("class", "lollipop-stem")
        .attr("x1", this.margin.left + (horizontal ? baseline : center))
        .attr("y1", this.margin.top + (horizontal ? center : baseline))
        .attr("x2", cx)
        .attr("y2", cy)
        .attr("stroke", this.color)
        .attr("stroke-width", this.strokeWidth);

      const circle = this.renderStyledCircle({
        container,
        centerX: cx,
        centerY: cy,
        radius: this.radius,
        left: cx - this.radius,
        top: cy - this.radius,
        width: this.radius * 2,
        height: this.radius * 2,
        value: datum[valueField],
        category: datum[categoryField],
        datum,
        index,
        orientation: orientation.direction,
        role: "lollipop",
        fill: this.color,
      });
      circle
        .append("title")
        .text(`${datum[categoryField]}: ${datum[valueField]}`);
    });

    return this.axisConfig(
      horizontal
        ? { x: valueScale, y: categoryScale }
        : { x: categoryScale, y: valueScale },
      { margin: this.margin, width: this.width, height: this.height },
    );
  }
}
