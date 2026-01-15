// System: UpSet
// Title: UpSet: Visualization of Intersecting Sets
// Authors: Alexander Lex, Nils Gehlenborg, Hendrik Strobelt, Romain Vuillemot, and Hanspeter Pfister
// Link: https://ieeexplore.ieee.org/document/6876017
// Link: https://upset.app/

import { Chart } from "../src/chart.js";
import { stackX, stackY } from "../src/layout.js";

const data = [
  { sets: ["Drama"], intersectionSize: 20, setSize: 45 },
  { sets: ["Comedy"], intersectionSize: 15, setSize: 35 },
  { sets: ["Thriller"], intersectionSize: 12, setSize: 25 },
  { sets: ["Crime"], intersectionSize: 10, setSize: 30 },
  { sets: ["Action"], intersectionSize: 8, setSize: 28 },
  { sets: ["Romance"], intersectionSize: 6, setSize: 20 },
  { sets: ["Adventure"], intersectionSize: 5, setSize: 18 },
  { sets: ["Sci-Fi"], intersectionSize: 4, setSize: 15 },
  { sets: ["Fantasy"], intersectionSize: 3, setSize: 12 },
  { sets: ["Drama", "Romance"], intersectionSize: 10, setSize: 0 }, // Intersection only
  { sets: ["Action", "Adventure"], intersectionSize: 8, setSize: 0 },
  { sets: ["Crime", "Drama"], intersectionSize: 7, setSize: 0 },
  { sets: ["Comedy", "Romance"], intersectionSize: 6, setSize: 0 },
  { sets: ["Action", "Thriller"], intersectionSize: 5, setSize: 0 },
  { sets: ["Crime", "Thriller"], intersectionSize: 4, setSize: 0 },
];

const genres = [
  "Drama",
  "Comedy",
  "Thriller",
  "Crime",
  "Action",
  "Romance",
  "Adventure",
  "Sci-Fi",
  "Fantasy",
];

const intersections = data.map((d, i) => ({
  id: `I${i}`,
  sets: d.sets,
  size: d.intersectionSize,
}));

// Top Bar Chart Data
const topBarData = intersections.map((d) => ({
  id: d.id,
  size: d.size,
}));

// Matrix Data
const matrixData = [];
intersections.forEach((d) => {
  genres.forEach((genre) => {
    matrixData.push({
      id: d.id,
      genre: genre,
      active: d.sets.includes(genre),
    });
  });
});

// Left Bar Chart Data (Set Sizes)
const setSizeData = genres.map((genre) => {
  const entry = data.find((d) => d.sets.length === 1 && d.sets[0] === genre);
  return {
    genre: genre,
    size: entry ? entry.setSize : 0,
  };
});

// Box Plot Data (Randomly generated for demonstration)
const boxData = [];
genres.forEach((genre) => {
  for (let i = 0; i < 20; i++) {
    boxData.push({
      genre: genre,
      value: Math.random() * 50 + Math.random() * 30,
    });
  }
});

const app = document.getElementById("app");

// 1. Top Bar Chart (Intersection Size)
const topBarChart = new Chart({
  data: topBarData,
  mark: "bar",
  encoding: {
    x: "id",
    y: "size",
  },
  height: 200,
  color: "black", // Black bars
  showLabels: true, // Show numbers on top
  yAxisName: "Intersection Size",
});

// 2. Matrix (Intersections)
const matrixChart = new Chart({
  data: intersections,
  mark: "matrix",
  encoding: {
    x: "id",
    y: "sets",
    yDomain: genres, // Enforce specific order
  },
  width: 600,
  height: 300,
  stripe: true, // Enable background stripes
});

// 3. Left Bar Chart (Set Size)
const leftBarChart = new Chart({
  data: setSizeData,
  mark: "bar",
  encoding: {
    x: "size", // Value
    y: "genre", // Category
  },
  width: 100,
  direction: "horizontal",
  yAxisPos: "right",
  color: "black",
  showLabels: true,
  showXAxis: false,
  yAxisName: "Set Size",
});

// 4. Box Plot (right of matrix)
const boxChart = new Chart({
  data: boxData,
  mark: "box",
  encoding: {
    x: "value",
    y: "genre",
    yDomain: genres,
  },
  width: 200,
  direction: "horizontal",
  color: "black",
  xAxisName: "Value",
  showYAxis: false,
});

// Build composite layout: Top Bar above Matrix, Left Bar left of Matrix, Box Plot right of Matrix
const topAndMatrix = stackY([topBarChart, matrixChart]);
const leftAndCenter = stackX([leftBarChart, topAndMatrix]);
const myComposite = stackX([leftAndCenter, boxChart]);

myComposite.render(app);
