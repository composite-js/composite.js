import assert from "node:assert/strict";
import {
  LayoutEngine,
  Node,
  frame,
  repeatX,
  stackX,
  stackY,
} from "../../src/layout.js";

function leaf() {
  const node = new Node();
  node.classTag = "leaf";
  node.element = {
    options: { width: 10, height: 10 },
    render() {},
  };
  return node;
}

{
  const child = leaf();
  assert.throws(
    () => stackX([child, child]),
    /more than once under the same parent/i,
  );
  assert.doesNotThrow(() => stackX([child]));
}

{
  const child = leaf();
  stackX([child]);
  assert.throws(() => stackY([child]), /multiple parents/i);
  assert.throws(() => frame(child), /multiple parents/i);
}

{
  const child = leaf();
  const inner = stackX([child]);
  assert.throws(() => stackY([inner, child]), /multiple parents/i);
}

{
  const repeatedChild = leaf();
  const repeated = repeatX(["a", "b"], () => repeatedChild, {
    width: 20,
    height: 10,
  });
  assert.throws(
    () => LayoutEngine.computeLayout(repeated),
    /more than once under the same parent/i,
  );
}

{
  let repeated;
  repeated = repeatX(["self"], () => repeated, {
    width: 10,
    height: 10,
  });
  assert.throws(
    () => LayoutEngine.computeLayout(repeated),
    /circular reference/i,
  );
}

{
  const root = stackX([leaf()]);
  root.children.unshift(root);
  assert.throws(() => LayoutEngine.computeLayout(root), /circular reference/i);
}

{
  const child = leaf();
  stackX([child]);
  const root = stackY([leaf()]);
  root.children[0] = child;
  assert.throws(() => LayoutEngine.computeLayout(root), /multiple parents/i);
}
