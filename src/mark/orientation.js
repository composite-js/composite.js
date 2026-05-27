export const ORIENTATION_INFERRED_MARKS = new Set([
  "bar",
  "groupbar",
  "stackbar",
  "box",
  "dumbbell",
  "pac",
]);

export function isOrientationInferredMark(mark) {
  return ORIENTATION_INFERRED_MARKS.has(mark);
}

function chartLabel(mark) {
  return `mark "${mark}"`;
}

function channelKind(data, field) {
  const values = data
    .map((row) => row[field])
    .filter((value) => value !== null && value !== undefined);
  const numeric =
    values.length > 0 &&
    values.every(
      (value) => typeof value === "number" && Number.isFinite(value),
    );

  return numeric ? "numeric" : "categorical";
}

export function inferXYOrientation(mark, data = [], encoding = {}) {
  const xKind = channelKind(data, encoding.x);
  const yKind = channelKind(data, encoding.y);

  if (xKind === "numeric" && yKind === "categorical") {
    return {
      direction: "horizontal",
      valueChannel: "x",
      categoryChannel: "y",
      valueField: encoding.x,
      categoryField: encoding.y,
    };
  }

  if (xKind === "categorical" && yKind === "numeric") {
    return {
      direction: "vertical",
      valueChannel: "y",
      categoryChannel: "x",
      valueField: encoding.y,
      categoryField: encoding.x,
    };
  }

  throw new Error(
    `Cannot infer orientation for ${chartLabel(mark)}: exactly one of encoding.x and encoding.y must contain numbers. Received encoding.x as ${xKind} and encoding.y as ${yKind}; convert categorical values to strings.`,
  );
}
