import * as d3 from "d3";
import { Node } from "./node.js";
import {
  categoricalDomain,
  continuousDomain,
  valueDomain,
} from "../mark/scale.js";
import { inferXYOrientation } from "../mark/orientation.js";

const CHANNELS = ["x", "y"];

function domainKey(channel) {
  return `${channel}Domain`;
}

function uniqueValues(data, field) {
  return [...new Set(data.map((d) => d[field]))];
}

function finiteValues(data, field) {
  return data.map((d) => Number(d[field])).filter(Number.isFinite);
}

function maxValueDomain(data, field) {
  const values = data.map((d) => d[field] || 0);
  const maxValue = values.length ? Math.max(...values) : 0;
  return valueDomain(maxValue, undefined);
}

function extentDomain(data, field, options = {}) {
  return continuousDomain(data, field, undefined, options);
}

function rawExtentDomain(data, field, fallback = [0, 0]) {
  const values = finiteValues(data, field);
  if (values.length === 0) return fallback;
  const extent = d3.extent(values);
  return extent[0] === extent[1]
    ? [extent[0], extent[1]]
    : [extent[0], extent[1]];
}

function paddedExtentDomain(data, field) {
  const values = finiteValues(data, field);
  if (values.length === 0) return [0, 1];

  const extent = d3.extent(values);
  if (extent[0] === extent[1]) {
    const pad = Math.abs(extent[0]) * 0.05 || 1;
    return [extent[0] - pad, extent[1] + pad];
  }

  return extent;
}

function stackedValueDomain(chart, categoryChannel, valueChannel) {
  const data = chart.data || [];
  const encoding = chart.encoding || {};
  const categoryField = encoding[categoryChannel];
  const valueField = encoding[valueChannel];
  const groupField = encoding.group;
  const categories =
    encoding[domainKey(categoryChannel)] ||
    categoricalDomain(data, categoryField, undefined);
  const groupKeys = encoding.groupDomain || uniqueValues(data, groupField);

  const maxValue = d3.max(categories, (category) =>
    d3.sum(groupKeys, (key) => {
      const item = data.find(
        (d) => d[categoryField] === category && d[groupField] === key,
      );
      return item ? Number(item[valueField]) || 0 : 0;
    }),
  );

  return valueDomain(maxValue, undefined);
}

function streamValueDomain(chart) {
  const data = chart.data || [];
  const encoding = chart.encoding || {};
  const xField = encoding.x;
  const yField = encoding.y;
  const groupField = encoding.group;
  const xDomain = encoding.xDomain || categoricalDomain(data, xField);
  const seriesKeys = encoding.groupDomain || uniqueValues(data, groupField);
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
  const layers = d3
    .stack()
    .keys(seriesKeys)
    .value((d, key) => d[key])
    .order(d3.stackOrderInsideOut)
    .offset(d3.stackOffsetWiggle)(pivotedData);
  const values = layers.flat(2).filter(Number.isFinite);

  return values.length ? d3.extent(values) : [0, 0];
}

function categoryDescriptor(chart, channel, explicitDomain) {
  const encoding = chart.encoding || {};
  const field = encoding[channel];
  return {
    kind: "categorical",
    domain:
      explicitDomain !== undefined
        ? explicitDomain
        : categoricalDomain(chart.data || [], field),
  };
}

function valueDescriptor(chart, channel, explicitDomain, domain) {
  return {
    kind: "continuous",
    domain: explicitDomain !== undefined ? explicitDomain : domain,
    channel,
  };
}

function bubbleDescriptor(chart, channel, explicitDomain) {
  const data = chart.data || [];
  const encoding = chart.encoding || {};
  const field = encoding[channel];
  const sample = data.find((d) => d[field] !== undefined);
  const configuredLooksCategorical =
    explicitDomain !== undefined &&
    explicitDomain.some((value) => typeof value === "string");
  const isCategorical =
    typeof sample?.[field] === "string" || configuredLooksCategorical;

  if (isCategorical) {
    return categoryDescriptor(chart, channel, explicitDomain);
  }

  return valueDescriptor(
    chart,
    channel,
    explicitDomain,
    extentDomain(data, field, { padRatio: 0.05 }),
  );
}

function domainDescriptor(chart, channel) {
  const mark = chart.mark || "bar";
  const encoding = chart.encoding || {};
  const key = domainKey(channel);
  const explicitDomain = encoding[key];
  const explicit = explicitDomain !== undefined;

  if (explicit && !Array.isArray(explicitDomain)) return null;

  const data = chart.data || [];
  const field = encoding[channel];
  if (!field) return null;

  switch (mark) {
    case "bar":
    case "groupbar": {
      const orientation = inferXYOrientation(mark, data, encoding);
      return channel === orientation.valueChannel
        ? valueDescriptor(
            chart,
            channel,
            explicitDomain,
            maxValueDomain(data, field),
          )
        : categoryDescriptor(chart, channel, explicitDomain);
    }

    case "stackbar": {
      const orientation = inferXYOrientation(mark, data, encoding);
      return channel === orientation.valueChannel
        ? valueDescriptor(
            chart,
            channel,
            explicitDomain,
            stackedValueDomain(
              chart,
              orientation.categoryChannel,
              orientation.valueChannel,
            ),
          )
        : categoryDescriptor(chart, channel, explicitDomain);
    }

    case "area":
      return channel === "x"
        ? valueDescriptor(
            chart,
            channel,
            explicitDomain,
            extentDomain(data, field, { fallback: [0, 1] }),
          )
        : valueDescriptor(
            chart,
            channel,
            explicitDomain,
            maxValueDomain(data, field),
          );

    case "line":
      return channel === "x"
        ? valueDescriptor(
            chart,
            channel,
            explicitDomain,
            extentDomain(data, field),
          )
        : valueDescriptor(
            chart,
            channel,
            explicitDomain,
            maxValueDomain(data, field),
          );

    case "scatter":
      return valueDescriptor(
        chart,
        channel,
        explicitDomain,
        extentDomain(data, field),
      );

    case "bubble":
      return bubbleDescriptor(chart, channel, explicitDomain);

    case "box": {
      const orientation = inferXYOrientation(mark, data, encoding);
      if (channel === orientation.categoryChannel) {
        return categoryDescriptor(chart, channel, explicitDomain);
      }

      return orientation.valueChannel === "x"
        ? valueDescriptor(chart, channel, explicitDomain, [
            0,
            d3.max(finiteValues(data, field)) ?? 0,
          ])
        : valueDescriptor(
            chart,
            channel,
            explicitDomain,
            rawExtentDomain(data, field),
          );
    }

    case "dumbbell": {
      const orientation = inferXYOrientation(mark, data, encoding);
      return channel === orientation.valueChannel
        ? valueDescriptor(
            chart,
            channel,
            explicitDomain,
            paddedExtentDomain(data, field),
          )
        : categoryDescriptor(chart, channel, explicitDomain);
    }

    case "pac": {
      const orientation = inferXYOrientation(mark, data, encoding);
      if (channel === orientation.categoryChannel) {
        return categoryDescriptor(chart, channel, explicitDomain);
      }

      return valueDescriptor(
        chart,
        channel,
        explicitDomain,
        maxValueDomain(data, field),
      );
    }

    case "matrix":
    case "pie":
      return channel === "x"
        ? categoryDescriptor(chart, channel, explicitDomain)
        : null;

    case "flow":
      return channel === "x"
        ? categoryDescriptor(chart, channel, explicitDomain)
        : valueDescriptor(
            chart,
            channel,
            explicitDomain,
            rawExtentDomain(data, field),
          );

    case "stream":
      return channel === "x"
        ? categoryDescriptor(chart, channel, explicitDomain)
        : valueDescriptor(
            chart,
            channel,
            explicitDomain,
            streamValueDomain(chart),
          );

    default:
      return null;
  }
}

function mergeCategoricalDomains(descriptors) {
  const domain = [];
  const seen = new Set();

  descriptors.forEach(({ domain: values }) => {
    values.forEach((value) => {
      if (seen.has(value)) return;
      seen.add(value);
      domain.push(value);
    });
  });

  return domain;
}

function mergeContinuousDomains(descriptors) {
  const values = descriptors
    .flatMap(({ domain }) => domain)
    .map(Number)
    .filter(Number.isFinite);

  if (values.length === 0) return null;
  return [d3.min(values), d3.max(values)];
}

function mergeDescriptors(descriptors) {
  const kinds = new Set(descriptors.map((descriptor) => descriptor.kind));
  if (kinds.size !== 1) return null;

  const [kind] = kinds;
  if (kind === "categorical") return mergeCategoricalDomains(descriptors);
  if (kind === "continuous") return mergeContinuousDomains(descriptors);
  return null;
}

function isChartNode(node) {
  return (
    Node.isChart(node) &&
    node.element &&
    typeof node.element._applySharedDomains === "function"
  );
}

export function applySharedChartDomains(nodes) {
  const charts = nodes.filter(isChartNode).map((node) => node.element);
  if (charts.length < 2) return;

  CHANNELS.forEach((channel) => {
    const descriptors = charts
      .map((chart) => {
        const descriptor = domainDescriptor(chart, channel);
        if (!descriptor) return null;
        return {
          ...descriptor,
          chart,
          explicit: chart.encoding?.[domainKey(channel)] !== undefined,
        };
      })
      .filter(Boolean);

    if (descriptors.length < 2) return;

    const sharedDomain = mergeDescriptors(descriptors);
    if (!sharedDomain) return;

    descriptors.forEach(({ chart, explicit }) => {
      if (explicit) return;
      chart._applySharedDomains({ [domainKey(channel)]: sharedDomain });
    });
  });
}
