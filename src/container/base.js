function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

export function valueOf(accessor, datum, index) {
  if (typeof accessor === "function") return accessor(datum, index);
  if (accessor === undefined || accessor === null) return undefined;
  return datum?.[accessor];
}

export function normalizeMargin(margin = {}) {
  const normalized = {
    top: margin.top ?? 0,
    right: margin.right ?? 0,
    bottom: margin.bottom ?? 0,
    left: margin.left ?? 0,
  };

  Object.entries(normalized).forEach(([side, value]) => {
    if (!isFiniteNumber(value)) {
      throw new TypeError(`container margin.${side} must be a finite number.`);
    }
  });

  return normalized;
}

export function normalizeContainerOptions(options = {}) {
  const width = options.width ?? 400;
  const height = options.height ?? 300;

  if (!isFiniteNumber(width)) {
    throw new TypeError("container width must be a finite number.");
  }

  if (!isFiniteNumber(height)) {
    throw new TypeError("container height must be a finite number.");
  }

  return {
    ...options,
    width,
    height,
    margin: normalizeMargin(options.margin),
  };
}

export function validateContainer(container, label = "container") {
  if (!container || typeof container !== "object") {
    throw new TypeError(`${label} must be a container object.`);
  }

  if (typeof container.slots !== "function") {
    throw new TypeError(`${label} must provide slots(data, mapping, size).`);
  }

  if (!isFiniteNumber(container.width)) {
    throw new TypeError(`${label}.width must be a finite number.`);
  }

  if (!isFiniteNumber(container.height)) {
    throw new TypeError(`${label}.height must be a finite number.`);
  }

  normalizeMargin(container.margin);

  if (
    container.render !== undefined &&
    typeof container.render !== "function"
  ) {
    throw new TypeError(`${label}.render must be a function when provided.`);
  }
}

export function customContainer(options = {}) {
  if (typeof options.slots !== "function") {
    throw new TypeError("customContainer() requires a slots function.");
  }

  if (options.render !== undefined && typeof options.render !== "function") {
    throw new TypeError("customContainer() render must be a function.");
  }

  const normalized = normalizeContainerOptions(options);
  const container = {
    ...normalized,
    slots(data, mapping = {}, size = {}) {
      return options.slots(data, mapping, {
        width: size.width ?? normalized.width,
        height: size.height ?? normalized.height,
      });
    },
  };

  if (options.render !== undefined) {
    container.render = (svg, renderOptions = {}) =>
      options.render(svg, {
        width: renderOptions.width ?? normalized.width,
        height: renderOptions.height ?? normalized.height,
        margin: renderOptions.margin ?? normalized.margin,
      });
  }

  return container;
}
