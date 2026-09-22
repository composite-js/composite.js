export type Primitive = string | number | boolean | null | undefined;
export type Datum = object;
export type Table<T extends Datum = Datum> = T[] & {
  columns?: string[];
};
export type Accessor<T = unknown> =
  | string
  | ((datum: T, index: number) => unknown);

export interface ParseCsvOptions {
  columns?: string[];
  autoType?: boolean;
}

export interface NumericColumnsOptions {
  columns?: string[];
  exclude?: string[];
}

export interface Margin {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

export interface Encoding {
  x?: string;
  y?: string;
  group?: string;
  size?: string;
  xDomain?: Primitive[];
  yDomain?: Primitive[];
  groupDomain?: Primitive[];
  [channel: string]: string | Primitive[] | undefined;
}

export interface StyleSelection {
  append(name: string): StyleSelection;
  attr(name: string, value?: unknown): StyleSelection;
  style(name: string, value?: unknown): StyleSelection;
  text(value?: unknown): StyleSelection;
  on(type: string, listener: (...args: unknown[]) => void): StyleSelection;
  node(): unknown;
}

export interface BaseStyleContext<T extends Datum = Datum> {
  container: StyleSelection;
  value?: unknown;
  datum: T;
  index: number;
  orientation: string;
  role: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number | string;
  opacity?: number;
  mark: string;
  encoding: Encoding;
  styleOptions: object;
}

export interface RectStyleContext<
  T extends Datum = Datum,
> extends BaseStyleContext<T> {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface CircleStyleContext<
  T extends Datum = Datum,
> extends BaseStyleContext<T> {
  centerX: number;
  centerY: number;
  radius: number;
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface SectorStyleContext<
  T extends Datum = Datum,
> extends BaseStyleContext<T> {
  arcDatum: unknown;
  startAngle: number;
  endAngle: number;
  innerRadius: number;
  outerRadius: number;
  category?: unknown;
}

export type BuiltinMarkStyle = "default" | "rounded" | "sketch";

export type MarkStyle<T extends Datum = Datum> =
  | BuiltinMarkStyle
  | {
      type?: BuiltinMarkStyle;
      options?: object;
      rect?: (context: RectStyleContext<T>) => StyleSelection;
      circle?: (context: CircleStyleContext<T>) => StyleSelection;
      sector?: (context: SectorStyleContext<T>) => StyleSelection;
    };

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
  /**
   * Layout direction for marks that explicitly support rotation, such as flow
   * and stream. Axis-oriented marks infer orientation from encoding.x/y.
   */
  direction?: "vertical" | "horizontal" | string;
  color?: string;
  colors?: string[];
  colorScheme?: string[];
  colorBy?: "x" | "group" | string;
  markStyle?: MarkStyle<T>;
  showXAxis?: boolean;
  showYAxis?: boolean;
  xAxisName?: string;
  yAxisName?: string;
  xAxisPos?: "top" | "bottom" | string;
  yAxisPos?: "left" | "right" | string;
  [option: string]: unknown;
}

export interface BaseRenderOptions {
  debugBBox?: boolean;
}

export interface ViewportRenderOptions extends BaseRenderOptions {
  width?: number;
  height?: number;
}

export interface LeafRenderOptions extends ViewportRenderOptions {
  margin?: Margin;
}

export type RenderOptions = LeafRenderOptions;

export interface LayoutNode {
  readonly classTag?: string;
  render(
    container: HTMLElement | SVGElement,
    renderOptions?: BaseRenderOptions,
  ): void;
}

export interface LeafLayoutNode extends LayoutNode {
  render(
    container: HTMLElement | SVGElement,
    renderOptions?: LeafRenderOptions,
  ): void;
}

export interface ViewportLayoutNode extends LayoutNode {
  render(
    container: HTMLElement | SVGElement,
    renderOptions?: ViewportRenderOptions,
  ): void;
}

/** A read-only result for one occurrence of a reusable declaration. */
export interface LayoutRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface ComputedBBox {
  contentRect(): LayoutRect;
  outerRect(): LayoutRect;
  getMargin(): Readonly<Required<Margin>>;
  totalWidth(): number;
  totalHeight(): number;
}

export interface ComputedLayout {
  readonly occurrenceId: string;
  readonly spec: LayoutNode;
  readonly classTag?: string;
  readonly bbox: ComputedBBox;
  readonly viewport: Readonly<ViewportRenderOptions> | null;
  readonly children: ReadonlyArray<ComputedLayout>;
}

export interface MeasurementAdapter {
  measureMargin(
    element: CustomRenderable,
    size: { width: number; height: number },
    context: { document?: Document },
  ): Required<Margin>;
}

export interface ComputeLayoutOptions extends LeafRenderOptions {
  document?: Document;
  measurementAdapter?: MeasurementAdapter;
}

/** Names one use of a node; it preserves the node's sizing capabilities. */
export function anchor<T extends LayoutNode>(name: string, node: T): T;
export function computeLayout(
  spec: LayoutNode,
  options?: ComputeLayoutOptions,
): ComputedLayout;
export function renderComputedLayout(
  layout: ComputedLayout,
  container: HTMLElement | SVGElement,
  options?: BaseRenderOptions,
): SVGElement;

export interface CustomRenderable {
  width?: number;
  height?: number;
  options?: {
    width?: number;
    height?: number;
    margin?: Margin;
    [option: string]: unknown;
  };
  render(
    container: HTMLElement | SVGElement,
    renderOptions?: LeafRenderOptions,
  ): void;
}

export interface CustomOptions {
  classTag?: string;
  [option: string]: unknown;
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

export interface ImageOptions {
  url?: string;
  src?: string;
  href?: string;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  fit?: "contain" | "cover" | "crop" | "fill" | "stretch" | "none" | string;
  align?: string;
  preserveAspectRatio?: string;
  clip?: "circle" | "rounded" | "rect" | string;
  shape?: "circle" | string;
  clipPathId?: string;
  cornerRadius?: number;
  borderRadius?: number;
  stroke?: string;
  strokeWidth?: number;
  fill?: string;
  opacity?: number;
  className?: string;
  id?: string;
  title?: string;
  rotate?: number;
  transform?: string;
  crossOrigin?: string;
  [option: string]: unknown;
}

export interface WrapperOptions {
  padding?: number | Margin;
  stroke?: string;
  fill?: string;
  strokeWidth?: number;
  strokeDasharray?: string;
  margin?: Margin;
}

export interface StackOptions {
  margin?: number | ReadonlyArray<number>;
  align?: Array<LayoutNode | string | null | undefined>;
  link?: boolean;
}

export interface RepeatOptions {
  width?: number;
  height?: number;
  paddingInner?: number;
  paddingOuter?: number;
  shareDomains?: boolean;
  margin?: Margin;
  [option: string]: unknown;
}

export interface EmbedMapping<T = unknown> {
  x?: Accessor<T>;
  y?: Accessor<T>;
  row?: Accessor<T>;
  column?: Accessor<T>;
  key?: Accessor<T>;
  width?: number;
  height?: number;
  [option: string]: unknown;
}

export interface ContainerSize {
  width?: number;
  height?: number;
}

export interface ContainerRenderOptions extends ContainerSize {
  margin?: Margin;
  [option: string]: unknown;
}

export interface ContainerSlot<T = unknown> {
  datum: T;
  key: unknown;
  x: number;
  y: number;
  width?: number;
  height?: number;
  [option: string]: unknown;
}

export interface Container<T = unknown> {
  width: number;
  height: number;
  margin: Margin;
  slots(
    data: T[],
    mapping?: EmbedMapping<T>,
    size?: ContainerSize,
  ): ContainerSlot<T>[];
  render?(svg: SVGElement, options?: ContainerRenderOptions): void;
}

export interface CustomContainerOptions<T = unknown> {
  width?: number;
  height?: number;
  margin?: Margin;
  slots(
    data: T[],
    mapping: EmbedMapping<T>,
    size: ContainerSize,
  ): ContainerSlot<T>[];
  render?(svg: SVGElement, options: ContainerRenderOptions): void;
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

export interface SequenceContainer<T = unknown> extends Container<T> {}

export const SequenceContainer: {
  new <T = unknown>(
    options?: SequenceContainerOptions<T>,
  ): SequenceContainer<T>;
};

export interface GridContainerOptions<T = unknown> {
  width?: number;
  height?: number;
  margin?: Margin;
  rowDomain: Primitive[];
  columnDomain: Primitive[];
  row?: string;
  column?: string;
  paddingInner?: number;
  paddingOuter?: number;
  cellSizing?: "fill" | "intrinsic";
  showGrid?: boolean;
  stroke?: string;
  fill?: string;
  [option: string]: unknown;
}

export interface GridContainer<T = unknown> extends Container<T> {}

export const GridContainer: {
  new <T = unknown>(options: GridContainerOptions<T>): GridContainer<T>;
};

interface DirectionlessRepeat<T = unknown> {
  readonly type: "repeat";
}

export function assertLayoutNode(
  value: unknown,
  label?: string,
): asserts value is LayoutNode;
export function isLayoutNode(value: unknown): value is LayoutNode;

export function chart<T extends Datum = Datum>(
  config: ChartConfig<T>,
): LeafLayoutNode;
export function custom(
  renderable: CustomRenderable,
  options?: CustomOptions,
): LeafLayoutNode;
/** Use a fresh instance for each measurement and each render. */
export function custom(
  createRenderable: () => CustomRenderable,
  options?: CustomOptions,
): LeafLayoutNode;
export function text(config?: TextOptions): LeafLayoutNode;
export function image(config: ImageOptions): LeafLayoutNode;
export function wrapper(node: LayoutNode, options?: WrapperOptions): LayoutNode;
export function stackX(nodes: LayoutNode[], options?: StackOptions): LayoutNode;
export function stackY(nodes: LayoutNode[], options?: StackOptions): LayoutNode;
export function repeatX<T = unknown>(
  domain: T[],
  func: (value: T, index: number) => LayoutNode,
  options?: RepeatOptions,
): ViewportLayoutNode;
export function repeatY<T = unknown>(
  domain: T[],
  func: (value: T, index: number) => LayoutNode,
  options?: RepeatOptions,
): ViewportLayoutNode;
export function repeat<T = unknown>(
  domain: T[],
  func: (value: T, index: number) => LayoutNode,
  options?: RepeatOptions,
): DirectionlessRepeat<T>;
export function embed<T = unknown>(
  container: Container<T>,
  repeated: DirectionlessRepeat<T>,
  mapping?: EmbedMapping<T>,
): ViewportLayoutNode;
export function customContainer<T = unknown>(
  options: CustomContainerOptions<T>,
): Container<T>;
export function sequenceContainer<T = unknown>(
  options?: SequenceContainerOptions<T>,
): SequenceContainer<T>;
export function gridContainer<T = unknown>(
  options: GridContainerOptions<T>,
): GridContainer<T>;

export function parseCsv<T extends Datum = Datum>(
  csvText: string,
  options?: ParseCsvOptions,
): Table<T>;
export function loadCsvText(url: string | URL): Promise<string>;
export function tableColumns<T extends Datum = Datum>(
  rows: ReadonlyArray<T> & { columns?: string[] },
): string[];
export function numericColumns<T extends Datum = Datum>(
  rows: ReadonlyArray<T> & { columns?: string[] },
  options?: NumericColumnsOptions,
): string[];
export function crossJoin<L, R>(
  left: ReadonlyArray<L>,
  right: ReadonlyArray<R>,
): Array<[L, R]>;
export function crossJoin<L, R, O>(
  left: ReadonlyArray<L>,
  right: ReadonlyArray<R>,
  mapper: (left: L, right: R, leftIndex: number, rightIndex: number) => O,
): O[];

export function validateChartConfig<T extends Datum = Datum>(
  config?: ChartConfig<T>,
): void;
