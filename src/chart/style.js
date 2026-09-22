import * as d3 from "d3";
import rough from "roughjs";

const BUILTIN_STYLES = new Set(["default", "rounded", "sketch"]);

function assertObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object.`);
  }
}

export function validateMarkStyle(markStyle) {
  if (markStyle === undefined) return;

  if (typeof markStyle === "string") {
    if (!BUILTIN_STYLES.has(markStyle)) {
      throw new Error(`Unsupported markStyle "${markStyle}".`);
    }
    return;
  }

  assertObject(markStyle, "markStyle");

  if (markStyle.type !== undefined) {
    if (
      typeof markStyle.type !== "string" ||
      !BUILTIN_STYLES.has(markStyle.type)
    ) {
      throw new Error(`Unsupported markStyle "${markStyle.type}".`);
    }
  }

  if (markStyle.options !== undefined) {
    assertObject(markStyle.options, "markStyle.options");
  }

  ["rect", "circle", "sector"].forEach((primitive) => {
    if (
      markStyle[primitive] !== undefined &&
      typeof markStyle[primitive] !== "function"
    ) {
      throw new TypeError(`markStyle.${primitive} must be a function.`);
    }
  });
}

export function normalizeMarkStyle(markStyle) {
  validateMarkStyle(markStyle);

  if (markStyle === undefined) {
    return {
      type: "default",
      options: {},
      custom: {},
    };
  }

  if (typeof markStyle === "string") {
    return {
      type: markStyle,
      options: {},
      custom: {},
    };
  }

  return {
    type: markStyle.type || "default",
    options: markStyle.options || {},
    custom: {
      rect: markStyle.rect,
      circle: markStyle.circle,
      sector: markStyle.sector,
    },
  };
}

function applyCommonAttributes(selection, context) {
  if (context.fill !== undefined) selection.attr("fill", context.fill);
  if (context.stroke !== undefined) selection.attr("stroke", context.stroke);
  if (context.strokeWidth !== undefined) {
    selection.attr("stroke-width", context.strokeWidth);
  }
  if (context.opacity !== undefined) selection.attr("opacity", context.opacity);
  return selection;
}

function roundedRadius(width, height) {
  return Math.max(0, Math.min(6, Math.abs(width), Math.abs(height)) / 4);
}

function sectorPath(context, options = {}) {
  const angleSpan = Math.max(0, context.endAngle - context.startAngle);
  const jitter = options.sketch ? Math.min(0.008, angleSpan / 12) : 0;
  const arc = d3
    .arc()
    .innerRadius(context.innerRadius)
    .outerRadius(context.outerRadius)
    .startAngle((d) => d.startAngle + jitter)
    .endAngle((d) => d.endAngle - jitter);

  if (options.rounded) {
    arc.cornerRadius(Math.min(4, context.outerRadius * 0.08));
  }

  return arc(context.arcDatum);
}

function sketchSeed(context, primitive) {
  const source = `${context.mark}:${context.role}:${context.index}:${primitive}`;
  let seed = 0;

  for (let index = 0; index < source.length; index += 1) {
    seed = (seed * 31 + source.charCodeAt(index)) % 2147483647;
  }

  return seed || 1;
}

function sketchOptions(context, primitive) {
  const fill = context.fill || "none";

  return {
    seed: sketchSeed(context, primitive),
    roughness: 0.5,
    bowing: 0.4,
    fill,
    fillStyle: "hachure",
    hachureGap: 3,
    stroke: context.stroke || context.fill || "currentColor",
    strokeWidth: context.strokeWidth || 1,
  };
}

function appendRoughNode(context, node) {
  context.container.node().appendChild(node);

  const selection = d3
    .select(node)
    .attr("data-mark-style", "sketch")
    .attr("fill", context.fill || "none");

  node.querySelectorAll("path").forEach((path) => {
    const pathSelection = d3
      .select(path)
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round");

    if (
      context.fill !== undefined &&
      (path.getAttribute("stroke") === context.fill ||
        path.getAttribute("fill") === context.fill)
    ) {
      pathSelection.attr("data-sketch-fill", "true");
    }
  });

  return selection;
}

function ensureSelection(result, primitive) {
  if (
    !result ||
    typeof result.attr !== "function" ||
    typeof result.node !== "function"
  ) {
    throw new TypeError(`markStyle.${primitive} must return a D3 selection.`);
  }

  return result;
}

const BUILTIN_RENDERERS = {
  default: {
    rect(context) {
      return applyCommonAttributes(
        context.container
          .append("rect")
          .attr("x", context.left)
          .attr("y", context.top)
          .attr("width", context.width)
          .attr("height", context.height),
        context,
      );
    },
    circle(context) {
      return applyCommonAttributes(
        context.container
          .append("circle")
          .attr("cx", context.centerX)
          .attr("cy", context.centerY)
          .attr("r", context.radius),
        context,
      );
    },
    sector(context) {
      return applyCommonAttributes(
        context.container.append("path").attr("d", sectorPath(context)),
        context,
      );
    },
  },
  rounded: {
    rect(context) {
      const radius = roundedRadius(context.width, context.height);
      return applyCommonAttributes(
        context.container
          .append("rect")
          .attr("x", context.left)
          .attr("y", context.top)
          .attr("width", context.width)
          .attr("height", context.height)
          .attr("rx", radius)
          .attr("ry", radius),
        context,
      );
    },
    circle(context) {
      return BUILTIN_RENDERERS.default.circle(context);
    },
    sector(context) {
      return applyCommonAttributes(
        context.container
          .append("path")
          .attr("d", sectorPath(context, { rounded: true }))
          .attr("stroke-linejoin", "round")
          .attr("stroke-linecap", "round"),
        context,
      );
    },
  },
  sketch: {
    rect(context) {
      return appendRoughNode(
        context,
        rough
          .svg(context.container.node())
          .rectangle(
            context.left,
            context.top,
            context.width,
            context.height,
            sketchOptions(context, "rect"),
          ),
      );
    },
    circle(context) {
      return appendRoughNode(
        context,
        rough
          .svg(context.container.node())
          .circle(
            context.centerX,
            context.centerY,
            context.radius * 2,
            sketchOptions(context, "circle"),
          ),
      );
    },
    sector(context) {
      return appendRoughNode(
        context,
        rough
          .svg(context.container.node())
          .path(
            sectorPath(context, { sketch: true }),
            sketchOptions(context, "sector"),
          ),
      );
    },
  },
};

export function renderStyledRect(markStyle, context) {
  if (markStyle.custom.rect) {
    return ensureSelection(markStyle.custom.rect(context), "rect");
  }

  return BUILTIN_RENDERERS[markStyle.type].rect(context);
}

export function renderStyledCircle(markStyle, context) {
  if (markStyle.custom.circle) {
    return ensureSelection(markStyle.custom.circle(context), "circle");
  }

  return BUILTIN_RENDERERS[markStyle.type].circle(context);
}

export function renderStyledSector(markStyle, context) {
  if (markStyle.custom.sector) {
    return ensureSelection(markStyle.custom.sector(context), "sector");
  }

  return BUILTIN_RENDERERS[markStyle.type].sector(context);
}
