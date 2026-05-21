import * as d3 from "d3";
import { MarkRenderer } from "./mark.js";
import {
  bandRange,
  bandScale,
  categoricalDomain,
  linearScale,
  scaleSpan,
  valueDomain,
  xRange,
  yRange,
} from "./scale.js";

/**
 * Renderer for grouped bar charts.
 */
export class GroupBarChartRenderer extends MarkRenderer {
  constructor(options = {}) {
    super(options);
    this.direction = options.direction || "vertical";
    this.colorScheme = options.colorScheme || d3.schemeCategory10;
    this.showLabels = options.showLabels || false;
    const padding = options.padding || {};
    this.padding = {
      xInner: padding.xInner !== undefined ? padding.xInner : 0.2,
      xOuter: padding.xOuter !== undefined ? padding.xOuter : 0.1,
      yInner: padding.yInner !== undefined ? padding.yInner : 0.2,
      yOuter: padding.yOuter !== undefined ? padding.yOuter : 0.1,
      groupInner: padding.groupInner !== undefined ? padding.groupInner : 0.08,
    };
  }

  render(svg, data) {
    return this.direction === "horizontal"
      ? this._renderHorizontal(svg, data)
      : this._renderVertical(svg, data);
  }

  _renderHorizontal(svg, data) {
    const container = d3.select(svg);
    const xField = this.encoding.x;
    const yField = this.encoding.y;
    const groupField = this.encoding.group;
    const margin = this.margin;
    const chartWidth = this.width;
    const chartHeight = this.height;

    container.selectAll("*").remove();

    const categories = [...new Set(data.map((d) => d[yField]))];
    const groups = this.encoding.groupDomain || [
      ...new Set(data.map((d) => d[groupField])),
    ];
    const maxValue = Math.max(...data.map((d) => d[xField] || 0));

    const yScale = d3
      .scaleBand()
      .domain(categories)
      .range([0, chartHeight])
      .paddingInner(this.padding.yInner)
      .paddingOuter(this.padding.yOuter);

    const groupScale = d3
      .scaleBand()
      .domain(groups)
      .range([0, yScale.bandwidth()])
      .paddingInner(this.padding.groupInner);

    const xScale = d3
      .scaleLinear()
      .domain(this.encoding.xDomain || [0, maxValue])
      .range([0, chartWidth]);

    const colorScale = d3.scaleOrdinal().domain(groups).range(this.colorScheme);

    data.forEach((d) => {
      const value = d[xField];
      const x = margin.left + xScale(0);
      const y = margin.top + yScale(d[yField]) + groupScale(d[groupField]);
      const barWidth = xScale(value) - xScale(0);
      const barHeight = groupScale.bandwidth();
      const rect = container
        .append("rect")
        .attr("x", x)
        .attr("y", y)
        .attr("width", barWidth)
        .attr("height", barHeight);

      this.applyFillHover(rect, colorScale(d[groupField]));
      rect.append("title").text(`${d[yField]} - ${d[groupField]}: ${value}`);

      if (this.showLabels && barWidth > 20) {
        container
          .append("text")
          .attr("x", x + barWidth + 4)
          .attr("y", y + barHeight / 2 + 4)
          .attr("text-anchor", "start")
          .attr("font-size", "10px")
          .text(value);
      }
    });

    return this.axisConfig(
      { x: xScale, y: yScale, group: groupScale },
      { margin, width: chartWidth, height: chartHeight },
    );
  }

  _renderVertical(svg, data) {
    const container = d3.select(svg);
    const xField = this.encoding.x;
    const yField = this.encoding.y;
    const groupField = this.encoding.group;
    const margin = this.margin;
    const chartWidth = this.width;
    const chartHeight = this.height;

    container.selectAll("*").remove();

    const categories = categoricalDomain(data, xField, this.encoding.xDomain);
    const groups = this.encoding.groupDomain || [
      ...new Set(data.map((d) => d[groupField])),
    ];
    const maxValue = Math.max(...data.map((d) => d[yField] || 0));

    const reverseX = this.xAxisPos === "top";
    const reverseY = this.yAxisPos === "right";
    const xScale = bandScale(categories, xRange(chartWidth, reverseX), {
      inner: this.padding.xInner,
      outer: this.padding.xOuter,
    });

    const groupScale = d3
      .scaleBand()
      .domain(groups)
      .range([0, xScale.bandwidth()])
      .paddingInner(this.padding.groupInner);

    const yScale = linearScale(
      valueDomain(maxValue, this.encoding.yDomain),
      yRange(chartHeight, reverseY),
    );

    const colorScale = d3.scaleOrdinal().domain(groups).range(this.colorScheme);

    data.forEach((d) => {
      const value = d[yField];
      const ySpan = scaleSpan(yScale, 0, value);
      const x = margin.left + xScale(d[xField]) + groupScale(d[groupField]);
      const y = margin.top + ySpan.position;
      const rect = container
        .append("rect")
        .attr("x", x)
        .attr("y", y)
        .attr("width", groupScale.bandwidth())
        .attr("height", ySpan.size);

      this.applyFillHover(rect, colorScale(d[groupField]));
      rect.append("title").text(`${d[xField]} - ${d[groupField]}: ${value}`);

      if (this.showLabels && ySpan.size > 15) {
        container
          .append("text")
          .attr("x", x + groupScale.bandwidth() / 2)
          .attr("y", y - 4)
          .attr("text-anchor", "middle")
          .attr("font-size", "10px")
          .text(value);
      }
    });

    return this.axisConfig(
      { x: xScale, y: yScale, group: groupScale },
      { margin, width: chartWidth, height: chartHeight },
    );
  }
}

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
    const groupField = this.encoding.group;

    const chartWidth = this.width;
    const chartHeight = this.height;
    const margin = this.margin;

    container.selectAll("*").remove();

    const categories = categoricalDomain(
      data,
      categoryField,
      this.encoding.yDomain,
    );
    const groupKeys = this.encoding.groupDomain || [
      ...new Set(data.map((d) => d[groupField])),
    ];

    const pivotedData = categories.map((cat) => {
      const entry = { [categoryField]: cat };
      groupKeys.forEach((key) => {
        const item = data.find(
          (d) => d[categoryField] === cat && d[groupField] === key,
        );
        entry[key] = item ? item[valueField] : 0;
      });
      return entry;
    });

    const stack = d3.stack().keys(groupKeys);
    const stackedData = stack(pivotedData);
    const maxValue = d3.max(stackedData, (layer) => d3.max(layer, (d) => d[1]));

    const colorScale = d3
      .scaleOrdinal()
      .domain(groupKeys)
      .range(this.colorScheme);

    const reverseY = this.xAxisPos === "top";
    const yScale = bandScale(categories, bandRange(chartHeight, reverseY), {
      inner: this.padding.yInner,
      outer: this.padding.yOuter,
    });

    const reverseX = this.yAxisPos === "right";
    const xScale = linearScale(
      valueDomain(maxValue, this.encoding.xDomain),
      xRange(chartWidth, reverseX),
    );

    stackedData.forEach((layer) => {
      const stackKey = layer.key;
      layer.forEach((d) => {
        const category = d.data[categoryField];
        const xSpan = scaleSpan(xScale, d[0], d[1]);
        const barX = xSpan.position;
        const barWidth = xSpan.size;
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
    const categoryField = this.encoding.x;
    const valueField = this.encoding.y;
    const groupField = this.encoding.group;

    const chartWidth = this.width;
    const chartHeight = this.height;
    const margin = this.margin;

    container.selectAll("*").remove();

    const categories = categoricalDomain(
      data,
      categoryField,
      this.encoding.xDomain,
    );
    const groupKeys = this.encoding.groupDomain || [
      ...new Set(data.map((d) => d[groupField])),
    ];

    const pivotedData = categories.map((cat) => {
      const entry = { [categoryField]: cat };
      groupKeys.forEach((key) => {
        const item = data.find(
          (d) => d[categoryField] === cat && d[groupField] === key,
        );
        entry[key] = item ? item[valueField] : 0;
      });
      return entry;
    });

    const stack = d3.stack().keys(groupKeys);
    const stackedData = stack(pivotedData);
    const maxValue = d3.max(stackedData, (layer) => d3.max(layer, (d) => d[1]));

    const colorScale = d3
      .scaleOrdinal()
      .domain(groupKeys)
      .range(this.colorScheme);

    const reverseX = this.xAxisPos === "top";
    const xScale = bandScale(categories, xRange(chartWidth, reverseX), {
      inner: this.padding.xInner,
      outer: this.padding.xOuter,
    });

    const reverseY = this.yAxisPos === "right";
    const yScale = linearScale(
      valueDomain(maxValue, this.encoding.yDomain),
      yRange(chartHeight, reverseY),
    );

    stackedData.forEach((layer) => {
      const stackKey = layer.key;
      layer.forEach((d) => {
        const category = d.data[categoryField];
        const ySpan = scaleSpan(yScale, d[0], d[1]);
        const barY = ySpan.position;
        const barHeight = ySpan.size;
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
    const _g = container
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const maxValue = Math.max(...data.map((d) => d[xField] || 0));

    const reverseY = this.xAxisPos === "top";
    const yScale = bandScale(
      categoricalDomain(data, yField, this.encoding.yDomain),
      bandRange(chartHeight, reverseY),
      {
        inner: this.padding.yInner,
        outer: this.padding.yOuter,
      },
    );

    const reverseX = this.yAxisPos === "right";
    const xScale = linearScale(
      valueDomain(maxValue, this.encoding.xDomain),
      xRange(chartWidth, reverseX),
    );

    data.forEach((d) => {
      const value = d[xField];
      const xSpan = scaleSpan(xScale, 0, value);
      const barWidth = xSpan.size;
      const barHeight = yScale.bandwidth();

      const x = margin.left + xSpan.position;
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
    const _g = container
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const maxValue = Math.max(...data.map((d) => d[yField] || 0));

    const reverseX = this.xAxisPos === "top";
    const xScale = bandScale(
      categoricalDomain(data, xField, this.encoding.xDomain),
      xRange(chartWidth, reverseX),
      {
        inner: this.padding.xInner,
        outer: this.padding.xOuter,
      },
    );

    const reverseY = this.yAxisPos === "right";
    const yScale = linearScale(
      valueDomain(maxValue, this.encoding.yDomain),
      yRange(chartHeight, reverseY),
    );

    data.forEach((d) => {
      const value = d[yField];
      const barWidth = xScale.bandwidth();
      const ySpan = scaleSpan(yScale, 0, value);
      const barHeight = ySpan.size;

      const x = margin.left + xScale(d[xField]);
      const y = margin.top + ySpan.position;

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
