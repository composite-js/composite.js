function assertOptionalSize(value, label) {
  if (value === undefined) return;
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new TypeError(`${label} must be a finite non-negative number.`);
  }
}

/**
 * Sizing policy for nodes whose size is derived entirely from their content.
 */
export class ContentSizedPolicy {
  validateOptions(node, options = {}) {
    if (options.width !== undefined || options.height !== undefined) {
      throw new TypeError(
        `${node.classTag} size is derived from its content; width and height cannot be specified.`,
      );
    }
  }

  validateRenderOptions(node, renderOptions = {}) {
    this.validateOptions(node, renderOptions);
  }

  resolveRenderSize(_node, _requestedSize = {}, intrinsicSize = {}) {
    return { ...intrinsicSize };
  }
}

/**
 * Sizing policy for nodes that establish a viewport for their children.
 */
export class ViewportSizedPolicy {
  validateRenderOptions(node, renderOptions = {}) {
    assertOptionalSize(renderOptions.width, `${node.classTag} render width`);
    assertOptionalSize(renderOptions.height, `${node.classTag} render height`);
  }

  resolve(node, renderOptions = {}, intrinsicSize = {}) {
    this.validateRenderOptions(node, renderOptions);

    const width =
      renderOptions.width ?? node.options?.width ?? intrinsicSize.width;
    const height =
      renderOptions.height ?? node.options?.height ?? intrinsicSize.height;

    assertOptionalSize(width, `${node.classTag} width`);
    assertOptionalSize(height, `${node.classTag} height`);

    return { width, height };
  }

  resolveRenderSize(_node, requestedSize = {}, intrinsicSize = {}) {
    return {
      width: requestedSize.width ?? intrinsicSize.width,
      height: requestedSize.height ?? intrinsicSize.height,
    };
  }
}

export const contentSizedPolicy = new ContentSizedPolicy();
export const viewportSizedPolicy = new ViewportSizedPolicy();

/**
 * Resolves the size a node will actually use inside an available viewport.
 */
export function resolveRenderSize(
  node,
  requestedSize = {},
  intrinsicSize = node.bbox.contentRect(),
) {
  if (typeof node.sizePolicy?.resolveRenderSize === "function") {
    return node.sizePolicy.resolveRenderSize(
      node,
      requestedSize,
      intrinsicSize,
    );
  }

  return {
    width: requestedSize.width ?? intrinsicSize.width,
    height: requestedSize.height ?? intrinsicSize.height,
  };
}
