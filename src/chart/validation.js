import {
  inferXYOrientation,
  isOrientationInferredChartType,
} from "./orientation.js";
import { getChartTypeDefinition } from "./registry.js";
import { validateMarkStyle } from "./style.js";

export { CHART_TYPE_DEFINITIONS } from "./registry.js";

const LEGACY_ENCODING_FIELDS = {
  stack: "group",
  color: "group",
  source: "x",
  target: "group",
  category: "x",
  value: "y",
  categoryDomain: "xDomain",
};

const LEGACY_TOP_LEVEL_OPTIONS = {
  sourceDomain: "encoding.xDomain",
  targetDomain: "encoding.groupDomain",
  sourceLabelName: "xLabelName",
  targetLabelName: "groupLabelName",
  showSourceLabels: "showXLabels",
  showTargetLabels: "showGroupLabels",
};

const NUMERIC_FIELD_BY_MARK = {
  area: ["x", "y"],
  scatter: ["x", "y"],
  stream: ["y"],
};

const BOX_SIDES = ["top", "right", "bottom", "left"];
const PADDING_FIELDS = [
  "inner",
  "outer",
  "xInner",
  "xOuter",
  "yInner",
  "yOuter",
  "groupInner",
];

function chartLabel(mark) {
  return `mark "${mark}"`;
}

function hasOwn(value, key) {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function assertObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object.`);
  }
}

function assertFiniteNumber(value, label, options = {}) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new TypeError(`${label} must be a finite number.`);
  }
  if (options.nonNegative && value < 0) {
    throw new RangeError(`${label} must be non-negative.`);
  }
}

function assertChartGeometry(config) {
  ["width", "height"].forEach((field) => {
    if (config[field] === undefined) return;
    assertFiniteNumber(config[field], field, { nonNegative: true });
  });

  if (config.margin !== undefined) {
    assertObject(config.margin, "margin");
    BOX_SIDES.forEach((side) => {
      if (config.margin[side] === undefined) return;
      assertFiniteNumber(config.margin[side], `margin.${side}`, {
        nonNegative: true,
      });
    });
  }

  if (config.padding === undefined) return;
  if (typeof config.padding === "number") {
    assertFiniteNumber(config.padding, "padding", { nonNegative: true });
    return;
  }

  assertObject(config.padding, "padding");
  PADDING_FIELDS.forEach((field) => {
    if (config.padding[field] === undefined) return;
    assertFiniteNumber(config.padding[field], `padding.${field}`, {
      nonNegative: true,
    });
  });
}

function fieldNameFor(encoding, channel) {
  return encoding[channel];
}

function assertEncodingFieldNames(mark, encoding, channels) {
  channels.forEach((channel) => {
    const value = encoding[channel];
    if (typeof value !== "string" || value.length === 0) {
      throw new TypeError(
        `Invalid encoding for ${chartLabel(mark)}: encoding.${channel} must be a field name string.`,
      );
    }
  });
}

function assertRowsHaveFields(mark, data, encoding, channels) {
  data.forEach((row, index) => {
    channels.forEach((channel) => {
      const field = fieldNameFor(encoding, channel);
      if (!hasOwn(row, field)) {
        throw new Error(
          `Row ${index} for ${chartLabel(mark)} is missing field "${field}" from encoding.${channel}.`,
        );
      }
    });
  });
}

function assertFiniteNumbers(mark, data, field, options = {}) {
  const nonNegative = options.nonNegative === true;

  data.forEach((row, index) => {
    const value = row[field];
    const isFiniteNumber = typeof value === "number" && Number.isFinite(value);
    if (!isFiniteNumber || (nonNegative && value < 0)) {
      const description =
        nonNegative && isFiniteNumber
          ? "non-negative numbers"
          : "finite numbers";
      throw new Error(
        `Field "${field}" for ${chartLabel(mark)} must contain ${description}; row ${index} has ${JSON.stringify(value)}.`,
      );
    }
  });
}

function assertBubblePositionValues(data, encoding) {
  ["x", "y"].forEach((channel) => {
    const field = encoding[channel];
    const values = data.map((row) => row[field]);
    const allNumbers = values.every((value) => typeof value === "number");
    const allStrings = values.every((value) => typeof value === "string");

    if (allNumbers) {
      assertFiniteNumbers("bubble", data, field, { nonNegative: true });
      return;
    }

    if (!allStrings) {
      throw new Error(
        `Field "${field}" for mark "bubble" must contain either finite non-negative numbers or strings consistently.`,
      );
    }
  });
}

function assertLinePositionValues(data, encoding) {
  const xField = encoding.x;
  const values = data.map((row) => row[xField]);
  const allStrings = values.every((value) => typeof value === "string");

  if (!allStrings) {
    assertFiniteNumbers("line", data, xField, { nonNegative: true });
  }
  assertFiniteNumbers("line", data, encoding.y, { nonNegative: true });
}

function assertDumbbellPairs(data, encoding, categoryChannel) {
  const categoryField = encoding[categoryChannel];
  const counts = new Map();

  data.forEach((row) => {
    const key = row[categoryField];
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  for (const [category, count] of counts) {
    if (count !== 2) {
      throw new Error(
        `Dumbbell chart requires exactly two rows for each group; "${category}" has ${count}.`,
      );
    }
  }
}

function assertMatrixValues(data, encoding) {
  const matrixFields = [encoding.x, encoding.group, encoding.y];

  data.forEach((row, index) => {
    matrixFields.forEach((field) => {
      if (Array.isArray(row[field])) {
        throw new Error(
          `Matrix mark expects long-cell data; field "${field}" must not contain arrays.`,
        );
      }
    });

    const value = row[encoding.y];
    const isBoolean = typeof value === "boolean";
    const isUnitNumber =
      typeof value === "number" &&
      Number.isFinite(value) &&
      value >= 0 &&
      value <= 1;

    if (!isBoolean && !isUnitNumber) {
      throw new Error(
        `Field "${encoding.y}" for mark "matrix" must contain booleans or numbers between 0 and 1; row ${index} has ${JSON.stringify(value)}.`,
      );
    }
  });
}

function assertNoLegacyOptions(config) {
  Object.entries(LEGACY_TOP_LEVEL_OPTIONS).forEach(([legacy, replacement]) => {
    if (hasOwn(config, legacy)) {
      throw new Error(`${legacy} is no longer supported; use ${replacement}.`);
    }
  });
}

function assertValidFlowOptions(config) {
  if (config.mark !== "flow" || config.colorBy === undefined) return;

  if (config.colorBy === "source") {
    throw new Error(`colorBy "source" is no longer supported; use "x".`);
  }

  if (config.colorBy === "target") {
    throw new Error(`colorBy "target" is no longer supported; use "group".`);
  }

  if (config.colorBy !== "x" && config.colorBy !== "group") {
    throw new Error(`colorBy for mark "flow" must be "x" or "group".`);
  }
}

function assertNoLegacyEncoding(encoding) {
  Object.entries(LEGACY_ENCODING_FIELDS).forEach(([legacy, replacement]) => {
    if (hasOwn(encoding, legacy)) {
      throw new Error(
        `encoding.${legacy} is no longer supported; use encoding.${replacement}.`,
      );
    }
  });
}

function assertSupportedEncoding(mark, definition, encoding) {
  const allowed = new Set([
    ...definition.requiredEncoding,
    ...(definition.optionalEncoding || []),
  ]);

  Object.keys(encoding).forEach((field) => {
    if (!allowed.has(field)) {
      throw new Error(
        `Unsupported encoding field "${field}" for ${chartLabel(mark)}.`,
      );
    }
  });
}

function assertRequiredEncoding(mark, definition, encoding) {
  const missing = definition.requiredEncoding.filter(
    (field) => encoding[field] === undefined,
  );

  if (missing.length > 0) {
    throw new Error(
      `Invalid encoding for ${chartLabel(mark)}: missing ${missing.map((field) => `encoding.${field}`).join(", ")}. Expected encoding fields: ${definition.requiredEncoding.join(", ")}.`,
    );
  }
}

export function validateChartConfig(config = {}) {
  const mark = config.mark || "bar";
  const definition = getChartTypeDefinition(mark)?.encoding;

  if (!definition) {
    throw new Error(`Unsupported mark type: ${mark}`);
  }

  assertChartGeometry(config);

  if (!Array.isArray(config.data || [])) {
    throw new TypeError(`data for ${chartLabel(mark)} must be an array.`);
  }

  const data = config.data || [];
  const encoding = config.encoding;

  if (data.length === 0) {
    throw new RangeError(
      `data for ${chartLabel(mark)} must contain at least one row.`,
    );
  }

  if (!encoding || typeof encoding !== "object" || Array.isArray(encoding)) {
    throw new TypeError(`encoding for ${chartLabel(mark)} must be an object.`);
  }

  assertNoLegacyOptions(config);
  assertValidFlowOptions({ ...config, mark });
  validateMarkStyle(config.markStyle);
  assertNoLegacyEncoding(encoding);
  assertSupportedEncoding(mark, definition, encoding);
  assertRequiredEncoding(mark, definition, encoding);
  assertEncodingFieldNames(mark, encoding, [
    ...definition.requiredEncoding,
    ...(encoding.group !== undefined ? ["group"] : []),
    ...(encoding.size !== undefined ? ["size"] : []),
  ]);

  if (isOrientationInferredChartType(mark) && config.direction !== undefined) {
    throw new Error(
      `direction is not supported for ${chartLabel(mark)}; infer orientation from encoding.x and encoding.y.`,
    );
  }

  const dataBackedChannels = [
    ...definition.requiredEncoding,
    ...(encoding.group !== undefined ? ["group"] : []),
    ...(encoding.size !== undefined ? ["size"] : []),
  ];
  assertRowsHaveFields(mark, data, encoding, dataBackedChannels);

  if (mark === "matrix") {
    assertMatrixValues(data, encoding);
    return;
  }

  if (isOrientationInferredChartType(mark)) {
    const orientation = inferXYOrientation(mark, data, encoding);
    assertFiniteNumbers(mark, data, orientation.valueField, {
      nonNegative: true,
    });

    if (mark === "dumbbell") {
      assertDumbbellPairs(data, encoding, orientation.categoryChannel);
    }

    return;
  }

  if (mark === "line") {
    assertLinePositionValues(data, encoding);
    return;
  }

  (NUMERIC_FIELD_BY_MARK[mark] || []).forEach((channel) => {
    assertFiniteNumbers(mark, data, encoding[channel], { nonNegative: true });
  });

  if (mark === "bubble") {
    assertBubblePositionValues(data, encoding);
  }

  if (mark === "pie" || mark === "flow") {
    assertFiniteNumbers(mark, data, encoding.y, { nonNegative: true });
  }

  if (mark === "bubble" && encoding.size !== undefined) {
    assertFiniteNumbers(mark, data, encoding.size, { nonNegative: true });
  }
}
