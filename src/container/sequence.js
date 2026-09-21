import * as d3 from "d3";
import { normalizeContainerOptions, valueOf } from "./base.js";

export class SequenceContainer {
  constructor(options = {}) {
    const normalized = normalizeContainerOptions(options);

    this.options = normalized;
    this.width = normalized.width;
    this.height = normalized.height;
    this.margin = normalized.margin;
    this.xDomain = options.xDomain || [];
    this.yDomain = options.yDomain || [];
    this.tracks = options.tracks || this.yDomain;
    this.missing = options.missing || [];
    this.events = options.events || [];
    this.xField = options.x || "week";
    this.yField = options.y || "learner";
    this.trackColor = options.trackColor || "#a8a8a8";
    this.missingColor = options.missingColor || "#8b8b8b";
    this.eventColor = options.eventColor || "#111";
  }

  xScale(width = this.width) {
    return d3.scaleBand().domain(this.xDomain).range([0, width]);
  }

  yScale(height = this.height) {
    return d3.scaleBand().domain(this.yDomain).range([0, height]);
  }

  slots(data, mapping = {}, size = {}) {
    const width = size.width ?? this.width;
    const height = size.height ?? this.height;
    const x = this.xScale(width);
    const y = this.yScale(height);
    const xAccessor = mapping.x ?? this.xField;
    const yAccessor = mapping.y ?? this.yField;
    const keyAccessor = mapping.key;
    const slots = [];

    data.forEach((datum, index) => {
      const xValue = valueOf(xAccessor, datum, index);
      const yValue = valueOf(yAccessor, datum, index);
      const xPosition = x(xValue);
      const yPosition = y(yValue);

      if (xPosition === undefined || yPosition === undefined) return;

      const key =
        keyAccessor !== undefined ? valueOf(keyAccessor, datum, index) : index;

      slots.push({
        datum,
        key,
        x: xPosition + x.bandwidth() / 2,
        y: yPosition + y.bandwidth() / 2,
        width: mapping.width,
        height: mapping.height,
      });
    });

    return slots;
  }

  render(svg, renderOptions = {}) {
    const width = renderOptions.width ?? this.width;
    const height = renderOptions.height ?? this.height;
    const margin = renderOptions.margin ?? this.margin;
    const container = d3.select(svg);
    const x = this.xScale(width);
    const y = this.yScale(height);
    const xStart = x(this.xDomain[0]) + x.bandwidth() / 2;
    const xEnd = x(this.xDomain[this.xDomain.length - 1]) + x.bandwidth() / 2;

    this.tracks.forEach((track) => {
      const trackId = typeof track === "object" ? track.id : track;
      const cy = margin.top + y(trackId) + y.bandwidth() / 2;

      container
        .append("line")
        .attr("x1", margin.left + xStart)
        .attr("y1", cy)
        .attr("x2", margin.left + xEnd)
        .attr("y2", cy)
        .attr("stroke", this.trackColor)
        .attr("stroke-width", 2);
    });

    this.missing.forEach((datum, index) => {
      const slot = this.slots([datum], {
        x: this.xField,
        y: this.yField,
        key: (_d) => `missing-${index}`,
      })[0];

      if (!slot) return;

      container
        .append("circle")
        .attr("cx", margin.left + slot.x)
        .attr("cy", margin.top + slot.y)
        .attr("r", 5)
        .attr("fill", this.missingColor);
    });

    this.events.forEach((datum, index) => {
      const slot = this.slots([datum], {
        x: this.xField,
        y: this.yField,
        key: (_d) => `event-${index}`,
      })[0];

      if (!slot) return;

      container
        .append("circle")
        .attr("cx", margin.left + slot.x)
        .attr("cy", margin.top + slot.y)
        .attr("r", 3)
        .attr("fill", this.eventColor);
    });
  }
}

export function sequenceContainer(options = {}) {
  return new SequenceContainer(options);
}
