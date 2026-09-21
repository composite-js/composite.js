import {
  assertLayoutNode,
  chart,
  crossJoin,
  customContainer,
  custom,
  embed,
  wrapper,
  gridContainer,
  image,
  isLayoutNode,
  loadCsvText,
  numericColumns,
  parseCsv,
  repeat,
  repeatX,
  repeatY,
  sequenceContainer,
  stackX,
  stackY,
  tableColumns,
  text,
  validateChartConfig,
  type ChartConfig,
  type CircleStyleContext,
  type Container,
  type CustomRenderable,
  type LayoutNode,
  type MarkStyle,
  type RectStyleContext,
  type SectorStyleContext,
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

const parsedRows = parseCsv<Row>("category,value,group\nA,12,control\n", {
  autoType: true,
});
const loadedCsvText: Promise<string> = loadCsvText(
  new URL("file:///tmp/composite-js-types.csv"),
);
const headerlessRows = parseCsv<Row>("B,18,variant\n", {
  columns: ["category", "value", "group"],
});
const parsedColumns: string[] = tableColumns(parsedRows);
const parsedNumericColumns: string[] = numericColumns(parsedRows, {
  exclude: ["category"],
});
const pairs: Array<{ category: string; metric: string }> = crossJoin(
  rows,
  parsedNumericColumns,
  (rowDatum, metric) => ({ category: rowDatum.category, metric }),
);

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

const customMarkStyle: MarkStyle<Row> = {
  type: "rounded",
  options: {},
  rect(context: RectStyleContext<Row>) {
    const datum: Row = context.datum;
    const value: unknown = context.value;
    void datum;
    void value;
    return context.container
      .append("rect")
      .attr("x", context.left)
      .attr("y", context.top)
      .attr("width", context.width)
      .attr("height", context.height);
  },
  circle(context: CircleStyleContext<Row>) {
    return context.container
      .append("circle")
      .attr("cx", context.centerX)
      .attr("cy", context.centerY)
      .attr("r", context.radius);
  },
  sector(context: SectorStyleContext<Row>) {
    const category: unknown = context.category;
    void category;
    return context.container.append("path").attr("d", "M0,0");
  },
};

const styledConfig: ChartConfig<Row> = {
  ...config,
  markStyle: customMarkStyle,
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
const linkedRow = stackX([bars, bars], { link: true });
const linkedColumn = stackY([bars, bars], { link: true });
const wrapped = wrapper(row, { padding: 8, stroke: "#94a3b8" });
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

const grid = gridContainer<Row>({
  rowDomain: ["control", "variant"],
  columnDomain: ["A", "B"],
  row: "group",
  column: "category",
  cellSizing: "fill",
});

const customGrid: Container<Row> = customContainer<Row>({
  width: 120,
  height: 80,
  slots(data, mapping) {
    return data.map((datum, index) => ({
      datum,
      key:
        mapping.key !== undefined && typeof mapping.key === "function"
          ? mapping.key(datum, index)
          : index,
      x: index * 20,
      y: 20,
    }));
  },
});

const embeddedGrid = embed(grid, repeated, {
  row: "group",
  column: "category",
  key: "category",
});
const embeddedCustom = embed(customGrid, repeated, { key: "category" });

const view = stackY(
  [wrapped, repeatedX, repeatedY, embedded, embeddedGrid, embeddedCustom],
  { margin: 12 },
);

const mount = document.createElement("div");
// @ts-expect-error Stack sizes are derived from their children.
view.render(mount, { width: 720, height: 420 });
// @ts-expect-error Wrapper sizes are derived from their child.
wrapped.render(mount, { width: 720 });
repeatedX.render(mount, { width: 720, height: 420 });
embedded.render(mount, { width: 720, height: 420 });
bars.render(mount, { width: 720, height: 420, margin: { left: 20 } });

let unknownValue: unknown = view;
if (isLayoutNode(unknownValue)) {
  const narrowed: LayoutNode = unknownValue;
  narrowed.render(mount);
}

assertLayoutNode(unknownValue);
const asserted: LayoutNode = unknownValue;
asserted.render(mount);

void loadedCsvText;
void headerlessRows;
void parsedColumns;
void pairs;
void styledConfig;
void BarChartRenderer;
void Chart;
void LayoutEngine;
void MARK_DEFINITIONS;
void Node;
