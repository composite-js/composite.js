// Link: https://www.pinterest.com/pin/1026820783831525388/

import { chart, loadCsvText, parseCsv, stackX } from "../src/index.js";

const mirrorCsvUrl = new URL("./dataset/mirror.csv", import.meta.url);
const years = ["2008", "2010", "2012", "2014", "2016"];

function matrixData(rows, prefix) {
  return rows.flatMap((row) =>
    years.map((year) => ({
      institution: row.institution,
      year,
      value: row[`${prefix}${year}`],
    })),
  );
}

function buildView(rows) {
  const institutions = rows.map((row) => row.institution);
  const leftMatrix = chart({
    data: matrixData(rows, "trust"),
    mark: "matrix",
    encoding: {
      x: "year",
      group: "institution",
      y: "value",
      xDomain: years,
      groupDomain: institutions,
    },
    width: 96,
    height: 640,
    margin: { top: 18, right: 6, bottom: 4, left: 154 },
    color: "#4f66ad",
    showXAxis: true,
    showYAxis: true,
    xAxisPos: "top",
    padding: { xInner: 0.08, yInner: 0.12 },
    circleRadius: 7,
    labelFontSize: 10,
  });

  const leftBar = chart({
    data: rows,
    mark: "bar",
    encoding: {
      x: "trust",
      y: "institution",
      xDomain: [0, 100],
    },
    width: 220,
    height: 640,
    margin: { top: 18, right: 8, bottom: 4, left: 24 },
    yAxisPos: "right",
    color: "#5269ae",
    showLabels: true,
    showXAxis: false,
    showYAxis: false,
    padding: { yInner: 0.22, yOuter: 0 },
  });

  const rightBar = chart({
    data: rows,
    mark: "bar",
    encoding: {
      x: "distrust",
      y: "institution",
      xDomain: [0, 100],
    },
    width: 220,
    height: 640,
    margin: { top: 18, right: 24, bottom: 4, left: 8 },
    yAxisPos: "left",
    color: "#d9154f",
    showLabels: true,
    showXAxis: false,
    showYAxis: false,
    padding: { yInner: 0.22, yOuter: 0 },
  });

  const rightMatrix = chart({
    data: matrixData(rows, "distrust"),
    mark: "matrix",
    encoding: {
      x: "year",
      group: "institution",
      y: "value",
      xDomain: years,
      groupDomain: institutions,
    },
    width: 96,
    height: 640,
    margin: { top: 18, right: 8, bottom: 4, left: 6 },
    color: "#d9154f",
    showXAxis: true,
    showYAxis: false,
    xAxisPos: "top",
    padding: { xInner: 0.08, yInner: 0.12 },
    circleRadius: 7,
    labelFontSize: 10,
  });

  return stackX([leftMatrix, leftBar, rightBar, rightMatrix], { margin: 0 });
}

export async function createExample() {
  const csvText = await loadCsvText(mirrorCsvUrl);
  return buildView(parseCsv(csvText));
}

if (typeof document !== "undefined") {
  createExample().then((view) => {
    view.render(document.getElementById("app"));
  });
}
