// Link: https://insights.datylon.com/workspace/designs/new?publication=jVPwg1Q_CeguvLAxY4VJKw

import * as d3 from "d3";
import { chart, Node, repeatX, stackY } from "../src/index.js";

const years = [
  "2008",
  "2009",
  "2010",
  "2011",
  "2012",
  "2013",
  "2014",
  "2015",
  "2016",
  "2017",
  "2018",
];

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

const monthlyRainfallByYear = {
  2008: [0.05, 1.18, 0.44, 3.48, 7.2, 0.82, 2.86, 2.18, 0.36, 0.08, 0, 0],
  2009: [0.04, 1.35, 4.8, 3.4, 3.85, 5.55, 3.05, 0.42, 2.95, 0.22, 0, 0],
  2010: [1.9, 1.58, 0.74, 5.8, 5.05, 1.42, 4.85, 2.72, 1.55, 0.02, 0, 0],
  2011: [0.26, 0.02, 3.9, 6.15, 1.12, 3.25, 0.28, 1.65, 1.12, 0, 0.05, 0.18],
  2012: [0.34, 0.04, 1.18, 1.05, 0.95, 0.55, 5.2, 3.85, 1.35, 0, 0, 0.02],
  2013: [0.01, 0.02, 1.58, 3.55, 5.92, 0.04, 0.48, 1.22, 0, 0.32, 0.02, 0],
  2014: [0.22, 0.08, 1.22, 0.12, 1.72, 8.35, 2.35, 0.55, 0.28, 0.52, 0, 0.08],
  2015: [0, 0.22, 1.44, 5.98, 1.02, 5.65, 3.9, 0.9, 0, 0.06, 0, 0.08],
  2016: [0.16, 0, 1.88, 3.85, 6.95, 8.9, 2.45, 0.98, 1.95, 0, 0, 0.03],
  2017: [0.01, 0.04, 4.95, 5.05, 0.32, 4.25, 0.22, 1.65, 0.18, 0.06, 0, 0],
  2018: [0, 0, 0, 0, 5.85, 4.45, 1.6, 3.28, 0.14, 0, 0, 0],
};

const yearlyTotals = [
  17.55, 17.53, 32.34, 23.26, 18.19, 12.54, 16.61, 15.64, 28.87, 24.09, 18.11,
];

const rainyDayShares = {
  2008: 0.12,
  2009: 0.18,
  2010: 0.28,
  2011: 0.2,
  2012: 0.16,
  2013: 0.1,
  2014: 0.18,
  2015: 0.14,
  2016: 0.24,
  2017: 0.2,
  2018: 0.16,
};

const gridWidth = 900;
const gridHeight = 560;
const accent = "#1787d4";
const colors = {
  low: "#ebb63f",
  medium: "#d9c260",
  high: "#9fbf82",
  extreme: "#69b8cf",
};

const rainfallData = years.flatMap((year) =>
  months.map((month, index) => ({
    year,
    month: month.key,
    value: monthlyRainfallByYear[year][index],
  })),
);

const rainyDayData = years.map((year) => ({
  year,
  rainy: rainyDayShares[year],
  dry: 1 - rainyDayShares[year],
}));

const yearlyRainfallData = years.map((year, index) => ({
  year,
  rainfall: yearlyTotals[index],
}));

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
  const node = new Node();
  node.element = new RainfallBubbleGrid(options);
  node.classTag = "rainfall-bubble-grid";
  return node;
}

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
    const datum = rainyDayData.find((item) => item.year === year);

    return chart({
      data: [
        { category: "rainy", value: datum.rainy },
        { category: "dry", value: datum.dry },
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
  data: yearlyRainfallData,
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

const rainfall = stackY([bubbleGrid, rainyDayPies, yearlyBars], {
  margin: 8,
});

export function createExample() {
  return rainfall;
}

if (typeof document !== "undefined") {
  createExample().render(document.getElementById("app"));
}
