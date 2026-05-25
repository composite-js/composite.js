import * as d3 from "d3";

const zeroMargin = { top: 0, right: 0, bottom: 0, left: 0 };
let clipPathCounter = 0;

function resolveUrl(options) {
  const url = options.url ?? options.src ?? options.href;

  if (typeof url !== "string" || url.trim() === "") {
    throw new TypeError("image() requires a url or src string.");
  }

  return url;
}

function preserveAspectRatio(options) {
  if (options.preserveAspectRatio !== undefined) {
    return options.preserveAspectRatio;
  }

  const align = options.align || "xMidYMid";
  switch (options.fit) {
    case "cover":
    case "crop":
      return `${align} slice`;
    case "fill":
    case "stretch":
    case "none":
      return "none";
    case "contain":
    default:
      return `${align} meet`;
  }
}

function clipType(options) {
  if (options.clip !== undefined) return options.clip;
  if (options.shape === "circle") return "circle";
  if (
    options.cornerRadius !== undefined ||
    options.borderRadius !== undefined
  ) {
    return "rounded";
  }
  return null;
}

function nextClipPathId() {
  clipPathCounter += 1;
  return `composite-image-clip-${clipPathCounter}`;
}

function appendRoundedRect(selection, x, y, width, height, radius) {
  return selection
    .append("rect")
    .attr("x", x)
    .attr("y", y)
    .attr("width", width)
    .attr("height", height)
    .attr("rx", radius)
    .attr("ry", radius);
}

function appendCircle(selection, x, y, width, height) {
  const radius = Math.min(width, height) / 2;
  return selection
    .append("circle")
    .attr("cx", x + width / 2)
    .attr("cy", y + height / 2)
    .attr("r", radius);
}

/**
 * Renderable SVG image element used by the layout tree.
 */
export class ImageElement {
  constructor(options = {}) {
    const url = resolveUrl(options);
    this.options = {
      ...options,
      url,
      width: options.width !== undefined ? options.width : 100,
      height: options.height !== undefined ? options.height : 100,
    };
    this.width = this.options.width;
    this.height = this.options.height;
  }

  render(container, renderOptions = {}) {
    const svg = d3.select(container);
    svg.selectAll("*").remove();

    const margin = renderOptions.margin || zeroMargin;
    const width =
      renderOptions.width !== undefined ? renderOptions.width : this.width;
    const height =
      renderOptions.height !== undefined ? renderOptions.height : this.height;
    const options = this.options;
    const x = margin.left + (options.x !== undefined ? options.x : 0);
    const y = margin.top + (options.y !== undefined ? options.y : 0);
    const type = clipType(options);
    const cornerRadius = Number(
      options.cornerRadius !== undefined
        ? options.cornerRadius
        : options.borderRadius || 0,
    );
    let clipPathId = null;

    if (type) {
      clipPathId = options.clipPathId || nextClipPathId();
      const clipPath = svg
        .append("defs")
        .append("clipPath")
        .attr("id", clipPathId);

      if (type === "circle") {
        appendCircle(clipPath, x, y, width, height);
      } else {
        appendRoundedRect(clipPath, x, y, width, height, cornerRadius);
      }
    }

    const renderedImage = svg
      .append("image")
      .attr("x", x)
      .attr("y", y)
      .attr("width", width)
      .attr("height", height)
      .attr("href", options.url)
      .attr("preserveAspectRatio", preserveAspectRatio(options));

    renderedImage.node().setAttribute("xlink:href", options.url);

    if (clipPathId) renderedImage.attr("clip-path", `url(#${clipPathId})`);
    if (options.opacity !== undefined)
      renderedImage.attr("opacity", options.opacity);
    if (options.className !== undefined)
      renderedImage.attr("class", options.className);
    if (options.id !== undefined) renderedImage.attr("id", options.id);
    if (options.crossOrigin !== undefined)
      renderedImage.attr("crossorigin", options.crossOrigin);
    if (options.title !== undefined)
      renderedImage.append("title").text(options.title);

    const transforms = [];
    if (options.rotate !== undefined) {
      transforms.push(
        `rotate(${options.rotate}, ${x + width / 2}, ${y + height / 2})`,
      );
    }
    if (options.transform !== undefined) transforms.push(options.transform);
    if (transforms.length > 0) {
      renderedImage.attr("transform", transforms.join(" "));
    }

    if (
      options.stroke !== undefined ||
      options.strokeWidth !== undefined ||
      options.fill !== undefined
    ) {
      const outline =
        type === "circle"
          ? appendCircle(svg, x, y, width, height)
          : appendRoundedRect(svg, x, y, width, height, cornerRadius);

      outline
        .attr("fill", options.fill || "none")
        .attr("stroke", options.stroke || "none")
        .attr(
          "stroke-width",
          options.strokeWidth !== undefined ? options.strokeWidth : 1,
        );
    }
  }
}
