export class FakeSvgElement {
  constructor(tagName = "svg", ownerDocument = null) {
    this.tagName = tagName;
    this.nodeName = tagName;
    this.namespaceURI = "http://www.w3.org/2000/svg";
    this.ownerDocument = ownerDocument || new FakeSvgDocument();
    this.children = [];
    this.parentNode = null;
    this.attributes = new Map();
    this.listeners = new Map();
    this.textContent = "";
    const styleProperties = new Map();
    this.style = {
      setProperty(name, value) {
        styleProperties.set(name, String(value));
      },
      getPropertyValue(name) {
        return styleProperties.get(name) ?? "";
      },
      removeProperty(name) {
        const previousValue = styleProperties.get(name) ?? "";
        styleProperties.delete(name);
        return previousValue;
      },
    };
  }

  appendChild(child) {
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

  querySelectorAll(selector) {
    const descendants = [];
    const visit = (node) => {
      node.children.forEach((child) => {
        if (selector === "*" || selector === child.tagName) {
          descendants.push(child);
        }
        visit(child);
      });
    };
    visit(this);
    return descendants;
  }

  querySelector(selector) {
    return this.querySelectorAll(selector)[0] || null;
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }

  getAttribute(name) {
    return this.attributes.get(name) ?? null;
  }

  removeAttribute(name) {
    this.attributes.delete(name);
  }

  addEventListener(type, listener) {
    this.listeners.set(type, listener);
  }

  removeEventListener(type) {
    this.listeners.delete(type);
  }
}

export class FakeSvgDocument {
  createElementNS(_namespace, tagName) {
    return new FakeSvgElement(tagName, this);
  }
}

export function createFakeSvg() {
  const document = new FakeSvgDocument();
  return new FakeSvgElement("svg", document);
}

export function findFirstElement(root, tagName) {
  return root.querySelectorAll(tagName)[0] || null;
}
