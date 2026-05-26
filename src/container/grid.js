import * as d3 from "d3";
import { normalizeContainerOptions, valueOf } from "./base.js";

function assertDomain(domain, label) {
  if (!Array.isArray(domain)) {
    throw new TypeError(`${label} must be an array.`);
  }
}

function assertCellSizing(cellSizing) {
  if (cellSizing !== "fill" && cellSizing !== "intrinsic") {
    throw new TypeError('grid cellSizing must be "fill" or "intrinsic".');
  }
}

export class GridContainer {
  constructor(options = {}) {
    assertDomain(options.rowDomain, "rowDomain");
    assertDomain(options.columnDomain, "columnDomain");

    const normalized = normalizeContainerOptions(options);
    const cellSizing = options.cellSizing || "fill";
    assertCellSizing(cellSizing);

    this.options = normalized;
    this.width = normalized.width;
    this.height = normalized.height;
    this.margin = normalized.margin;
    this.rowDomain = [...options.rowDomain];
    this.columnDomain = [...options.columnDomain];
    this.rowField = options.row || "row";
    this.columnField = options.column || "column";
    this.paddingInner =
      options.paddingInner !== undefined ? options.paddingInner : 0;
    this.paddingOuter =
      options.paddingOuter !== undefined ? options.paddingOuter : 0;
    this.cellSizing = cellSizing;
    this.showGrid = options.showGrid !== undefined ? options.showGrid : true;
    this.stroke = options.stroke || "#d0d0d0";
    this.fill = options.fill || "none";
  }

  columnScale(width = this.width) {
    return d3
      .scaleBand()
      .domain(this.columnDomain)
      .range([0, width])
      .paddingInner(this.paddingInner)
      .paddingOuter(this.paddingOuter);
  }

  rowScale(height = this.height) {
    return d3
      .scaleBand()
      .domain(this.rowDomain)
      .range([0, height])
      .paddingInner(this.paddingInner)
      .paddingOuter(this.paddingOuter);
  }

  slots(data, mapping = {}, size = {}) {
    const width = size.width ?? this.width;
    const height = size.height ?? this.height;
    const column = this.columnScale(width);
    const row = this.rowScale(height);
    const columnAccessor = mapping.column ?? mapping.x ?? this.columnField;
    const rowAccessor = mapping.row ?? mapping.y ?? this.rowField;
    const keyAccessor = mapping.key;
    const slots = [];

    data.forEach((datum, index) => {
      const columnValue = valueOf(columnAccessor, datum, index);
      const rowValue = valueOf(rowAccessor, datum, index);
      const x = column(columnValue);
      const y = row(rowValue);

      if (x === undefined || y === undefined) return;

      const cellWidth = column.bandwidth();
      const cellHeight = row.bandwidth();
      const slot = {
        datum,
        key:
          keyAccessor !== undefined
            ? valueOf(keyAccessor, datum, index)
            : index,
        x: x + cellWidth / 2,
        y: y + cellHeight / 2,
      };

      if (mapping.width !== undefined) {
        slot.width = mapping.width;
      } else if (this.cellSizing === "fill") {
        slot.width = cellWidth;
      }

      if (mapping.height !== undefined) {
        slot.height = mapping.height;
      } else if (this.cellSizing === "fill") {
        slot.height = cellHeight;
      }

      slots.push(slot);
    });

    return slots;
  }

  render(svg, renderOptions = {}) {
    if (!this.showGrid) return;

    const width = renderOptions.width ?? this.width;
    const height = renderOptions.height ?? this.height;
    const margin = renderOptions.margin ?? this.margin;
    const column = this.columnScale(width);
    const row = this.rowScale(height);
    const container = d3.select(svg);

    this.rowDomain.forEach((rowValue) => {
      this.columnDomain.forEach((columnValue) => {
        container
          .append("rect")
          .attr("x", margin.left + column(columnValue))
          .attr("y", margin.top + row(rowValue))
          .attr("width", column.bandwidth())
          .attr("height", row.bandwidth())
          .attr("fill", this.fill)
          .attr("stroke", this.stroke);
      });
    });
  }
}

export function gridContainer(options = {}) {
  return new GridContainer(options);
}
