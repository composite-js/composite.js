import assert from "node:assert/strict";
import {
  parseExampleName,
  resolveExamplePath,
} from "../scripts/dev-example.mjs";

{
  assert.equal(parseExampleName([]), "index");
  assert.equal(parseExampleName(["--example", "dropoutseer"]), "dropoutseer");
  assert.equal(parseExampleName(["--example=dropoutseer"]), "dropoutseer");
}

{
  const resolved = resolveExamplePath("dropoutseer", {
    cwd: process.cwd(),
  });

  assert.ok(
    resolved.endsWith("examples\\dropoutseer.js") ||
      resolved.endsWith("examples/dropoutseer.js"),
  );
}

{
  assert.throws(
    () => resolveExamplePath("does-not-exist", { cwd: process.cwd() }),
    /Example not found: does-not-exist/,
  );
}
