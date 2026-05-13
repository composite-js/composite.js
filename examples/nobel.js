import { chart, repeatY, stackX } from "../src/index.js";

const app = document.getElementById("app");

const fields = [
  {
    name: "Physics",
    color: "#3b82f6",
    ages: [
      { year: 1901, age: 55 },
      { year: 1922, age: 43 },
      { year: 1945, age: 62 },
      { year: 1965, age: 47 },
      { year: 1988, age: 59 },
      { year: 2012, age: 68 },
      { year: 2023, age: 64 },
    ],
    education: [
      { degree: "Doctoral", count: 20 },
      { degree: "Master", count: 5 },
      { degree: "Bachelor", count: 3 },
      { degree: "Other", count: 1 },
    ],
  },
  {
    name: "Chemistry",
    color: "#14b8a6",
    ages: [
      { year: 1902, age: 50 },
      { year: 1929, age: 51 },
      { year: 1954, age: 53 },
      { year: 1979, age: 60 },
      { year: 1996, age: 63 },
      { year: 2018, age: 72 },
      { year: 2023, age: 62 },
    ],
    education: [
      { degree: "Doctoral", count: 18 },
      { degree: "Master", count: 4 },
      { degree: "Bachelor", count: 2 },
      { degree: "Other", count: 2 },
    ],
  },
  {
    name: "Medicine",
    color: "#ef4444",
    ages: [
      { year: 1901, age: 49 },
      { year: 1930, age: 63 },
      { year: 1952, age: 54 },
      { year: 1977, age: 56 },
      { year: 2008, age: 72 },
      { year: 2015, age: 84 },
      { year: 2023, age: 68 },
    ],
    education: [
      { degree: "Doctoral", count: 18 },
      { degree: "Master", count: 3 },
      { degree: "Bachelor", count: 10 },
      { degree: "Other", count: 1 },
    ],
  },
  {
    name: "Literature",
    color: "#a855f7",
    ages: [
      { year: 1901, age: 62 },
      { year: 1923, age: 58 },
      { year: 1949, age: 52 },
      { year: 1967, age: 68 },
      { year: 1993, age: 62 },
      { year: 2016, age: 75 },
      { year: 2023, age: 64 },
    ],
    education: [
      { degree: "Doctoral", count: 5 },
      { degree: "Master", count: 9 },
      { degree: "Bachelor", count: 18 },
      { degree: "Other", count: 7 },
    ],
  },
  {
    name: "Peace",
    color: "#f59e0b",
    ages: [
      { year: 1901, age: 73 },
      { year: 1931, age: 71 },
      { year: 1964, age: 35 },
      { year: 1979, age: 69 },
      { year: 1993, age: 75 },
      { year: 2014, age: 17 },
      { year: 2023, age: 51 },
    ],
    education: [
      { degree: "Doctoral", count: 4 },
      { degree: "Master", count: 7 },
      { degree: "Bachelor", count: 18 },
      { degree: "Other", count: 11 },
    ],
  },
  {
    name: "Economics",
    color: "#64748b",
    ages: [
      { year: 1969, age: 66 },
      { year: 1976, age: 64 },
      { year: 1994, age: 66 },
      { year: 2002, age: 68 },
      { year: 2019, age: 46 },
      { year: 2021, age: 65 },
      { year: 2023, age: 77 },
    ],
    education: [
      { degree: "Doctoral", count: 18 },
      { degree: "Master", count: 2 },
      { degree: "Bachelor", count: 1 },
      { degree: "Other", count: 1 },
    ],
  },
];

const fieldsByName = new Map(fields.map((field) => [field.name, field]));
const fieldNames = fields.map((field) => field.name);
const educationDomain = ["Doctoral", "Master", "Bachelor", "Other"];
const rowWidth = 900;
const rowHeight = 120;

function nobelRow(fieldName) {
  const field = fieldsByName.get(fieldName);

  const ageArea = chart({
    data: field.ages,
    mark: "area",
    encoding: {
      x: "year",
      y: "age",
      xDomain: [1900, 2025],
      yDomain: [0, 100],
    },
    width: 560,
    height: 72,
    margin: { top: 14, right: 18, bottom: 28, left: 64 },
    color: field.color,
    fillOpacity: 0.22,
    strokeWidth: 2,
    xAxisName: "Award year",
    yAxisName: field.name,
  });

  const educationBars = chart({
    data: field.education,
    mark: "bar",
    encoding: {
      x: "count",
      y: "degree",
      xDomain: [0, 25],
      yDomain: educationDomain,
    },
    direction: "horizontal",
    width: 210,
    height: 72,
    margin: { top: 14, right: 48, bottom: 28, left: 72 },
    color: field.color,
    showLabels: true,
    showXAxis: true,
    showYAxis: true,
    xAxisName: "Education count",
  });

  return stackX([ageArea, educationBars]);
}

const nobelRows = repeatY(fieldNames, nobelRow, {
  width: rowWidth,
  height: rowHeight * fieldNames.length,
  paddingInner: 0.1,
  paddingOuter: 0,
});

nobelRows.render(app);
