const xyEncoding = {
  requiredEncoding: ["x", "y"],
  optionalEncoding: ["xDomain", "yDomain"],
};

const groupedEncoding = {
  requiredEncoding: ["x", "y", "group"],
  optionalEncoding: ["xDomain", "yDomain", "groupDomain"],
};

const inferredBandChannel = { type: "orientationCategory" };

/**
 * Central declaration of the behavior supported by each chart type.
 *
 * Renderer names refer to exports from type/index.js. Domain strategy names
 * are implemented by the shared-domain coordinator because they depend on
 * layout state rather than renderer state.
 */
export const CHART_TYPE_REGISTRY = {
  bar: {
    renderer: "BarChartRenderer",
    encoding: xyEncoding,
    sharedDomain: "bar",
    bandChannel: inferredBandChannel,
    inferredOrientation: true,
    supportsLink: true,
  },
  groupbar: {
    renderer: "GroupBarChartRenderer",
    encoding: groupedEncoding,
    sharedDomain: "bar",
    bandChannel: inferredBandChannel,
    inferredOrientation: true,
  },
  stackbar: {
    renderer: "StackBarChartRenderer",
    encoding: groupedEncoding,
    sharedDomain: "stackbar",
    bandChannel: inferredBandChannel,
    inferredOrientation: true,
  },
  area: {
    renderer: "AreaChartRenderer",
    encoding: xyEncoding,
    sharedDomain: "area",
  },
  line: {
    renderer: "LineChartRenderer",
    encoding: xyEncoding,
    sharedDomain: "line",
  },
  matrix: {
    renderer: "MatrixChartRenderer",
    encoding: {
      requiredEncoding: ["x", "group", "y"],
      optionalEncoding: ["xDomain", "groupDomain"],
    },
    sharedDomain: "categoricalX",
    bandChannel: { x: "x", y: "group" },
    defaultPadding: 0,
  },
  scatter: {
    renderer: "ScatterChartRenderer",
    encoding: xyEncoding,
    sharedDomain: "scatter",
    supportsLink: true,
  },
  box: {
    renderer: "BoxPlotRenderer",
    encoding: xyEncoding,
    sharedDomain: "box",
    bandChannel: inferredBandChannel,
    inferredOrientation: true,
  },
  bubble: {
    renderer: "BubbleChartRenderer",
    encoding: {
      requiredEncoding: ["x", "y"],
      optionalEncoding: ["size", "xDomain", "yDomain"],
    },
    sharedDomain: "bubble",
  },
  dumbbell: {
    renderer: "DumbbellChartRenderer",
    encoding: xyEncoding,
    sharedDomain: "dumbbell",
    bandChannel: inferredBandChannel,
    inferredOrientation: true,
  },
  pac: {
    renderer: "ProportionalAreaChartRenderer",
    encoding: xyEncoding,
    sharedDomain: "pac",
    bandChannel: inferredBandChannel,
    inferredOrientation: true,
    supportsLink: true,
  },
  pie: {
    renderer: "PieChartRenderer",
    encoding: {
      requiredEncoding: ["x", "y"],
      optionalEncoding: ["xDomain"],
    },
    sharedDomain: "categoricalX",
  },
  flow: {
    renderer: "FlowDiagramRenderer",
    encoding: {
      requiredEncoding: ["x", "group", "y"],
      optionalEncoding: ["xDomain", "yDomain", "groupDomain"],
    },
    sharedDomain: "flow",
  },
  stream: {
    renderer: "StreamGraphRenderer",
    encoding: groupedEncoding,
    sharedDomain: "stream",
  },
};

export const CHART_TYPE_DEFINITIONS = Object.fromEntries(
  Object.entries(CHART_TYPE_REGISTRY).map(([mark, definition]) => [
    mark,
    definition.encoding,
  ]),
);

export function getChartTypeDefinition(mark) {
  return CHART_TYPE_REGISTRY[mark];
}
