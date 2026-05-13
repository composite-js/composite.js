import * as d3 from "d3";

function defaultTextWidth(options) {
  const fontSize = Number(options.fontSize || 12);
  return String(options.text || "").length * fontSize * 0.62;
}

/**
 * Renderable SVG text element used by the layout tree.
 */
export class TextElement {
  constructor(options = {}) {
    this.options = {
      ...options,
      width:
        options.width !== undefined ? options.width : defaultTextWidth(options),
      height:
        options.height !== undefined
          ? options.height
          : Number(options.fontSize || 12) * 1.4,
    };
    this.width = this.options.width;
    this.height = this.options.height;
  }

  render(container, renderOptions = {}) {
    const svg = d3.select(container);
    svg.selectAll("*").remove();

    const margin = renderOptions.margin || {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    };
    const width =
      renderOptions.width !== undefined ? renderOptions.width : this.width;
    const height =
      renderOptions.height !== undefined ? renderOptions.height : this.height;
    const options = this.options;
    const x = margin.left + (options.x !== undefined ? options.x : width / 2);
    const y = margin.top + (options.y !== undefined ? options.y : height / 2);

    const label = svg
      .append("text")
      .attr("x", x)
      .attr("y", y)
      .attr("fill", options.fill || "currentColor")
      .attr("font-family", options.fontFamily || "sans-serif")
      .attr("font-size", options.fontSize !== undefined ? options.fontSize : 12)
      .attr("text-anchor", options.textAnchor || "middle")
      .attr("dominant-baseline", options.dominantBaseline || "middle")
      .text(options.text || "");

    if (options.fontWeight !== undefined)
      label.attr("font-weight", options.fontWeight);
    if (options.fontStyle !== undefined)
      label.attr("font-style", options.fontStyle);
    if (options.opacity !== undefined) label.attr("opacity", options.opacity);
    if (options.className !== undefined) label.attr("class", options.className);
    if (options.id !== undefined) label.attr("id", options.id);
    if (options.rotate !== undefined) {
      label.attr("transform", `rotate(${options.rotate}, ${x}, ${y})`);
    }
    if (options.title !== undefined) label.append("title").text(options.title);
  }
}
