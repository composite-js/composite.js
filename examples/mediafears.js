// Source: https://www.zingchart.com/gallery/multiple-area-charts-with-shared-crosshair

import * as d3 from "d3";
import {
  chart,
  custom,
  loadCsvText,
  parseCsv,
  repeatY,
  stackX,
  stackY,
  text,
  wrapper,
} from "../src/index.js";

const plotWidth = 1040;
const laneHeight = 34;
const labelWidth = 176;
const axisHeight = 34;
const yDomain = [0, 100];
const datasetUrl = new URL("./dataset/mediafears.csv", import.meta.url);

const topics = [
  { key: "zika", name: "ZIKA", color: "#f02b20" },
  { key: "mers", name: "MERS", color: "#8d2caf" },
  { key: "ebola", name: "EBOLA", color: "#e4cc00" },
  {
    key: "cellPhonesTumors",
    name: "CELL PHONES & TUMORS",
    color: "#e5005c",
  },
  { key: "swineFlu", name: "SWINE FLU", color: "#08aadb" },
  { key: "birdFlu", name: "BIRD FLU", color: "#9bc53d" },
  { key: "killerWasps", name: "KILLER WASPS", color: "#70777d" },
  { key: "sars", name: "SARS", color: "#1e5b93" },
  { key: "asteroids", name: "ASTEROIDS", color: "#a9630c" },
  { key: "madCow", name: "MAD COW DISEASE", color: "#9a35bd" },
  {
    key: "vaccinesAutism",
    name: "VACCINES & AUTISM",
    color: "#f18a2a",
  },
  {
    key: "violentVideoGames",
    name: "VIOLENT VIDEO GAMES",
    color: "#6f9e1f",
  },
  { key: "millenniumBug", name: "MILLENNIUM BUG", color: "#d91f16" },
];

const timelineTicks = [
  { value: 0, label: "Mar 2007" },
  { value: 40, label: "May 2010" },
  { value: 80, label: "Jul 2013" },
  { value: 120, label: "Sep 2016" },
  { value: 160, label: "Nov 2019" },
  { value: 179, label: "Nov 2021" },
];

class TimelineAxis {
  constructor(options = {}) {
    this.ticks = options.ticks || [];
    this.domain = options.domain;
    this.width = options.width || plotWidth;
    this.height = options.height || axisHeight;
    this.options = {
      ...options,
      width: this.width,
      height: this.height,
    };
  }

  render(svg, renderOptions = {}) {
    const container = d3.select(svg);
    const width = renderOptions.width ?? this.width;
    const height = renderOptions.height ?? this.height;
    const scale = d3.scaleLinear().domain(this.domain).range([0, width]);

    container.selectAll("*").remove();
    container
      .append("line")
      .attr("x1", 0)
      .attr("x2", width)
      .attr("y1", 0.5)
      .attr("y2", 0.5)
      .attr("stroke", "#767676")
      .attr("stroke-width", 1);

    this.ticks.forEach((tick, index) => {
      const x = scale(tick.value);
      const anchor =
        index === 0
          ? "start"
          : index === this.ticks.length - 1
            ? "end"
            : "middle";

      container
        .append("line")
        .attr("x1", x)
        .attr("x2", x)
        .attr("y1", 0)
        .attr("y2", 6)
        .attr("stroke", "#767676")
        .attr("stroke-width", 1);

      container
        .append("text")
        .attr("x", x)
        .attr("y", height - 5)
        .attr("fill", "#666")
        .attr("font-family", "sans-serif")
        .attr("font-size", 11)
        .attr("text-anchor", anchor)
        .text(tick.label);
    });
  }
}

function buildView(rows) {
  const xDomain = [rows[0].month, rows.at(-1).month];
  const laneGrid = repeatY(
    topics,
    (topic) =>
      wrapper(
        chart({
          data: rows.map((row) => ({
            month: row.month,
            intensity: row[topic.key],
          })),
          mark: "area",
          encoding: {
            x: "month",
            y: "intensity",
            xDomain,
            yDomain,
          },
          width: plotWidth,
          height: laneHeight,
          margin: { top: 0, right: 0, bottom: 0, left: 0 },
          color: topic.color,
          fillOpacity: 1,
          strokeWidth: 0.8,
          showPoints: false,
          showXAxis: false,
          showYAxis: false,
        }),
        {
          fill: "#f3f3f3",
          stroke: "#8d8d8d",
          strokeWidth: 0.55,
        },
      ),
    {
      width: plotWidth,
      height: laneHeight * topics.length,
    },
  );

  const topicLabels = repeatY(topics, (topic) =>
    text({
      text: topic.name,
      width: labelWidth,
      height: laneHeight,
      x: 7,
      fill: "#4a4a4a",
      fontSize: 11,
      fontWeight: 600,
      textAnchor: "start",
    }),
  );

  const axis = custom(
    new TimelineAxis({
      ticks: timelineTicks,
      domain: xDomain,
      width: plotWidth,
      height: axisHeight,
    }),
    { classTag: "media-fears-timeline-axis" },
  );
  const lanes = stackX([laneGrid, topicLabels]);
  const body = stackY([lanes, axis], { align: [laneGrid, axis] });
  const intensityLabel = text({
    text: "Intensity",
    width: 30,
    height: laneHeight * topics.length + axisHeight,
    fill: "#4a4a4a",
    fontSize: 12,
    fontWeight: 600,
    rotate: -90,
  });

  return stackX([intensityLabel, body], { margin: 6 });
}

export async function createExample() {
  const rows = parseCsv(await loadCsvText(datasetUrl));
  return buildView(rows);
}

if (typeof document !== "undefined") {
  createExample().then((view) => {
    view.render(document.getElementById("app"));
  });
}
