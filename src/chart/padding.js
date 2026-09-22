/**
 * Normalizes chart padding shorthands into axis-specific band padding values.
 * @param {number|Object|undefined} padding - Chart padding configuration.
 * @param {number|undefined} defaultValue - Fallback for unspecified values.
 * @returns {Object} Normalized padding configuration.
 */
export function normalizePadding(padding, defaultValue) {
  const source =
    typeof padding === "number"
      ? { inner: padding, outer: padding }
      : padding && typeof padding === "object" && !Array.isArray(padding)
        ? padding
        : {};

  const inner = source.inner ?? defaultValue;
  const outer = source.outer ?? defaultValue;

  return {
    ...source,
    xInner: source.xInner ?? inner,
    xOuter: source.xOuter ?? outer,
    yInner: source.yInner ?? inner,
    yOuter: source.yOuter ?? outer,
  };
}
