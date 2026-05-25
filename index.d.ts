export type Primitive = string | number | boolean | null | undefined;
export type Datum = object;
export type Accessor<T = unknown> =
  | string
  | ((datum: T, index: number) => unknown);

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

export interface LayoutNode {
  readonly classTag?: string;
  render(
    container: HTMLElement | SVGElement,
    renderOptions?: RenderOptions,
  ): void;
  export(options?: ExportOptions): Promise<string | Uint8Array>;
}

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
    renderOptions?: RenderOptions,
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

export interface FrameOptions {
  padding?: number | Margin;
  stroke?: string;
  fill?: string;
  strokeWidth?: number;
  strokeDasharray?: string;
  margin?: Margin;
  [option: string]: unknown;
}

export interface StackOptions {
  margin?: number;
  align?: Array<LayoutNode | null | undefined>;
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

export interface SequenceContainer<T = unknown> {
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
}

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
): LayoutNode;
export function custom(
  renderable: CustomRenderable,
  options?: CustomOptions,
): LayoutNode;
export function text(config?: TextOptions): LayoutNode;
export function image(config: ImageOptions): LayoutNode;
export function frame(node: LayoutNode, options?: FrameOptions): LayoutNode;
export function stackX(nodes: LayoutNode[], options?: StackOptions): LayoutNode;
export function stackY(nodes: LayoutNode[], options?: StackOptions): LayoutNode;
export function repeatX<T = unknown>(
  domain: T[],
  func: (value: T, index: number) => LayoutNode,
  options?: RepeatOptions,
): LayoutNode;
export function repeatY<T = unknown>(
  domain: T[],
  func: (value: T, index: number) => LayoutNode,
  options?: RepeatOptions,
): LayoutNode;
export function repeat<T = unknown>(
  domain: T[],
  func: (value: T, index: number) => LayoutNode,
  options?: RepeatOptions,
): DirectionlessRepeat<T>;
export function embed<T = unknown>(
  container: SequenceContainer<T>,
  repeated: DirectionlessRepeat<T>,
  mapping?: EmbedMapping<T>,
): LayoutNode;
export function sequenceContainer<T = unknown>(
  options?: SequenceContainerOptions<T>,
): SequenceContainer<T>;

export function validateChartConfig(config?: ChartConfig): void;
