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

assert.doesNotMatch(
  declarations,
  /export interface ExportOptions/,
  "Declarations should not expose removed export options",
);

assert.doesNotMatch(
  declarations,
  /\bexport\(options\?:/,
  "LayoutNode declarations should not expose the removed export() API",
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
  /export interface RectStyleContext/,
  "Declarations should include RectStyleContext for markStyle rect renderers",
);

assert.match(
  declarations,
  /export interface CircleStyleContext/,
  "Declarations should include CircleStyleContext for markStyle circle renderers",
);

assert.match(
  declarations,
  /export interface SectorStyleContext/,
  "Declarations should include SectorStyleContext for markStyle sector renderers",
);

assert.match(
  declarations,
  /export type MarkStyle/,
  "Declarations should include MarkStyle for chart configs",
);

assert.match(
  declarations,
  /markStyle\?: MarkStyle/,
  "ChartConfig should expose markStyle",
);

assert.match(
  declarations,
  /export type Table<[^>]+>\s*=\s*[^;]+columns\?: string\[\]/,
  "Declarations should include a Table type with optional columns metadata",
);

assert.match(
  declarations,
  /export interface ParseCsvOptions/,
  "Declarations should include ParseCsvOptions",
);

assert.match(
  declarations,
  /export interface NumericColumnsOptions/,
  "Declarations should include NumericColumnsOptions",
);

assert.match(
  declarations,
  /shareDomains\?: boolean;/,
  "RepeatOptions should expose shareDomains",
);

assert.match(
  declarations,
  /export function image\(config: ImageOptions\): LeafLayoutNode;/,
  "image() should return a layout Node in type declarations",
);

assert.match(
  declarations,
  /export function custom\(\s*renderable: CustomRenderable,\s*options\?: CustomOptions,\s*\): LeafLayoutNode;/,
  "custom() should wrap a custom renderable and return a LayoutNode",
);

assert.match(
  declarations,
  /export interface ViewportLayoutNode/,
  "Declarations should distinguish viewport-sized layout nodes",
);

assert.match(
  declarations,
  /export function wrapper\(\s*node: LayoutNode,\s*options\?: WrapperOptions,?\s*\): LayoutNode;/,
  "wrapper() should return a content-sized LayoutNode",
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

assert.match(
  declarations,
  /export function parseCsv<[^>]+>\(\s*csvText: string,\s*options\?: ParseCsvOptions,\s*\): Table<[^>]+>;/,
  "parseCsv() should parse CSV text into a typed table",
);

assert.match(
  declarations,
  /export function loadCsvText\(\s*url: string \| URL,?\s*\): Promise<string>;/,
  "loadCsvText() should load CSV text from a string or URL",
);

assert.match(
  declarations,
  /export function tableColumns<[^>]+>\(\s*rows: ReadonlyArray<[^>]+>[^)]*\): string\[\];/,
  "tableColumns() should return column names",
);

assert.match(
  declarations,
  /export function numericColumns<[^>]+>\(\s*rows: ReadonlyArray<[^>]+>[^)]*options\?: NumericColumnsOptions,\s*\): string\[\];/,
  "numericColumns() should infer numeric columns",
);

assert.match(
  declarations,
  /export function crossJoin<[^>]+>\(\s*left: ReadonlyArray<[^>]+>[^)]*right: ReadonlyArray<[^>]+>/,
  "crossJoin() should expose a typed cartesian product helper",
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
  "CHART_TYPE_DEFINITIONS",
].forEach((name) => {
  assert.doesNotMatch(
    declarations,
    new RegExp(`export (?:class|const) ${name}\\b`),
    `Declarations should not export internal ${name}`,
  );
});
