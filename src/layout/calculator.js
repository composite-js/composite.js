import { DomMeasurementAdapter } from "./measurement.js";

function getOptions(node) {
  return node?.options || {};
}

/**
 * Layout sizing and measurement utilities.
 */
export class LayoutCalculator {
  static measurementAdapter = new DomMeasurementAdapter();

  static getMeasurementAdapter() {
    return this.measurementAdapter;
  }

  static setMeasurementAdapter(adapter) {
    if (!adapter || typeof adapter.measureMargin !== "function") {
      throw new TypeError(
        "measurement adapter must provide measureMargin(element, size).",
      );
    }
    this.measurementAdapter = adapter;
  }

  static estimateMargin(element) {
    const width = element.options?.width ?? element.width ?? 400;
    const height = element.options?.height ?? element.height ?? 300;
    return LayoutCalculator.measurementAdapter.measureMargin(element, {
      width,
      height,
    });
  }

  static suggestWidthHeight(node) {
    const options = getOptions(node);
    const data = options.data || node.data || [];
    const encoding = options.encoding || node.encoding || {};
    const mark = options.mark || node.mark;
    const direction = options.direction || node.direction;
    const defaultWidth = 400;
    const defaultHeight = 300;

    if (node.isRepeat) {
      return { width: defaultWidth, height: defaultHeight };
    }

    if (mark === "bar") {
      if (direction === "horizontal" && encoding.y) {
        const uniqueY = new Set(data.map((d) => d[encoding.y])).size;
        return {
          width: defaultWidth,
          height: Math.max(defaultHeight, uniqueY * 20),
        };
      }

      if (encoding.x) {
        const uniqueX = new Set(data.map((d) => d[encoding.x])).size;
        return {
          width: Math.max(defaultWidth, uniqueX * 20),
          height: defaultHeight,
        };
      }
    }

    return { width: defaultWidth, height: defaultHeight };
  }
}
