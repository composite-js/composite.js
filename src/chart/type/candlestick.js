import * as d3 from "d3";
import { ChartRenderer } from "../renderer.js";
import {
  bandScale,
  categoricalDomain,
  continuousDomain,
  linearScale,
  xRange,
  yRange,
} from "../scale.js";

function priceDomain(data, encoding) {
  if (encoding.yDomain !== undefined) return encoding.yDomain;

  const values = data.flatMap((datum) => [
    Number(datum[encoding.low]),
    Number(datum[encoding.high]),
  ]);
  const [minimum, maximum] = d3.extent(values);

  if (minimum === maximum) {
    const padding = Math.abs(minimum) * 0.05 || 1;
    return [minimum - padding, maximum + padding];
  }

  const padding = (maximum - minimum) * 0.05;
  return [minimum - padding, maximum + padding];
}

/**
 * Renderer for open-high-low-close candlestick charts.
 */
export class CandlestickChartRenderer extends ChartRenderer {
  constructor(options = {}) {
    super(options);
    this.upColor = options.upColor || "#16a34a";
    this.downColor = options.downColor || "#dc2626";
    this.candleWidthRatio = options.candleWidthRatio ?? 0.68;
    this.candleWidth = options.candleWidth;
    this.wickWidth = options.wickWidth ?? 1;
    this.padding = options.padding || { xInner: 0.1, xOuter: 0.1 };
  }

  render(svg, data) {
    const container = d3.select(svg);
    const { x: xField, open, high, low, close } = this.encoding;
    const margin = this.margin;
    const chartWidth = this.width;
    const chartHeight = this.height;
    const reverseX = this.options.reverseX ?? this.xAxisPos === "top";
    const reverseY = this.options.reverseY ?? this.yAxisPos === "right";
    const configuredXDomain = this.encoding.xDomain;
    const sample = data.find((datum) => datum[xField] !== undefined);
    const categoricalX =
      typeof sample?.[xField] === "string" ||
      configuredXDomain?.some((value) => typeof value === "string");

    container.selectAll("*").remove();

    const xScale = categoricalX
      ? bandScale(
          categoricalDomain(data, xField, configuredXDomain),
          xRange(chartWidth, reverseX),
          this.padding,
        )
      : linearScale(
          continuousDomain(data, xField, configuredXDomain),
          xRange(chartWidth, reverseX),
        );
    const xPosition = categoricalX
      ? (datum) => xScale(datum[xField]) + xScale.bandwidth() / 2
      : (datum) => xScale(Number(datum[xField]));
    const yScale = linearScale(
      priceDomain(data, this.encoding),
      yRange(chartHeight, reverseY),
    );
    const positions = [...new Set(data.map(xPosition))].sort((a, b) => a - b);
    const gaps = positions
      .slice(1)
      .map((position, index) => position - positions[index])
      .filter((gap) => gap > 0);
    const availableWidth = categoricalX
      ? xScale.bandwidth()
      : gaps.length
        ? d3.min(gaps)
        : chartWidth;
    const bodyWidth = Math.max(
      1,
      this.candleWidth ?? availableWidth * this.candleWidthRatio,
    );

    data.forEach((datum, index) => {
      const openValue = Number(datum[open]);
      const highValue = Number(datum[high]);
      const lowValue = Number(datum[low]);
      const closeValue = Number(datum[close]);
      const rising = closeValue >= openValue;
      const direction = rising ? "up" : "down";
      const color = rising ? this.upColor : this.downColor;
      const centerX = margin.left + xPosition(datum);
      const openY = margin.top + yScale(openValue);
      const closeY = margin.top + yScale(closeValue);
      const bodyHeight = Math.max(1, Math.abs(closeY - openY));
      const bodyTop = Math.min(openY, closeY) - (bodyHeight === 1 ? 0.5 : 0);

      container
        .append("line")
        .attr("class", "candlestick-wick")
        .attr("data-direction", direction)
        .attr("x1", centerX)
        .attr("x2", centerX)
        .attr("y1", margin.top + yScale(highValue))
        .attr("y2", margin.top + yScale(lowValue))
        .attr("stroke", color)
        .attr("stroke-width", this.wickWidth);

      const body = this.renderStyledRect({
        container,
        left: centerX - bodyWidth / 2,
        top: bodyTop,
        width: bodyWidth,
        height: bodyHeight,
        value: closeValue,
        datum,
        index,
        orientation: "vertical",
        role: "candlestick-body",
        fill: color,
        stroke: color,
        strokeWidth: 1,
      })
        .attr("class", "candlestick-body")
        .attr("data-direction", direction);

      this.applyFillHover(body, color);
      body
        .append("title")
        .text(
          `${datum[xField]} — open: ${openValue}, high: ${highValue}, low: ${lowValue}, close: ${closeValue}`,
        );
    });

    return this.axisConfig(
      { x: xScale, y: yScale },
      { margin, width: chartWidth, height: chartHeight },
    );
  }
}
