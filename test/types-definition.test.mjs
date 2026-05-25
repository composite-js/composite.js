import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const declarations = readFileSync(
  path.join(process.cwd(), "index.d.ts"),
  "utf8",
);

["xDomain", "yDomain", "groupDomain"].forEach((field) => {
  assert.doesNotMatch(
    declarations,
    new RegExp(`${field}\\?:\\s*string;`),
    `Encoding.${field} should describe configured domain values, not a data field name`,
  );
  assert.match(
    declarations,
    new RegExp(
      `${field}\\?:[^;]*(Primitive\\[\\]|Array<Primitive>|ReadonlyArray<Primitive>)`,
    ),
    `Encoding.${field} should accept an array of domain values`,
  );
});

assert.match(
  declarations,
  /\[channel: string\]:[^;]*(Primitive\[\]|Array<Primitive>|ReadonlyArray<Primitive>|unknown)/,
  "Encoding index signature should allow domain arrays and future non-string channel options",
);

assert.match(
  declarations,
  /export interface ImageOptions/,
  "Declarations should include ImageOptions for image()",
);

assert.match(
  declarations,
  /export function image\(config: ImageOptions\): Node;/,
  "image() should return a layout Node in type declarations",
);

assert.doesNotMatch(
  declarations,
  /export function image\(config\?: unknown\): never;/,
  "image() should no longer be declared as an unimplemented API",
);
