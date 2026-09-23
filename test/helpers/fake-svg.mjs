const SVG_NS = "http://www.w3.org/2000/svg";
const XHTML_NS = "http://www.w3.org/1999/xhtml";

function parseTranslate(transform) {
  const match = /translate\(\s*([-+.\deE]+)(?:[\s,]+([-+.\deE]+))?/.exec(
    transform || "",
  );
  if (!match) return { x: 0, y: 0 };
  return { x: Number(match[1]) || 0, y: Number(match[2]) || 0 };
}

function unionBounds(a, b) {
  if (!a) return b;
  if (!b) return a;
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  const right = Math.max(a.x + a.width, b.x + b.width);
  const bottom = Math.max(a.y + a.height, b.y + b.height);
  return { x, y, width: right - x, height: bottom - y };
}

function pathBounds(d) {
  const values = String(d || "")
    .match(/[-+]?(?:\d*\.)?\d+(?:e[-+]?\d+)?/gi)
    ?.map(Number)
    .filter(Number.isFinite);
  if (!values || values.length < 2) return null;

  const xs = [];
  const ys = [];
  for (let i = 0; i < values.length - 1; i += 2) {
    xs.push(values[i]);
    ys.push(values[i + 1]);
  }

  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y };
}

function textBounds(node) {
  const fontSize = Number.parseFloat(node.getAttribute("font-size") || 12);
  const text = node.textContent || "";
  const x = Number(node.getAttribute("x") || 0);
  const y = Number(node.getAttribute("y") || 0);
  return {
    x,
    y: y - fontSize,
    width: text.length * fontSize * 0.62,
    height: fontSize * 1.2,
  };
}

function ownBounds(node) {
  switch (node.tagName) {
    case "rect":
      return {
        x: Number(node.getAttribute("x") || 0),
        y: Number(node.getAttribute("y") || 0),
        width: Number(node.getAttribute("width") || 0),
        height: Number(node.getAttribute("height") || 0),
      };
    case "circle": {
      const cx = Number(node.getAttribute("cx") || 0);
      const cy = Number(node.getAttribute("cy") || 0);
      const r = Number(node.getAttribute("r") || 0);
      return { x: cx - r, y: cy - r, width: r * 2, height: r * 2 };
    }
    case "line": {
      const x1 = Number(node.getAttribute("x1") || 0);
      const y1 = Number(node.getAttribute("y1") || 0);
      const x2 = Number(node.getAttribute("x2") || 0);
      const y2 = Number(node.getAttribute("y2") || 0);
      const x = Math.min(x1, x2);
      const y = Math.min(y1, y2);
      return { x, y, width: Math.abs(x2 - x1), height: Math.abs(y2 - y1) };
    }
    case "path":
      return pathBounds(node.getAttribute("d"));
    case "text":
      return textBounds(node);
    default:
      return null;
  }
}

function shifted(bounds, transform) {
  if (!bounds) return null;
  const offset = parseTranslate(transform);
  return {
    x: bounds.x + offset.x,
    y: bounds.y + offset.y,
    width: bounds.width,
    height: bounds.height,
  };
}

function matchesSelector(node, selector) {
  if (selector === "*") return true;
  if (selector.startsWith(".")) {
    return (node.getAttribute("class") || "")
      .split(/\s+/)
      .includes(selector.slice(1));
  }
  const attributeMatch = /^\[([^=\]]+)(?:=["']([^"']*)["'])?\]$/.exec(selector);
  if (attributeMatch) {
    const [, name, value] = attributeMatch;
    const actual = node.getAttribute(name);
    return value === undefined ? actual !== null : actual === value;
  }
  return node.tagName === selector;
}

export class FakeSvgElement {
  constructor(tagName = "svg", ownerDocument = null, namespaceURI = SVG_NS) {
    this.tagName = tagName;
    this.nodeName = tagName;
    this.namespaceURI = namespaceURI;
    this.ownerDocument = ownerDocument || new FakeSvgDocument();
    this.children = [];
    this.parentNode = null;
    this.attributes = new Map();
    this.listeners = new Map();
    this.__data__ = undefined;
    this._textContent = "";
    this._styleProperties = new Map();

    this.style = {
      setProperty: (name, value) => {
        this._styleProperties.set(name, String(value));
      },
      getPropertyValue: (name) => this._styleProperties.get(name) ?? "",
      removeProperty: (name) => {
        const previousValue = this._styleProperties.get(name) ?? "";
        this._styleProperties.delete(name);
        return previousValue;
      },
    };
  }

  appendChild(child) {
    if (child.parentNode) child.parentNode.removeChild(child);
    child.parentNode = this;
    this.children.push(child);
    return child;
  }

  insertBefore(child, nextSibling) {
    if (child.parentNode) {
      child.parentNode.removeChild(child);
    }

    child.parentNode = this;

    if (!nextSibling) {
      this.children.push(child);
      return child;
    }

    const index = this.children.indexOf(nextSibling);
    if (index < 0) {
      this.children.push(child);
    } else {
      this.children.splice(index, 0, child);
    }

    return child;
  }

  removeChild(child) {
    const index = this.children.indexOf(child);
    if (index >= 0) {
      this.children.splice(index, 1);
      child.parentNode = null;
    }
    return child;
  }

  remove() {
    if (this.parentNode) this.parentNode.removeChild(this);
  }

  querySelectorAll(selector) {
    const descendants = [];
    const visit = (node) => {
      node.children.forEach((child) => {
        if (matchesSelector(child, selector)) descendants.push(child);
        visit(child);
      });
    };
    visit(this);
    return descendants;
  }

  querySelector(selector) {
    return this.querySelectorAll(selector)[0] || null;
  }

  matches(selector) {
    return matchesSelector(this, selector);
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }

  setAttributeNS(_namespace, name, value) {
    this.setAttribute(name, value);
  }

  getAttribute(name) {
    return this.attributes.get(name) ?? null;
  }

  getAttributeNS(_namespace, name) {
    return this.getAttribute(name);
  }

  removeAttribute(name) {
    this.attributes.delete(name);
  }

  removeAttributeNS(_namespace, name) {
    this.removeAttribute(name);
  }

  addEventListener(type, listener) {
    this.listeners.set(type, listener);
  }

  removeEventListener(type) {
    this.listeners.delete(type);
  }

  compareDocumentPosition(other) {
    if (!this.parentNode || this.parentNode !== other?.parentNode) return 0;
    const siblings = this.parentNode.children;
    return siblings.indexOf(this) < siblings.indexOf(other) ? 4 : 2;
  }

  getBBox() {
    let bounds = ownBounds(this);
    this.children.forEach((child) => {
      bounds = unionBounds(
        bounds,
        shifted(child.getBBox(), child.getAttribute("transform")),
      );
    });
    return bounds || { x: 0, y: 0, width: 0, height: 0 };
  }

  get textContent() {
    return this._textContent;
  }

  set textContent(value) {
    this._textContent = String(value ?? "");
    this.children = [];
  }

  get innerHTML() {
    return "";
  }

  set innerHTML(_value) {
    this.children = [];
    this._textContent = "";
  }

  get firstElementChild() {
    return this.children[0] || null;
  }
}

export class FakeSvgDocument {
  constructor() {
    this.documentElement = new FakeSvgElement("html", this, XHTML_NS);
    this.body = new FakeSvgElement("body", this, XHTML_NS);
    this.head = new FakeSvgElement("head", this, XHTML_NS);
    this.documentElement.appendChild(this.head);
    this.documentElement.appendChild(this.body);
  }

  createElement(tagName) {
    return new FakeSvgElement(tagName, this, XHTML_NS);
  }

  createElementNS(namespaceURI, tagName) {
    return new FakeSvgElement(tagName, this, namespaceURI);
  }
}

export function createFakeSvg() {
  const document = new FakeSvgDocument();
  return new FakeSvgElement("svg", document);
}

export function findFirstElement(root, tagName) {
  return root.querySelectorAll(tagName)[0] || null;
}

export async function withFakeSvgDocument(callback) {
  const previousDocument = globalThis.document;
  const previousSVGElement = globalThis.SVGElement;
  const previousWindow = globalThis.window;
  const document = new FakeSvgDocument();

  globalThis.document = document;
  globalThis.SVGElement = FakeSvgElement;
  globalThis.window = { devicePixelRatio: 1 };

  try {
    return await callback(document);
  } finally {
    if (previousDocument === undefined) delete globalThis.document;
    else globalThis.document = previousDocument;

    if (previousSVGElement === undefined) delete globalThis.SVGElement;
    else globalThis.SVGElement = previousSVGElement;

    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  }
}
