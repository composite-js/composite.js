/**
 * A class representing a bounding box with content box and margins.
 */
export class BBox {
  constructor(x, y, width, height) {
    this.content = {
      x: x,
      y: y,
      width: width,
      height: height,
    };
    this.margin = {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    };
  }

  /**
   * Sets the margin for the bounding box.
   * @param {{top: number, right: number, bottom: number, left: number}} margin
   */
  setMargin(margin) {
    this.margin = {
      top: margin.top || 0,
      right: margin.right || 0,
      bottom: margin.bottom || 0,
      left: margin.left || 0,
    };
  }

  /**
   * Translates the content box by (dx, dy).
   * @param {number} dx - translation in x direction
   * @param {number} dy - translation in y direction
   */
  translateBy(dx, dy) {
    this.content.x += dx;
    this.content.y += dy;
  }

  /**
   * Translates the content box to (x, y).
   * @param {number} x - new x position
   * @param {number} y - new y position
   */
  translateTo(x, y) {
    this.content.x = x;
    this.content.y = y;
  }

  /**
   * Sets the width and height of the content box.
   * @param {number} width
   * @param {number} height
   */
  setSize(width, height) {
    if (width > 0) this.content.width = width;
    if (height > 0) this.content.height = height;
  }

  /**
   * Gets the content rectangle.
   * @returns {{x: number, y: number, width: number, height: number}}
   */
  contentRect() {
    return this.content;
  }

  /**
   * Computes the outer rectangle (including margins).
   * @returns {{x: number, y: number, width: number, height: number}}
   */
  outerRect() {
    const c = this.content;
    const m = this.margin;
    return {
      x: c.x - (m.left || 0),
      y: c.y - (m.top || 0),
      width: c.width + (m.left || 0) + (m.right || 0),
      height: c.height + (m.top || 0) + (m.bottom || 0),
    };
  }

  /**
   * Gets the margin of the bbox.
   */
  getMargin() {
    return this.margin;
  }

  /**
   * Computes the union of this BBox with another BBox.
   * @param {BBox} other - another BBox
   * @returns {BBox}
   */
  union(other) {
    if (!other || !other.content || !other.margin) {
      throw new TypeError("union(other): other must be a BBox object");
    }

    const aC = this.content;
    const bC = other.content;

    const unionRect = (r1, r2) => {
      const x1 = Math.min(r1.x, r2.x);
      const y1 = Math.min(r1.y, r2.y);
      const x2 = Math.max(r1.x + r1.width, r2.x + r2.width);
      const y2 = Math.max(r1.y + r1.height, r2.y + r2.height);
      return { x: x1, y: y1, width: x2 - x1, height: y2 - y1 };
    };

    const contentU = unionRect(aC, bC);
    const outerU = unionRect(this.outerRect(), other.outerRect());

    const result = new BBox(
      contentU.x,
      contentU.y,
      contentU.width,
      contentU.height,
    );
    result.margin = {
      left: Math.max(0, contentU.x - outerU.x),
      top: Math.max(0, contentU.y - outerU.y),
      right: Math.max(
        0,
        outerU.x + outerU.width - (contentU.x + contentU.width),
      ),
      bottom: Math.max(
        0,
        outerU.y + outerU.height - (contentU.y + contentU.height),
      ),
    };

    return result;
  }

  /**
   * Gets the total width including margins.
   * @returns {number}
   */
  totalWidth() {
    return (
      this.content.width + (this.margin.left || 0) + (this.margin.right || 0)
    );
  }

  /**
   * Gets the total height including margins.
   * @returns {number}
   */
  totalHeight() {
    return (
      this.content.height + (this.margin.top || 0) + (this.margin.bottom || 0)
    );
  }
}
