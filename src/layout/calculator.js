import { DomMeasurementAdapter } from "./measurement.js";
import { inferXYOrientation } from "../mark/orientation.js";
import { Node } from "./node.js";

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

  static estimateMargin(element, context = {}) {
    const width = element.options?.width ?? element.width ?? 400;
    const height = element.options?.height ?? element.height ?? 300;
    return LayoutCalculator.measurementAdapter.measureMargin(
      element,
      { width, height },
      context,
    );
  }

  static suggestWidthHeight(node) {
    const options = getOptions(node);
    const data = options.data || node.data || [];
    const encoding = options.encoding || node.encoding || {};
    const mark = options.mark || node.mark;
    const defaultWidth = 400;
    const defaultHeight = 300;

    if (Node.isRepeat(node)) {
      return { width: defaultWidth, height: defaultHeight };
    }

    if (mark === "bar") {
      try {
        const orientation = inferXYOrientation(mark, data, encoding);
        const categoryField = encoding[orientation.categoryChannel];
        const uniqueCategories = new Set(data.map((d) => d[categoryField]))
          .size;

        if (orientation.valueChannel === "x") {
          return {
            width: defaultWidth,
            height: Math.max(defaultHeight, uniqueCategories * 20),
          };
        }

        return {
          width: Math.max(defaultWidth, uniqueCategories * 20),
          height: defaultHeight,
        };
      } catch {
        return { width: defaultWidth, height: defaultHeight };
      }
    }

    return { width: defaultWidth, height: defaultHeight };
  }
}
