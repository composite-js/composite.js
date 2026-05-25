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
  /export interface LayoutNode/,
  "Declarations should include a public LayoutNode interface",
);

assert.match(
  declarations,
  /export interface CustomRenderable/,
  "Declarations should include CustomRenderable for custom()",
);

assert.match(
  declarations,
  /export interface CustomOptions/,
  "Declarations should include CustomOptions for custom()",
);

assert.match(
  declarations,
  /shareDomains\?: boolean;/,
  "RepeatOptions should expose shareDomains",
);

assert.match(
  declarations,
  /export function image\(config: ImageOptions\): LayoutNode;/,
  "image() should return a layout Node in type declarations",
);

assert.match(
  declarations,
  /export function custom\(\s*renderable: CustomRenderable,\s*options\?: CustomOptions,\s*\): LayoutNode;/,
  "custom() should wrap a custom renderable and return a LayoutNode",
);

assert.match(
  declarations,
  /export function isLayoutNode\(value: unknown\): value is LayoutNode;/,
  "isLayoutNode() should narrow unknown values to LayoutNode",
);

assert.match(
  declarations,
  /export function assertLayoutNode\(\s*value: unknown,\s*label\?: string,\s*\): asserts value is LayoutNode;/,
  "assertLayoutNode() should assert unknown values are LayoutNode",
);

assert.doesNotMatch(
  declarations,
  /export function image\(config\?: unknown\): never;/,
  "image() should no longer be declared as an unimplemented API",
);

[
  "Chart",
  "Node",
  "LayoutEngine",
  "LayoutRenderer",
  "LayoutCalculator",
  "BarChartRenderer",
  "MARK_DEFINITIONS",
].forEach((name) => {
  assert.doesNotMatch(
    declarations,
    new RegExp(`export (?:class|const) ${name}\\b`),
    `Declarations should not export internal ${name}`,
  );
});
