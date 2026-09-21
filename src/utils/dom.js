const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

export function isSvgContainer(container) {
  return container?.namespaceURI === SVG_NAMESPACE;
}

export function isHtmlContainer(container) {
  return Boolean(
    !isSvgContainer(container) &&
    container?.ownerDocument &&
    typeof container.ownerDocument.createElementNS === "function" &&
    typeof container.appendChild === "function",
  );
}

export function createSvgElement(document) {
  return document.createElementNS(SVG_NAMESPACE, "svg");
}
