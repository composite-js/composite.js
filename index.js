import { createChart } from "./src/chart.js";
import { composite, stackX, stackY } from "./src/layout.js";

// Data for the UpSet plot (Movie Genres)
// Based on the image provided:
// Top bar chart: Intersection Size
// Left bar chart: Set Size
// Matrix: Intersections

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

// We need to process this data to fit our marks.
// 1. Top Bar Chart: x=Intersection ID (or combination), y=Intersection Size
// 2. Matrix: x=Intersection ID, y=Genre
// 3. Left Bar Chart: x=Set Size, y=Genre

// Let's define the genres in the order shown in the image (top to bottom)
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

// Let's create "intersections" data for the top bar and matrix
// We'll just use the index as the ID for simplicity in the x-axis
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
// We need a point for each (Intersection, Genre) pair
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
// This is just the total size of each genre
const setSizeData = genres.map((genre) => {
  // Find the entry in original data that corresponds to just this single set
  // Or we can just use the provided setSize if available
  const entry = data.find((d) => d.sets.length === 1 && d.sets[0] === genre);
  return {
    genre: genre,
    size: entry ? entry.setSize : 0,
  };
});

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
const topBarChart = createChart({
  data: topBarData,
  mark: "bar",
  encoding: {
    x: "id",
    y: "size",
  },
  width: 600,
  height: 200,
  color: "black", // Black bars
  showLabels: true, // Show numbers on top
  yAxisName: "Intersection Size",
});

// 2. Matrix (Intersections)
const matrixChart = createChart({
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
const leftBarChart = createChart({
  data: setSizeData,
  mark: "bar",
  encoding: {
    x: "size", // Value
    y: "genre", // Category
  },
  width: 250,
  height: 300,
  direction: "horizontal",
  yAxisPos: "right",
  color: "black",
  showLabels: true,
  showXAxis: false,
  yAxisName: "Set Size",
});

// 4. Box Plot (right of matrix)
const boxChart = createChart({
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

const myComposite = composite(
  [topBarChart, leftBarChart, matrixChart, boxChart],
  {
    constraints: [
      stackY([topBarChart, matrixChart]), // Top Bar above Matrix
      stackX([leftBarChart, matrixChart]), // Left Bar left of Matrix
      stackX([matrixChart, boxChart]), // Box Plot right of Matrix
    ],
  },
);

myComposite.render(app);
