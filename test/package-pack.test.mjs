import assert from "node:assert/strict";

const chunks = [];
for await (const chunk of process.stdin) {
  chunks.push(chunk);
}

const output = Buffer.concat(chunks).toString("utf8");
const manifest = JSON.parse(output);
const paths = manifest.files.map((file) => file.path);

[
  "dist/cjs/index.cjs",
  "dist/esm/index.js",
  "dist/umd/composite.umd.cjs",
  "index.d.ts",
  "LICENSE",
  "package.json",
  "README.md",
].forEach((path) => {
  assert.ok(paths.includes(path), `package should include ${path}`);
});

assert.ok(
  !paths.includes("dist/export/index.js"),
  "package should not include the removed Node export bundle",
);

["src/", "test/", "site/"].forEach((prefix) => {
  assert.ok(
    paths.every((path) => !path.startsWith(prefix)),
    `package should not include ${prefix}`,
  );
});
