import { createRenderContext } from "./render-context.js";

/**
 * DOM-backed measurement adapter for SVG margin estimation.
 */
export class DomMeasurementAdapter {
  measureMargin(element, { width, height }, context = {}) {
    const document = context.document || globalThis.document;
    if (
      !document ||
      !document?.body ||
      typeof document.createElementNS !== "function"
    ) {
      throw new Error(
        "LayoutCalculator.estimateMargin requires a DOM with SVG getBBox support.",
      );
    }

    const zeroMargin = { top: 0, right: 0, bottom: 0, left: 0 };
    const tempSvg = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "svg",
    );

    tempSvg.setAttribute("width", width);
    tempSvg.setAttribute("height", height);
    tempSvg.style.position = "absolute";
    tempSvg.style.left = "-10000px";
    tempSvg.style.top = "-10000px";
    tempSvg.style.visibility = "hidden";
    tempSvg.style.overflow = "visible";

    document.body.appendChild(tempSvg);

    try {
      element.render(
        tempSvg,
        {
          width,
          height,
          margin: zeroMargin,
        },
        createRenderContext(),
      );

      if (typeof tempSvg.getBBox !== "function") {
        throw new Error(
          "LayoutCalculator.estimateMargin requires a DOM with SVG getBBox support.",
        );
      }

      const bbox = tempSvg.getBBox();
      return {
        top: Math.max(0, -bbox.y),
        right: Math.max(0, bbox.x + bbox.width - width),
        bottom: Math.max(0, bbox.y + bbox.height - height),
        left: Math.max(0, -bbox.x),
      };
    } finally {
      tempSvg.remove();
    }
  }
}
