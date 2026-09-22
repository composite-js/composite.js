import {
  inferXYOrientation,
  isOrientationInferredMark,
} from "./orientation.js";
import { validateMarkStyle } from "./style.js";

export const MARK_DEFINITIONS = {
  bar: {
    requiredEncoding: ["x", "y"],
    optionalEncoding: ["xDomain", "yDomain"],
  },
  groupbar: {
    requiredEncoding: ["x", "y", "group"],
    optionalEncoding: ["xDomain", "yDomain", "groupDomain"],
  },
  stackbar: {
    requiredEncoding: ["x", "y", "group"],
    optionalEncoding: ["xDomain", "yDomain", "groupDomain"],
  },
  area: {
    requiredEncoding: ["x", "y"],
    optionalEncoding: ["xDomain", "yDomain"],
  },
  line: {
    requiredEncoding: ["x", "y"],
    optionalEncoding: ["xDomain", "yDomain"],
  },
  matrix: {
    requiredEncoding: ["x", "group", "y"],
    optionalEncoding: ["xDomain", "groupDomain"],
  },
  scatter: {
    requiredEncoding: ["x", "y"],
    optionalEncoding: ["xDomain", "yDomain"],
  },
  box: {
    requiredEncoding: ["x", "y"],
    optionalEncoding: ["xDomain", "yDomain"],
  },
  bubble: {
    requiredEncoding: ["x", "y"],
    optionalEncoding: ["size", "xDomain", "yDomain"],
  },
  dumbbell: {
    requiredEncoding: ["x", "y"],
    optionalEncoding: ["xDomain", "yDomain"],
  },
  pac: {
    requiredEncoding: ["x", "y"],
    optionalEncoding: ["xDomain", "yDomain"],
  },
  pie: {
    requiredEncoding: ["x", "y"],
    optionalEncoding: ["xDomain"],
  },
  flow: {
    requiredEncoding: ["x", "group", "y"],
    optionalEncoding: ["xDomain", "yDomain", "groupDomain"],
  },
  stream: {
    requiredEncoding: ["x", "y", "group"],
    optionalEncoding: ["xDomain", "yDomain", "groupDomain"],
  },
};

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
  line: ["x", "y"],
  scatter: ["x", "y"],
  stream: ["y"],
};

function chartLabel(mark) {
  return `mark "${mark}"`;
}

function hasOwn(value, key) {
  return Object.prototype.hasOwnProperty.call(value, key);
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
    const numeric = Number(row[field]);
    const isFinite = Number.isFinite(numeric);
    if (!isFinite || (nonNegative && numeric < 0)) {
      const description =
        nonNegative && isFinite ? "non-negative numbers" : "finite numbers";
      throw new Error(
        `Field "${field}" for ${chartLabel(mark)} must contain ${description}; row ${index} has ${JSON.stringify(row[field])}.`,
      );
    }
  });
}

function assertBubblePositionValues(data, encoding) {
  ["x", "y"].forEach((channel) => {
    const field = encoding[channel];
    if (typeof data[0][field] !== "number") return;
    assertFiniteNumbers("bubble", data, field, { nonNegative: true });
  });
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
    const numeric = Number(value);
    const isUnitNumber =
      Number.isFinite(numeric) && numeric >= 0 && numeric <= 1;

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
  const definition = MARK_DEFINITIONS[mark];

  if (!definition) {
    throw new Error(`Unsupported mark type: ${mark}`);
  }

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
    ...(encoding.size !== undefined ? ["size"] : []),
  ]);

  if (isOrientationInferredMark(mark) && config.direction !== undefined) {
    throw new Error(
      `direction is not supported for ${chartLabel(mark)}; infer orientation from encoding.x and encoding.y.`,
    );
  }

  const dataBackedChannels = [
    ...definition.requiredEncoding,
    ...(encoding.size !== undefined ? ["size"] : []),
  ];
  assertRowsHaveFields(mark, data, encoding, dataBackedChannels);

  if (mark === "matrix") {
    assertMatrixValues(data, encoding);
    return;
  }

  if (isOrientationInferredMark(mark)) {
    const orientation = inferXYOrientation(mark, data, encoding);
    assertFiniteNumbers(mark, data, orientation.valueField, {
      nonNegative: true,
    });

    if (mark === "dumbbell") {
      assertDumbbellPairs(data, encoding, orientation.categoryChannel);
    }

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
