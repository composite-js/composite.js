import * as d3 from "d3";
import { MarkRenderer } from "./mark.js";

/**
 * Renderer for stacked bar charts.
 */
export class StackBarChartRenderer extends MarkRenderer {
  /**
   * Creates an instance of StackBarChartRenderer.
   * @param {Object} options - Chart options.
   */
  constructor(options = {}) {
    super(options);
    this.direction = options.direction || "vertical";
    this.colorScheme = options.colorScheme || d3.schemeCategory10;
    this.showLabels = options.showLabels || false;
    this.showXAxis = options.showXAxis !== undefined ? options.showXAxis : true;
    this.showYAxis = options.showYAxis !== undefined ? options.showYAxis : true;
    this.xAxisName = options.xAxisName || "";
    this.yAxisName = options.yAxisName || "";
    this.xAxisPos = options.xAxisPos || "bottom";
    this.yAxisPos = options.yAxisPos || "left";
    this.padding = options.padding || {
      xInner: 0.1,
      xOuter: 0.1,
      yInner: 0.1,
      yOuter: 0.1,
    };
  }

  /**
   * Renders a stacked bar chart.
   * @param {SVGElement} svg - The SVG container.
   * @param {Array} data - The data to render.
   * @returns {Object} Axis configuration object.
   */
  render(svg, data) {
    return this.direction === "horizontal"
      ? this._renderHorizontal(svg, data)
      : this._renderVertical(svg, data);
  }

  /**
   * Renders horizontal stacked bar chart.
   * @private
   */
  _renderHorizontal(svg, data) {
    const container = d3.select(svg);
    const categoryField = this.encoding.y;
    const valueField = this.encoding.x;
    const stackField = this.encoding.stack;

    const chartWidth = this.width;
    const chartHeight = this.height;
    const margin = this.margin;

    container.selectAll("*").remove();

    const categories = [...new Set(data.map((d) => d[categoryField]))];
    const stackKeys = [...new Set(data.map((d) => d[stackField]))];

    const pivotedData = categories.map((cat) => {
      const entry = { [categoryField]: cat };
      stackKeys.forEach((key) => {
        const item = data.find(
          (d) => d[categoryField] === cat && d[stackField] === key,
        );
        entry[key] = item ? item[valueField] : 0;
      });
      return entry;
    });

    const stack = d3.stack().keys(stackKeys);
    const stackedData = stack(pivotedData);
    const maxValue = d3.max(stackedData, (layer) => d3.max(layer, (d) => d[1]));

    const colorScale = d3
      .scaleOrdinal()
      .domain(stackKeys)
      .range(this.colorScheme);

    const yScale = d3
      .scaleBand()
      .domain(categories)
      .range([0, chartHeight])
      .paddingInner(this.padding.yInner)
      .paddingOuter(this.padding.yOuter);

    const reverseX = this.yAxisPos === "right";
    const xScale = d3
      .scaleLinear()
      .domain([0, maxValue])
      .range(reverseX ? [chartWidth, 0] : [0, chartWidth]);

    stackedData.forEach((layer) => {
      const stackKey = layer.key;
      layer.forEach((d) => {
        const category = d.data[categoryField];
        const x0 = xScale(d[0]);
        const x1 = xScale(d[1]);
        const barX = Math.min(x0, x1);
        const barWidth = Math.abs(x1 - x0);
        const barHeight = yScale.bandwidth();
        const y = yScale(category);

        const rect = container
          .append("rect")
          .attr("x", margin.left + barX)
          .attr("y", margin.top + y)
          .attr("width", barWidth)
          .attr("height", barHeight)
          .attr("fill", colorScale(stackKey));

        this.applyOpacityHover(rect);

        rect.append("title").text(`${category} - ${stackKey}: ${d[1] - d[0]}`);

        if (this.showLabels && barWidth > 20) {
          container
            .append("text")
            .attr("x", margin.left + barX + barWidth / 2)
            .attr("y", margin.top + y + barHeight / 2 + 4)
            .attr("text-anchor", "middle")
            .attr("font-size", "10px")
            .attr("fill", "white")
            .text(d[1] - d[0]);
        }
      });
    });

    return this.axisConfig(
      { x: xScale, y: yScale },
      { margin, width: chartWidth, height: chartHeight },
    );
  }

  /**
   * Renders vertical stacked bar chart.
   * @private
   */
  _renderVertical(svg, data) {
    const container = d3.select(svg);
    const categoryField = this.encoding.y;
    const valueField = this.encoding.x;
    const stackField = this.encoding.stack;

    const chartWidth = this.width;
    const chartHeight = this.height;
    const margin = this.margin;

    container.selectAll("*").remove();

    const categories = [...new Set(data.map((d) => d[categoryField]))];
    const stackKeys = [...new Set(data.map((d) => d[stackField]))];

    const pivotedData = categories.map((cat) => {
      const entry = { [categoryField]: cat };
      stackKeys.forEach((key) => {
        const item = data.find(
          (d) => d[categoryField] === cat && d[stackField] === key,
        );
        entry[key] = item ? item[valueField] : 0;
      });
      return entry;
    });

    const stack = d3.stack().keys(stackKeys);
    const stackedData = stack(pivotedData);
    const maxValue = d3.max(stackedData, (layer) => d3.max(layer, (d) => d[1]));

    const colorScale = d3
      .scaleOrdinal()
      .domain(stackKeys)
      .range(this.colorScheme);

    const xScale = d3
      .scaleBand()
      .domain(categories)
      .range([0, chartWidth])
      .paddingInner(this.padding.xInner)
      .paddingOuter(this.padding.xOuter);

    const reverseY = this.yAxisPos === "right";
    const yScale = d3
      .scaleLinear()
      .domain([0, maxValue])
      .range(reverseY ? [0, chartHeight] : [chartHeight, 0]);

    stackedData.forEach((layer) => {
      const stackKey = layer.key;
      layer.forEach((d) => {
        const category = d.data[categoryField];
        const y0 = yScale(d[0]);
        const y1 = yScale(d[1]);
        const barY = Math.min(y0, y1);
        const barHeight = Math.abs(y1 - y0);
        const barWidth = xScale.bandwidth();
        const x = xScale(category);

        const rect = container
          .append("rect")
          .attr("x", margin.left + x)
          .attr("y", margin.top + barY)
          .attr("width", barWidth)
          .attr("height", barHeight)
          .attr("fill", colorScale(stackKey));

        this.applyOpacityHover(rect);

        rect.append("title").text(`${category} - ${stackKey}: ${d[1] - d[0]}`);

        if (this.showLabels && barHeight > 15) {
          container
            .append("text")
            .attr("x", margin.left + x + barWidth / 2)
            .attr("y", margin.top + barY + barHeight / 2 + 4)
            .attr("text-anchor", "middle")
            .attr("font-size", "10px")
            .attr("fill", "white")
            .text(d[1] - d[0]);
        }
      });
    });

    return this.axisConfig(
      { x: xScale, y: yScale },
      { margin, width: chartWidth, height: chartHeight },
    );
  }
}

/**
 * Renderer for bar charts.
 */
export class BarChartRenderer extends MarkRenderer {
  /**
   * Creates an instance of BarChartRenderer.
   * @param {Object} options - Chart options.
   */
  constructor(options = {}) {
    super(options);
    this.direction = options.direction || "vertical";
    this.color = options.color || "steelblue";
    this.showLabels = options.showLabels || false;
    this.showXAxis = options.showXAxis !== undefined ? options.showXAxis : true;
    this.showYAxis = options.showYAxis !== undefined ? options.showYAxis : true;
    this.xAxisName = options.xAxisName || "";
    this.yAxisName = options.yAxisName || "";
    this.xAxisPos = options.xAxisPos || "bottom";
    this.yAxisPos = options.yAxisPos || "left";
    this.padding = options.padding || {
      xInner: 0.1,
      xOuter: 0.1,
      yInner: 0.1,
      yOuter: 0.1,
    };
  }

  /**
   * Renders a bar chart.
   * @param {SVGElement} svg - The SVG container.
   * @param {Array} data - The data to render.
   * @returns {Object} Axis configuration object.
   */
  render(svg, data) {
    return this.direction === "horizontal"
      ? this._renderHorizontal(svg, data)
      : this._renderVertical(svg, data);
  }

  /**
   * Renders horizontal bar chart.
   * @private
   */
  _renderHorizontal(svg, data) {
    const container = d3.select(svg);
    const xField = this.encoding.x;
    const yField = this.encoding.y;
    const margin = this.margin;
    const chartWidth = this.width;
    const chartHeight = this.height;

    container.selectAll("*").remove();
    const g = container
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const maxValue = Math.max(...data.map((d) => d[xField] || 0));

    const yScale = d3
      .scaleBand()
      .domain(data.map((d) => d[yField]))
      .range([0, chartHeight])
      .paddingInner(this.padding.yInner)
      .paddingOuter(this.padding.yOuter);

    const reverseX = this.yAxisPos === "right";
    const xScale = d3
      .scaleLinear()
      .domain([0, maxValue])
      .range(reverseX ? [chartWidth, 0] : [0, chartWidth]);

    data.forEach((d) => {
      const value = d[xField];
      const barWidth = Math.abs(xScale(value) - xScale(0));
      const barHeight = yScale.bandwidth();

      const x = margin.left + (reverseX ? xScale(value) : xScale(0));
      const y = margin.top + yScale(d[yField]);

      const rect = container
        .append("rect")
        .attr("x", x)
        .attr("y", y)
        .attr("width", barWidth)
        .attr("height", barHeight);

      this.applyFillHover(rect, this.color);

      rect.append("title").text(`${d[yField]}: ${value}`);

      if (this.showLabels) {
        const label = container
          .append("text")
          .attr("y", y + barHeight / 2 + 4)
          .attr("font-size", "12px")
          .text(value);

        if (reverseX) {
          label.attr("x", x - 5).attr("text-anchor", "end");
        } else {
          label.attr("x", x + barWidth + 5).attr("text-anchor", "start");
        }
      }
    });

    return this.axisConfig(
      { x: xScale, y: yScale },
      { margin, width: chartWidth, height: chartHeight },
    );
  }

  /**
   * Renders vertical bar chart.
   * @private
   */
  _renderVertical(svg, data) {
    const container = d3.select(svg);
    const xField = this.encoding.x;
    const yField = this.encoding.y;
    const margin = this.margin;
    const chartWidth = this.width;
    const chartHeight = this.height;

    container.selectAll("*").remove();
    const g = container
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const maxValue = Math.max(...data.map((d) => d[yField] || 0));

    const reverseX = this.xAxisPos === "top";
    const xScale = d3
      .scaleBand()
      .domain(data.map((d) => d[xField]))
      .range(reverseX ? [chartWidth, 0] : [0, chartWidth])
      .paddingInner(this.padding.xInner)
      .paddingOuter(this.padding.xOuter);

    const reverseY = this.yAxisPos === "right";
    const yScale = d3
      .scaleLinear()
      .domain([0, maxValue])
      .range(reverseY ? [0, chartHeight] : [chartHeight, 0]);

    data.forEach((d) => {
      const value = d[yField];
      const barWidth = xScale.bandwidth();
      const barHeight = chartHeight - yScale(value);

      const x = margin.left + xScale(d[xField]);
      const y = margin.top + yScale(value);

      const rect = container
        .append("rect")
        .attr("x", x)
        .attr("y", y)
        .attr("width", barWidth)
        .attr("height", barHeight);

      this.applyFillHover(rect, this.color);

      rect.append("title").text(`${d[xField]}: ${value}`);

      if (this.showLabels) {
        container
          .append("text")
          .attr("x", x + barWidth / 2)
          .attr("y", y - 5)
          .attr("text-anchor", "middle")
          .attr("font-size", "12px")
          .text(value);
      }
    });

    return this.axisConfig(
      { x: xScale, y: yScale },
      { margin, width: chartWidth, height: chartHeight },
    );
  }
}
