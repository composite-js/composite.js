/**
 * Base class for mark renderers.
 */
export class MarkRenderer {
  /**
   * Creates an instance of MarkRenderer.
   * @param {Object} options - Chart options.
   */
  constructor(options = {}) {
    this.options = options;
    this.encoding = options.encoding || {};
    this.width = options.width || 400;
    this.height = options.height || 300;
    this.margin = options.margin || {
      top: 40,
      right: 40,
      bottom: 40,
      left: 40,
    };
  }

  /**
   * Renders the chart. Must be implemented by subclasses.
   * @param {SVGElement} svg - The SVG container.
   * @param {Array} data - The data to render.
   * @returns {Object|null} Axis configuration object or null.
   */
  render(svg, data) {
    throw new Error("render method must be implemented by subclass");
  }
}
