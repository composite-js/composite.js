import * as d3 from "d3";
import { ChartRenderer } from "../renderer.js";
import { categoricalDomain } from "../scale.js";

export class WaffleChartRenderer extends ChartRenderer {
  constructor(options = {}) {
    super(options);
    this.colorScheme = options.colorScheme || d3.schemeCategory10;
  }

  render(svg, data) {
    const container = d3.select(svg);
    container.selectAll("*").remove();

    const categoryField = this.encoding.x;
    const valueField = this.encoding.y;
    const categories = categoricalDomain(
      data,
      categoryField,
      this.encoding.xDomain,
    );
    const values = categories.map((category) =>
      d3.sum(data, (datum) =>
        datum[categoryField] === category ? datum[valueField] : 0,
      ),
    );
    const total = d3.sum(values);
    const exact = values.map((value) => (value / total) * 100);
    const counts = exact.map(Math.floor);
    const remainder = 100 - d3.sum(counts);
    const order = exact
      .map((value, index) => ({ index, fraction: value - counts[index] }))
      .sort((a, b) => b.fraction - a.fraction || a.index - b.index);
    for (let i = 0; i < remainder; i += 1) counts[order[i].index] += 1;

    const colors = d3.scaleOrdinal(this.colorScheme).domain(categories);
    const cellSize = Math.min(this.width, this.height) / 10;
    const gridLeft = this.margin.left + (this.width - cellSize * 10) / 2;
    const gridTop = this.margin.top + (this.height - cellSize * 10) / 2;
    let cellIndex = 0;

    counts.forEach((count, categoryIndex) => {
      const category = categories[categoryIndex];
      for (let i = 0; i < count; i += 1) {
        const column = cellIndex % 10;
        const row = 9 - Math.floor(cellIndex / 10);
        const datum = data.find((entry) => entry[categoryField] === category);
        const rect = this.renderStyledRect({
          container,
          left: gridLeft + column * cellSize,
          top: gridTop + row * cellSize,
          width: cellSize,
          height: cellSize,
          value: values[categoryIndex],
          category,
          datum,
          index: cellIndex,
          orientation: "grid",
          role: "waffle-cell",
          fill: colors(category),
          stroke: "white",
          strokeWidth: 1,
        });
        rect.append("title").text(`${category}: ${values[categoryIndex]}`);
        cellIndex += 1;
      }
    });

    return null;
  }
}
