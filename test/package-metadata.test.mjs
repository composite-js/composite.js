import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const packageJson = JSON.parse(
  readFileSync(path.join(process.cwd(), "package.json"), "utf8"),
);

assert.equal(packageJson.name, "composite-js");
assert.equal(
  packageJson.description,
  "A JavaScript grammar for building composite visualizations in the browser.",
);
assert.deepEqual(packageJson.keywords, [
  "visualization",
  "grammar",
  "charts",
  "d3",
  "composition",
]);
assert.deepEqual(packageJson.repository, {
  type: "git",
  url: "git+https://github.com/shenzhiy21/composite.js.git",
});
assert.deepEqual(packageJson.bugs, {
  url: "https://github.com/shenzhiy21/composite.js/issues",
});
assert.equal(
  packageJson.homepage,
  "https://github.com/shenzhiy21/composite.js#readme",
);
assert.deepEqual(packageJson.exports, {
  ".": {
    types: "./index.d.ts",
    import: "./dist/esm/index.js",
    require: "./dist/cjs/index.cjs",
  },
  "./umd": "./dist/umd/composite.umd.cjs",
});
assert.equal(packageJson.types, "./index.d.ts");
assert.deepEqual(packageJson.files, ["dist", "index.d.ts"]);
assert.equal(packageJson.devDependencies?.sharp, undefined);
assert.equal(packageJson.optionalDependencies?.sharp, "^0.34.5");
