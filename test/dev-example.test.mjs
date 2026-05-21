import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import {
  parseExampleName,
  resolveExamplePath,
} from "../scripts/dev-example.mjs";

{
  assert.equal(parseExampleName([]), "upset");
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

{
  const examplesDir = path.resolve(process.cwd(), "examples");
  const exampleFiles = readdirSync(examplesDir).filter((file) =>
    file.endsWith(".js"),
  );

  exampleFiles.forEach((file) => {
    const source = readFileSync(path.join(examplesDir, file), "utf8");
    assert.ok(
      !source.includes("../src/layout.js"),
      `${file} should import public APIs from ../src/index.js`,
    );
  });
}
