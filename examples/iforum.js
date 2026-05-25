// System: iForum
// Title: Visual Analysis of MOOC Forums with iForum
// Authors: Siwei Fu, Jian Zhao, Weiwei Cui, and Huamin Qu
// Link: https://ieeexplore.ieee.org/document/7534878

import {
  chart,
  frame,
  repeatX,
  repeatY,
  stackX,
  stackY,
  text,
} from "../src/index.js";

const dates = [
  "18-Jun",
  "25-Jun",
  "02-Jul",
  "09-Jul",
  "16-Jul",
  "23-Jul",
  "30-Jul",
  "06-Aug",
  "13-Aug",
  "20-Aug",
  "27-Aug",
  "03-Sep",
  "10-Sep",
  "17-Sep",
];

const streamTypes = [
  { key: "Assessment", color: "#fbb4b0" },
  { key: "Course Content", color: "#dfd2aa" },
  { key: "Questions", color: "#fbf7a3" },
  { key: "General", color: "#79cb98" },
];

const boxTypes = [
  { key: "posts", color: "#e6a15b" },
  { key: "views", color: "#aaa2cf" },
];

const streamWidth = 140;
const bodyWidth = 640;
const bodyHeight = 560;
const barHeight = 78;
const labelHeight = 70;
const maxValue = 150;

function wave(index, phase, amplitude, floor) {
  return (
    floor +
    amplitude *
      (0.75 +
        Math.sin(index * 0.88 + phase) * 0.35 +
        Math.cos(index * 0.43 + phase) * 0.18)
  );
}

const streamData = [];
dates.forEach((date, index) => {
  streamTypes.forEach((type, typeIndex) => {
    streamData.push({
      date,
      type: type.key,
      value: wave(index, typeIndex * 0.7, 12 - typeIndex * 4, 4 + typeIndex),
    });
  });
});

const barData = [];
dates.forEach((date, index) => {
  const values = [
    Math.max(2, Math.round(38 - index * 2.4 + Math.sin(index) * 7)),
    Math.max(2, Math.round(32 - index * 1.9 + Math.cos(index * 0.8) * 6)),
  ];

  boxTypes.forEach((type, typeIndex) => {
    barData.push({
      date,
      type: type.key,
      count: values[typeIndex],
      color: type.color,
    });
  });
});

function dateLabelRow(date) {
  return text({
    text: date,
    height: labelHeight,
    x: 34,
    y: 18,
    fill: "#222",
    fontSize: 16,
    rotate: -45,
    textAnchor: "end",
    dominantBaseline: "middle",
  });
}

const groupedBars = chart({
  data: barData,
  mark: "groupbar",
  encoding: { x: "date", y: "count", group: "type", yDomain: [0, 45] },
  width: bodyWidth,
  height: barHeight,
  margin: { top: 0, right: 0, bottom: 0, left: 0 },
  colorScheme: boxTypes.map((type) => type.color),
  showXAxis: false,
  showYAxis: false,
  padding: { xInner: 0.42, xOuter: 0.02, groupInner: 0.08 },
});

const dateLabels = repeatX(dates, dateLabelRow, {
  width: bodyWidth,
  height: labelHeight,
  paddingInner: 0.42,
  paddingOuter: 0.02,
});

function boxValues(rowIndex, typeIndex) {
  const center = 12 + rowIndex * 5.9 + typeIndex * 3.3;
  const spread = 5.5 + (rowIndex % 4) * 1.2 + typeIndex * 1.8;
  const values = [];

  for (let i = 0; i < 26; i += 1) {
    const offset = Math.sin((i + 1) * (rowIndex + 2) * 0.37) * spread;
    const shoulder = Math.cos((i + typeIndex + 3) * 0.71) * spread * 0.35;
    values.push(Math.max(0, center + offset + shoulder));
  }

  if (rowIndex < 12) {
    values.push(Math.min(maxValue, center + 25 + rowIndex * 2.4));
    values.push(
      Math.min(maxValue, center + 37 + typeIndex * 9 + (rowIndex % 3) * 6),
    );
  }

  if (rowIndex % 3 === 1) {
    values.push(Math.min(maxValue, center + 50));
  }

  return values;
}

const boxDataByRow = new Map();
dates.forEach((date, rowIndex) => {
  boxTypes.forEach((type, typeIndex) => {
    boxDataByRow.set(
      `${date}-${type.key}`,
      boxValues(rowIndex, typeIndex).map((value) => ({
        row: date,
        value,
      })),
    );
  });
});

const streamGraph = chart({
  data: streamData,
  mark: "stream",
  encoding: { x: "date", y: "value", group: "type" },
  width: streamWidth,
  height: bodyHeight,
  margin: { top: 0, right: 0, bottom: 0, left: 0 },
  colors: streamTypes.map((type) => type.color),
  direction: "vertical",
  opacity: 0.94,
  showXAxis: false,
  showYAxis: false,
});

const boxplotGroups = repeatY(
  dates,
  (date) =>
    frame(
      repeatY(
        boxTypes.map((type) => type.key),
        (key) => {
          const type = boxTypes.find((item) => item.key === key);

          return chart({
            data: boxDataByRow.get(`${date}-${key}`),
            mark: "box",
            encoding: { x: "value", y: "row", xDomain: [0, maxValue] },
            direction: "horizontal",
            width: bodyWidth,
            height: 16,
            margin: { top: 0, right: 0, bottom: 0, left: 0 },
            color: type.color,
            boxWidth: 0.74,
            valueRangePadding: 6,
            whiskerStrokeDasharray: "3 3",
            outlierFill: type.color,
            outlierOpacity: 0.72,
            showXAxis: false,
            showYAxis: false,
            padding: { inner: 0.1, outer: 0.18 },
          });
        },
        { width: bodyWidth, height: 30, paddingInner: 0.08, paddingOuter: 0 },
      ),
      { stroke: "black", fill: "none", padding: 0 },
    ),
  { width: bodyWidth, height: bodyHeight, paddingInner: 0.13, paddingOuter: 0 },
);

const rightColumn = stackY([groupedBars, dateLabels, boxplotGroups]);

const iforum = stackX([streamGraph, rightColumn], {
  align: [null, boxplotGroups],
  margin: 30,
});

export function createExample() {
  return iforum;
}

if (typeof document !== "undefined") {
  createExample().render(document.getElementById("app"));
}
