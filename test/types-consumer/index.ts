import {
  assertLayoutNode,
  chart,
  custom,
  embed,
  frame,
  image,
  isLayoutNode,
  repeat,
  repeatX,
  repeatY,
  sequenceContainer,
  stackX,
  stackY,
  text,
  validateChartConfig,
  type ChartConfig,
  type CustomRenderable,
  type LayoutNode,
} from "composite-js";

// @ts-expect-error Internals are not part of the public package entry.
import { BarChartRenderer } from "composite-js";
// @ts-expect-error Internals are not part of the public package entry.
import { Chart } from "composite-js";
// @ts-expect-error Internals are not part of the public package entry.
import { LayoutEngine } from "composite-js";
// @ts-expect-error Internals are not part of the public package entry.
import { MARK_DEFINITIONS } from "composite-js";
// @ts-expect-error Internals are not part of the public package entry.
import { Node } from "composite-js";

interface Row {
  category: string;
  value: number;
  group?: string;
}

const rows: Row[] = [
  { category: "A", value: 12, group: "control" },
  { category: "B", value: 18, group: "variant" },
];

const config: ChartConfig<Row> = {
  mark: "bar",
  data: rows,
  encoding: {
    x: "category",
    y: "value",
    xDomain: ["A", "B"],
    yDomain: [0, 20],
  },
  width: 240,
  height: 160,
};

validateChartConfig(config);

const bars = chart<Row>(config);
const label = text({ text: "Totals", width: 80, height: 24 });
const flag = image({
  url: "https://kapowaz.github.io/circle-flags/flags/us.svg",
  width: 24,
  height: 24,
});

const renderable: CustomRenderable = {
  width: 80,
  height: 40,
  options: { width: 80, height: 40 },
  render(svg: SVGElement) {
    svg.setAttribute("data-custom-rendered", "true");
  },
};

const customNode = custom(renderable, { classTag: "sparkline" });
const row = stackX([label, bars, flag, customNode], { margin: [4, 12, 0] });
const framed = frame(row, { padding: 8, stroke: "#94a3b8" });
const repeatedX = repeatX(["A", "B"], (category) =>
  chart<Row>({
    ...config,
    data: rows.filter((datum) => datum.category === category),
  }),
);
const repeatedY = repeatY(["A", "B"], () => customNode);

const repeated = repeat(rows, (datum) =>
  chart<Row>({
    ...config,
    data: [datum],
  }),
);
const embedded = embed(
  sequenceContainer<Row>({
    xDomain: ["A", "B"],
    yDomain: ["control", "variant"],
    x: "category",
    y: "group",
  }),
  repeated,
  { x: "category", y: "group", key: "category", width: 48, height: 48 },
);

const view = stackY([framed, repeatedX, repeatedY, embedded], { margin: 12 });

const mount = document.createElement("div");
view.render(mount, { width: 720, height: 420 });
const exported: Promise<string | Uint8Array> = view.export({ format: "svg" });

let unknownValue: unknown = view;
if (isLayoutNode(unknownValue)) {
  const narrowed: LayoutNode = unknownValue;
  narrowed.render(mount);
}

assertLayoutNode(unknownValue);
const asserted: LayoutNode = unknownValue;
asserted.render(mount);

void exported;
void BarChartRenderer;
void Chart;
void LayoutEngine;
void MARK_DEFINITIONS;
void Node;
