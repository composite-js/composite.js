let renderSequence = 0;

/** DOM identities belong to a render, never to a reusable declaration/result. */
export function createRenderContext() {
  const namespace = ++renderSequence;
  let sequence = 0;
  return {
    nextId(prefix = "element") {
      return `composite-${namespace}-${prefix}-${++sequence}`;
    },
  };
}
