export type Primitive = string | number | boolean | null | undefined;
export type Datum = Record<string, unknown>;
export type Accessor<T = unknown> =
  | string
  | ((datum: T, index: number) => unknown);

export interface Margin {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Encoding {
  x?: string;
  y?: string;
  group?: string;
  size?: string;
  xDomain?: string;
  yDomain?: string;
  groupDomain?: string;
  [channel: string]: string | undefined;
}

export interface ChartConfig<T extends Datum = Datum> {
  mark?: string;
  data?: T[];
  encoding: Encoding;
  width?: number;
  height?: number;
  margin?: Margin;
  padding?:
    | number
    | {
        inner?: number;
        outer?: number;
        xInner?: number;
        xOuter?: number;
        yInner?: number;
        yOuter?: number;
        [key: string]: unknown;
      };
  direction?: "vertical" | "horizontal" | string;
  color?: string;
  colors?: string[];
  colorScheme?: string[];
  colorBy?: "x" | "group" | string;
  showXAxis?: boolean;
  showYAxis?: boolean;
  xAxisName?: string;
  yAxisName?: string;
  xAxisPos?: "top" | "bottom" | string;
  yAxisPos?: "left" | "right" | string;
  [option: string]: unknown;
}

export interface RenderOptions {
  width?: number;
  height?: number;
  margin?: Margin;
  debugBBox?: boolean;
  [option: string]: unknown;
}

export interface ExportOptions extends RenderOptions {
  format?: "svg" | "png" | string;
  path?: string;
}

export interface TextOptions {
  text?: string;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  fill?: string;
  fontFamily?: string;
  fontSize?: number | string;
  fontWeight?: number | string;
  fontStyle?: string;
  textAnchor?: string;
  dominantBaseline?: string;
  opacity?: number;
  className?: string;
  id?: string;
  rotate?: number;
  title?: string;
  [option: string]: unknown;
}

export interface FrameOptions {
  padding?: number | Margin;
  stroke?: string;
  fill?: string;
  strokeWidth?: number;
  strokeDasharray?: string;
  margin?: Margin;
  [option: string]: unknown;
}

export interface RepeatOptions {
  width?: number;
  height?: number;
  paddingInner?: number;
  paddingOuter?: number;
  margin?: Margin;
  [option: string]: unknown;
}

export interface EmbedMapping<T = unknown> {
  x?: Accessor<T>;
  y?: Accessor<T>;
  key?: Accessor<T>;
  width?: number;
  height?: number;
  [option: string]: unknown;
}

export interface SequenceContainerOptions<T = unknown> {
  width?: number;
  height?: number;
  margin?: Margin;
  xDomain?: Primitive[];
  yDomain?: Primitive[];
  tracks?: T[];
  missing?: T[];
  events?: T[];
  x?: string;
  y?: string;
  trackColor?: string;
  missingColor?: string;
  eventColor?: string;
  [option: string]: unknown;
}

export class BBox {
  constructor(x: number, y: number, width: number, height: number);
  content: Required<Rect>;
  margin: Required<Margin>;
  setMargin(margin: Margin): void;
  translateBy(dx: number, dy: number): void;
  translateTo(x: number, y: number): void;
  setSize(width: number, height: number): void;
  contentRect(): Rect;
  outerRect(): Rect;
  getMargin(): Required<Margin>;
  union(other: BBox): BBox;
  totalWidth(): number;
  totalHeight(): number;
}

export class Node {
  bbox: BBox;
  element?: unknown;
  classTag?: string;
  static isComposition(node: unknown): boolean;
  static isRepeat(node: unknown): boolean;
  static isStack(node: unknown): boolean;
  render(
    container: HTMLElement | SVGElement,
    renderOptions?: RenderOptions,
  ): void;
  export(options?: ExportOptions): Promise<string | Uint8Array>;
}

export function assertLayoutNode(value: unknown, label?: string): void;
export function isLayoutNode(value: unknown): value is Node;

export class Chart<T extends Datum = Datum> {
  constructor(options?: ChartConfig<T>);
  data: T[];
  mark: string;
  encoding: Encoding;
  width: number;
  height: number;
  margin: Required<Margin>;
  options: ChartConfig<T>;
  validate(): void;
  getTotalWidth(): number;
  getTotalHeight(): number;
  render(
    container: HTMLElement | SVGElement,
    renderOptions?: RenderOptions,
  ): void;
}

export class Composition extends Node {
  children: Node[];
  updateBBox(): void;
}

export class Stack extends Composition {
  constructor(
    nodes: Node[],
    direction: string,
    options?: { margin?: number; align?: Array<Node | null | undefined> },
  );
  direction: string;
  margin: number;
  align: Array<Node | null | undefined>;
  alignedNodes: Array<Node | null | undefined>;
  flatten(): Node[];
}

export class Repeat<T = unknown> extends Composition {
  constructor(
    domain: T[],
    func: (value: T, index: number) => Node,
    options?: RepeatOptions,
  );
  domain: T[];
  func: (value: T, index: number) => Node;
  options: RepeatOptions;
}

export class RepeatX<T = unknown> extends Repeat<T> {}
export class RepeatY<T = unknown> extends Repeat<T> {}

export class DirectionlessRepeat<T = unknown> {
  constructor(
    domain: T[],
    func: (value: T, index: number) => Node,
    options?: RepeatOptions,
  );
  domain: T[];
  func: (value: T, index: number) => Node;
  options: RepeatOptions;
  type: "repeat";
}

export class Embedded<T = unknown> extends Node {
  constructor(
    container: SequenceContainer<T>,
    repeated: DirectionlessRepeat<T>,
    mapping?: EmbedMapping<T>,
  );
  container: SequenceContainer<T>;
  repeated: DirectionlessRepeat<T>;
  mapping: EmbedMapping<T>;
  embeddedChildren: Node[];
  instantiateChildren(): Node[];
}

export class Frame extends Node {
  constructor(child: Node, options?: FrameOptions);
  child: Node;
  updateBBoxFromChild(): void;
}

export class SequenceContainer<T = unknown> {
  constructor(options?: SequenceContainerOptions<T>);
  width: number;
  height: number;
  margin: Margin;
  slots(
    data: T[],
    mapping?: EmbedMapping<T>,
    size?: { width?: number; height?: number },
  ): Array<{
    datum: T;
    key: unknown;
    x: number;
    y: number;
    width?: number;
    height?: number;
  }>;
  render(svg: SVGElement, renderOptions?: RenderOptions): void;
}

export function chart<T extends Datum = Datum>(config: ChartConfig<T>): Node;
export function text(config?: TextOptions): Node;
export function image(config?: unknown): never;
export function frame(node: Node, options?: FrameOptions): Frame;
export function stackX(
  nodes: Node[],
  options?: { margin?: number; align?: Array<Node | null | undefined> },
): Stack;
export function stackY(
  nodes: Node[],
  options?: { margin?: number; align?: Array<Node | null | undefined> },
): Stack;
export function repeatX<T = unknown>(
  domain: T[],
  func: (value: T, index: number) => Node,
  options?: RepeatOptions,
): RepeatX<T>;
export function repeatY<T = unknown>(
  domain: T[],
  func: (value: T, index: number) => Node,
  options?: RepeatOptions,
): RepeatY<T>;
export function repeat<T = unknown>(
  domain: T[],
  func: (value: T, index: number) => Node,
  options?: RepeatOptions,
): DirectionlessRepeat<T>;
export function embed<T = unknown>(
  container: SequenceContainer<T>,
  repeated: DirectionlessRepeat<T>,
  mapping?: EmbedMapping<T>,
): Embedded<T>;
export function sequenceContainer<T = unknown>(
  options?: SequenceContainerOptions<T>,
): SequenceContainer<T>;

export class LayoutCalculator {
  static getMeasurementAdapter(): unknown;
  static setMeasurementAdapter(adapter: {
    measureMargin(
      element: unknown,
      size: { width: number; height: number },
    ): Margin;
  }): void;
  static estimateMargin(element: unknown): Margin;
  static suggestWidthHeight(node: unknown): { width: number; height: number };
}

export class LayoutEngine {
  static computeLayout(node: Node): void;
  static layout(
    root: Node,
    container: HTMLElement | SVGElement,
    options?: RenderOptions,
  ): SVGElement;
}

export class LayoutRenderer {
  static render(
    root: Node,
    container: HTMLElement | SVGElement,
    options?: RenderOptions,
  ): SVGElement;
}

export function renderComputedLayout(
  root: Node,
  container: HTMLElement | SVGElement,
  options?: RenderOptions,
): SVGElement;

export interface AxisOptions {
  showXAxis?: boolean;
  showYAxis?: boolean;
  xAxisName?: string;
  yAxisName?: string;
  xAxisPos?: string;
  yAxisPos?: string;
}

export class AxisRenderer {
  constructor(options?: AxisOptions);
  render(
    svg: SVGElement,
    scales: Record<string, unknown>,
    dimensions: Record<string, unknown>,
  ): void;
}

export class MarkRenderer {
  constructor(options?: ChartConfig);
  validate(data?: Datum[]): void;
  getAxisOptions(): AxisOptions;
  axisConfig(
    scales: Record<string, unknown>,
    dimensions: Record<string, unknown>,
  ): Record<string, unknown>;
  render(svg: SVGElement, data: Datum[]): unknown;
}

export class BarChartRenderer extends MarkRenderer {}
export class GroupBarChartRenderer extends MarkRenderer {}
export class StackBarChartRenderer extends MarkRenderer {}
export class AreaChartRenderer extends MarkRenderer {}
export class BoxPlotRenderer extends MarkRenderer {}
export class BubbleChartRenderer extends MarkRenderer {}
export class DumbbellChartRenderer extends MarkRenderer {}
export class FlowDiagramRenderer extends MarkRenderer {}
export class LineChartRenderer extends MarkRenderer {}
export class MatrixChartRenderer extends MarkRenderer {}
export class ProportionalAreaChartRenderer extends MarkRenderer {}
export class PieChartRenderer extends MarkRenderer {}
export class ScatterChartRenderer extends MarkRenderer {}
export class StreamGraphRenderer extends MarkRenderer {}

export const MARK_DEFINITIONS: Record<
  string,
  {
    requiredEncoding: string[];
    optionalEncoding?: string[];
  }
>;

export function validateChartConfig(config?: ChartConfig): void;
