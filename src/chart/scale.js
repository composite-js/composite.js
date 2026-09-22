import * as d3 from "d3";

export function uniqueValues(data, field) {
  return [...new Set(data.map((d) => d[field]))];
}

export function categoricalDomain(data, field, configuredDomain) {
  return configuredDomain !== undefined
    ? configuredDomain
    : uniqueValues(data, field);
}

export function continuousDomain(data, field, configuredDomain, options = {}) {
  if (configuredDomain !== undefined) {
    return configuredDomain;
  }

  const values = data
    .map((d) => Number(d[field]))
    .filter((value) => Number.isFinite(value));
  const fallback = options.fallback || [0, 1];

  if (values.length === 0) {
    return fallback;
  }

  if (options.zeroBaseline) {
    return [0, Math.max(0, d3.max(values) ?? 0)];
  }

  const extent = d3.extent(values);
  if (extent[0] === extent[1]) {
    const pad = Math.abs(extent[0]) * (options.padRatio ?? 0.05) || 1;
    return [extent[0] - pad, extent[1] + pad];
  }

  if (options.padRatio) {
    const pad = (extent[1] - extent[0]) * options.padRatio || 1;
    return [extent[0] - pad, extent[1] + pad];
  }

  return extent;
}

export function valueDomain(maxValue, configuredDomain) {
  return configuredDomain !== undefined ? configuredDomain : [0, maxValue || 0];
}

export function bandScale(domain, range, padding = {}) {
  return d3
    .scaleBand()
    .domain(domain)
    .range(range)
    .paddingInner(padding.inner ?? padding.xInner ?? padding.yInner ?? 0)
    .paddingOuter(padding.outer ?? padding.xOuter ?? padding.yOuter ?? 0);
}

export function pointScale(domain, range, padding = 0) {
  return d3.scalePoint().domain(domain).range(range).padding(padding);
}

export function linearScale(domain, range, options = {}) {
  const scale = d3.scaleLinear().domain(domain).range(range);
  if (options.nice) {
    scale.nice();
  }
  return scale;
}

export function xRange(width, reverse = false) {
  return reverse ? [width, 0] : [0, width];
}

export function yRange(height, reverse = false) {
  return reverse ? [0, height] : [height, 0];
}

export function bandRange(size, reverse = false) {
  return reverse ? [size, 0] : [0, size];
}

export function scaleSpan(scale, start, end) {
  const scaledStart = scale(start);
  const scaledEnd = scale(end);
  return {
    position: Math.min(scaledStart, scaledEnd),
    size: Math.abs(scaledEnd - scaledStart),
  };
}
