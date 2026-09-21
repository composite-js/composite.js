// Link: https://insights.datylon.com/workspace/designs/new?publication=jVPwg1Q_CeguvLAxY4VJKw

import * as d3 from "d3";
import {
  chart,
  custom,
  loadCsvText,
  parseCsv,
  repeatX,
  stackY,
} from "../src/index.js";

const datasetUrls = {
  monthly: new URL("./dataset/rainfall/monthly.csv", import.meta.url),
  yearly: new URL("./dataset/rainfall/yearly.csv", import.meta.url),
};

const months = [
  { key: "Jan", label: "J" },
  { key: "Feb", label: "F" },
  { key: "Mar", label: "M" },
  { key: "Apr", label: "A" },
  { key: "May", label: "M" },
  { key: "Jun", label: "J" },
  { key: "Jul", label: "J" },
  { key: "Aug", label: "A" },
  { key: "Sep", label: "S" },
  { key: "Oct", label: "O" },
  { key: "Nov", label: "N" },
  { key: "Dec", label: "D" },
];

const gridWidth = 900;
const gridHeight = 560;
const accent = "#1787d4";
const colors = {
  low: "#ebb63f",
  medium: "#d9c260",
  high: "#9fbf82",
  extreme: "#69b8cf",
};

class RainfallBubbleGrid {
  constructor(options = {}) {
    this.data = options.data || [];
    this.years = options.years || [];
    this.months = options.months || [];
    this.width = options.width || gridWidth;
    this.height = options.height || gridHeight;
    this.options = {
      ...options,
      width: this.width,
      height: this.height,
    };
  }

  colorFor(value) {
    if (value >= 8) return colors.extreme;
    if (value >= 4) return colors.high;
    if (value >= 1) return colors.medium;
    return colors.low;
  }

  render(svg, renderOptions = {}) {
    const container = d3.select(svg);
    const margin = renderOptions.margin || {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    };
    const width =
      renderOptions.width !== undefined ? renderOptions.width : this.width;
    const height =
      renderOptions.height !== undefined ? renderOptions.height : this.height;

    container.selectAll("*").remove();

    const xScale = d3
      .scaleBand()
      .domain(this.years)
      .range([0, width])
      .paddingInner(0.34)
      .paddingOuter(0.5);
    const yScale = d3
      .scaleBand()
      .domain(this.months.map((month) => month.key))
      .range([0, height])
      .paddingInner(0.16)
      .paddingOuter(0.08);
    const radius = d3
      .scaleSqrt()
      .domain([0, d3.max(this.data, (d) => d.value) || 1])
      .range([2, Math.min(xScale.bandwidth(), yScale.bandwidth()) * 0.56]);

    const plot = container
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    plot
      .append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "none")
      .attr("stroke", accent)
      .attr("stroke-width", 2);

    this.years.forEach((year) => {
      const x = xScale(year) + xScale.bandwidth() / 2;

      plot
        .append("line")
        .attr("x1", x)
        .attr("x2", x)
        .attr("y1", yScale(this.months[0].key))
        .attr("y2", yScale(this.months.at(-1).key) + yScale.bandwidth())
        .attr("stroke", "#6e6e6e")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "4 4")
        .attr("opacity", 0.75);

      plot
        .append("text")
        .attr("x", x)
        .attr("y", -34)
        .attr("fill", "#3f3f3f")
        .attr("font-family", "Georgia, 'Times New Roman', serif")
        .attr("font-size", 20)
        .attr("text-anchor", "middle")
        .text(year);
    });

    this.data.forEach((d) => {
      const x = xScale(d.year) + xScale.bandwidth() / 2;
      const y = yScale(d.month) + yScale.bandwidth() / 2;
      const circle = plot
        .append("circle")
        .attr("cx", x)
        .attr("cy", y)
        .attr("r", radius(d.value))
        .attr("fill", this.colorFor(d.value))
        .attr("fill-opacity", 0.82)
        .attr("stroke", "none");

      circle.append("title").text(`${d.month} ${d.year}: ${d.value}`);
    });
  }
}

function rainfallBubbleGrid(options) {
  return custom(new RainfallBubbleGrid(options), {
    classTag: "rainfall-bubble-grid",
  });
}

function buildView({ monthly, yearly }) {
  const years = monthly.map((row) => String(row.year));
  const rainfallData = monthly.flatMap((row) =>
    months.map((month) => ({
      year: String(row.year),
      month: month.key,
      value: row[month.key],
    })),
  );
  const yearlyData = yearly.map((row) => ({
    ...row,
    year: String(row.year),
  }));
  const bubbleGrid = rainfallBubbleGrid({
    data: rainfallData,
    years,
    months,
    width: gridWidth,
    height: gridHeight,
  });
  const rainyDayPies = repeatX(
    years,
    (year) => {
      const datum = yearlyData.find((item) => item.year === year);

      return chart({
        data: [
          { category: "rainy", value: datum.rainyDayShare },
          { category: "dry", value: 1 - datum.rainyDayShare },
        ],
        mark: "pie",
        encoding: { x: "category", y: "value" },
        width: 46,
        height: 46,
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
        colorScheme: [colors.extreme, "#e5e5e5"],
        showLabels: false,
      });
    },
    {
      width: gridWidth,
      height: 48,
      paddingInner: 0.34,
      paddingOuter: 0.5,
    },
  );
  const yearlyBars = chart({
    data: yearlyData,
    mark: "bar",
    encoding: {
      x: "year",
      y: "rainfall",
      xDomain: years,
      yDomain: [0, 36],
    },
    width: gridWidth,
    height: 230,
    margin: { top: 10, right: 0, bottom: 36, left: 0 },
    color: colors.extreme,
    showLabels: true,
    showXAxis: false,
    showYAxis: false,
    padding: { xInner: 0.34, xOuter: 0.5 },
  });

  return stackY([bubbleGrid, rainyDayPies, yearlyBars], { margin: 8 });
}

export async function createExample() {
  const [monthly, yearly] = await Promise.all(
    Object.values(datasetUrls).map(async (url) =>
      parseCsv(await loadCsvText(url)),
    ),
  );

  return buildView({ monthly, yearly });
}

if (typeof document !== "undefined") {
  createExample().then((view) => {
    view.render(document.getElementById("app"));
  });
}
