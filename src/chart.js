import { drawBarChart } from "./marks/bar.js";
import { drawLineChart } from "./marks/line.js";
import { drawMatrix } from "./marks/matrix.js";
import { drawScatter } from "./marks/scatter.js";
import { drawBoxPlot } from "./marks/box.js";
import { drawAxes } from "./axis.js";
import * as d3 from "d3";

/**
 * Creates a chart instance with the specified options.
 * @param {Object} options - The chart configuration options.
 * @param {Array} options.data - The data array.
 * @param {string} options.mark - The mark type ('bar' | 'line' | 'matrix').
 * @param {Object} options.encoding - The encoding configuration (e.g., { x: 'field', y: 'field' }).
 * @param {number} [options.width=400] - The chart width.
 * @param {number} [options.height=300] - The chart height.
 * @param {string} [options.direction='vertical'] - The chart direction (only for bar chart).
 * @param {Object} [options.axis] - Axis configuration { x: { display: boolean }, y: { display: boolean } }.
 * @returns {Object} The chart instance containing a render method.
 */
export function createChart(options) {
  const {
    data = [],
    mark = "bar",
    encoding = {},
    width = 400,
    height = 300,
  } = options;

  const defaultMargin = { top: 40, right: 40, bottom: 40, left: 40 };
  const margin = { ...defaultMargin, ...options.margin };

  return {
    width: width + margin.left + margin.right,
    height: height + margin.top + margin.bottom,
    options, // Expose options for layout engine if needed
    /**
     * Renders the chart into the specified DOM container.
     * @param {HTMLElement} container - The container element.
     * @param {Object} [renderOptions] - Optional render overrides.
     */
    render(container, renderOptions = {}) {
      // Clear container
      container.innerHTML = "";

      // Merge margins: renderOptions.margin > options.margin > defaultMargin
      const currentMargin = {
        ...defaultMargin,
        ...options.margin,
        ...renderOptions.margin,
      };

      let svg;
      if (container instanceof SVGElement) {
        // Use existing SVG element if provided
        svg = container;
      } else {
        // Create new SVG container
        svg = d3
          .create("svg")
          .attr("width", width + currentMargin.left + currentMargin.right)
          .attr("height", height + currentMargin.top + currentMargin.bottom)
          .node();
        container.appendChild(svg);
      }

      // Validate encoding
      const yField = encoding.y;
      const xField = encoding.x;

      if (!yField || !xField) {
        console.warn("Missing encoding configuration for x or y.");
        return;
      }

      const drawOptions = { ...options, margin: currentMargin };

      // Dispatch to specific mark renderer and collect axis config
      let axisConfig = null;

      if (mark === "bar") {
        axisConfig = drawBarChart(svg, data, drawOptions);
      } else if (mark === "line") {
        axisConfig = drawLineChart(svg, data, drawOptions);
      } else if (mark === "matrix") {
        drawMatrix(svg, data, drawOptions);
      } else if (mark === "scatter") {
        axisConfig = drawScatter(svg, data, drawOptions);
      } else if (mark === "box") {
        axisConfig = drawBoxPlot(svg, data, drawOptions);
      }

      // Draw axes using the config returned by mark renderers
      if (axisConfig) {
        drawAxes(
          svg,
          axisConfig.scales,
          axisConfig.dimensions,
          axisConfig.axisOptions,
        );
      }
    },
  };
}
