// Link: https://www.pinterest.com/pin/1026820783831525388/

import { chart, stackX } from "../src/index.js";

const rows = [
  "Reniec",
  "Radio",
  "ONPE",
  "Fuerzas Armadas",
  "Banco Central de Reserva",
  "Iglesia Catolica",
  "Empresas privadas",
  "Defensoria del Pueblo",
  "Empresas encuestadoras",
  "Sunat",
  "INEI",
  "Hospitales del sector Salud",
  "Jurado Nacional de Elecciones",
  "Indecopi",
  "ONG",
  "Municipalidad distrital",
  "Essalud",
  "Prensa escrita",
  "Television",
  "Policia Nacional",
  "Municipalidad provincial",
  "Tribunal Constitucional",
  "Iglesias evangelicas",
  "Sindicatos",
  "Fiscalia de la Nacion",
  "Contraloria General de la Republica",
  "CGTP",
  "Poder Ejecutivo",
  "Confiep",
  "Poder Judicial",
  "Congreso de la Republica",
  "Partidos politicos",
];

const columns = ["2008", "2010", "2012", "2014", "2016"];
const leftTrust = [
  83, 70, 63, 60, 60, 58, 58, 57, 57, 55, 55, 52, 50, 48, 45, 43, 43, 43, 42,
  39, 39, 36, 35, 31, 25, 23, 22, 20, 20, 16, 12, 12,
];
const rightDistrust = [
  16, 25, 33, 33, 29, 39, 35, 36, 34, 41, 26, 45, 45, 39, 45, 54, 52, 51, 54,
  55, 53, 54, 59, 62, 70, 62, 62, 73, 42, 79, 84, 82,
];

function matrixData(values, phaseShift = 0) {
  return rows.flatMap((institution, rowIndex) =>
    columns.map((year, columnIndex) => {
      const base = values[rowIndex] / 100;
      const drift = (columnIndex - 2) * 0.08;
      const wave = Math.sin(rowIndex * 0.7 + columnIndex + phaseShift) * 0.1;
      return {
        institution,
        year,
        value: Math.max(0, Math.min(1, base + drift + wave)),
      };
    }),
  );
}

const leftMatrix = chart({
  data: matrixData(leftTrust),
  mark: "matrix",
  encoding: {
    x: "year",
    y: "institution",
    value: "value",
    xDomain: columns,
    yDomain: rows,
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
  data: rows.map((institution, index) => ({
    institution,
    value: leftTrust[index],
  })),
  mark: "bar",
  encoding: {
    x: "value",
    y: "institution",
    xDomain: [0, 100],
  },
  width: 220,
  height: 640,
  margin: { top: 18, right: 8, bottom: 4, left: 24 },
  direction: "horizontal",
  yAxisPos: "right",
  color: "#5269ae",
  showLabels: true,
  showXAxis: false,
  showYAxis: false,
  padding: { yInner: 0.22, yOuter: 0 },
});

const rightBar = chart({
  data: rows.map((institution, index) => ({
    institution,
    value: rightDistrust[index],
  })),
  mark: "bar",
  encoding: {
    x: "value",
    y: "institution",
    xDomain: [0, 100],
  },
  width: 220,
  height: 640,
  margin: { top: 18, right: 24, bottom: 4, left: 8 },
  direction: "horizontal",
  yAxisPos: "left",
  color: "#d9154f",
  showLabels: true,
  showXAxis: false,
  showYAxis: false,
  padding: { yInner: 0.22, yOuter: 0 },
});

const rightMatrix = chart({
  data: matrixData(rightDistrust, 1.8),
  mark: "matrix",
  encoding: {
    x: "year",
    y: "institution",
    value: "value",
    xDomain: columns,
    yDomain: rows,
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

const mirror = stackX([leftMatrix, leftBar, rightBar, rightMatrix], {
  margin: 0,
});

export function createExample() {
  return mirror;
}

if (typeof document !== "undefined") {
  createExample().render(document.getElementById("app"));
}
