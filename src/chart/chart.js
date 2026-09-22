import { AxisRenderer } from "./axis.js";
import { normalizePadding } from "./padding.js";
import { getChartTypeDefinition } from "./registry.js";
import * as renderers from "./type/index.js";
import { validateChartConfig } from "./validation.js";
import { isSvgContainer } from "../utils/dom.js";
import * as d3 from "d3";

/**
 * Base class for all charts.
 */
export class Chart {
  /**
   * Creates an instance of Chart.
   * @param {Object} options - The chart configuration options.
   */
  constructor(options = {}) {
    this.data = options.data || [];
    this.mark = options.mark || "bar";
    this.encoding = options.encoding || {};
    this.width = options.width || 400;
    this.height = options.height || 300;
    this.margin = {
      top: 40,
      right: 40,
      bottom: 40,
      left: 40,
      ...options.margin,
    };
    this.bbox = { x: 0, y: 0, width: 0, height: 0 };
    this.options = options;

    const defaultPaddingValue =
      getChartTypeDefinition(this.mark)?.defaultPadding ?? 0.1;
    this.padding = normalizePadding(options.padding, defaultPaddingValue);

    this.validate();
    this._createRenderer();
  }

  validate() {
    validateChartConfig({
      ...this.options,
      data: this.data,
      mark: this.mark,
      encoding: this.encoding,
    });
  }

  /**
   * Creates the appropriate renderer based on chart type.
   * @private
   */
  _createRenderer() {
    const rendererOptions = {
      ...this.options,
      mark: this.mark,
      encoding: this.encoding,
      width: this.width,
      height: this.height,
      margin: this.margin,
      padding: this.padding,
    };

    const definition = getChartTypeDefinition(this.mark);
    const Renderer = definition && renderers[definition.renderer];

    if (!Renderer) {
      throw new Error(`Unsupported mark type: ${this.mark}`);
    }

    this.renderer = new Renderer(rendererOptions);
  }

  _applySharedDomains(domains = {}) {
    const nextEncoding = { ...this.encoding };
    let changed = false;

    Object.entries(domains).forEach(([key, domain]) => {
      if (nextEncoding[key] !== undefined || !Array.isArray(domain)) return;
      nextEncoding[key] = [...domain];
      changed = true;
    });

    if (!changed) return;

    this.encoding = nextEncoding;
    this.options = {
      ...this.options,
      encoding: nextEncoding,
    };

    if (this.renderer) {
      this.renderer.encoding = nextEncoding;
      this.renderer.options = {
        ...this.renderer.options,
        encoding: nextEncoding,
      };
    }
  }

  /**
   * Renders the chart into the specified DOM container.
   * @param {HTMLElement} container - The container element.
   * @param {Object} [renderOptions] - Optional render overrides.
   */
  render(container, renderOptions = {}) {
    this.validate();

    // Clear container
    container.innerHTML = "";

    // Merge margins: renderOptions.margin > options.margin > defaultMargin
    const defaultMargin = { top: 40, right: 40, bottom: 40, left: 40 };
    const currentMargin = {
      ...defaultMargin,
      ...this.margin,
      ...renderOptions.margin,
    };

    const currentWidth =
      renderOptions.width !== undefined ? renderOptions.width : this.width;
    const currentHeight =
      renderOptions.height !== undefined ? renderOptions.height : this.height;

    let svg;
    if (isSvgContainer(container)) {
      svg = container;
    } else {
      svg = d3
        .create("svg")
        .attr("width", currentWidth + currentMargin.left + currentMargin.right)
        .attr(
          "height",
          currentHeight + currentMargin.top + currentMargin.bottom,
        )
        .node();
      container.appendChild(svg);
    }

    // Update renderer with new options
    this.renderer.width = currentWidth;
    this.renderer.height = currentHeight;
    this.renderer.margin = currentMargin;

    // Render the mark
    const axisConfig = this.renderer.render(svg, this.data);

    // Draw axes using the config returned by chart renderers
    if (axisConfig) {
      const axisRenderer = new AxisRenderer(axisConfig.axisOptions);
      axisRenderer.render(svg, axisConfig.scales, axisConfig.dimensions);
    }

    return axisConfig;
  }
}
