import { chart, repeatX, stackX, stackY } from "../src/index.js";

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

// Box Plot Data
const boxData = [];
genres.forEach((genre, genreIndex) => {
  for (let i = 0; i < 20; i++) {
    boxData.push({
      genre: genre,
      value: 18 + genreIndex * 3 + ((i * 7 + genreIndex * 5) % 31),
    });
  }
});

// Stack Bar Chart Data
const stackBarData = [];
const types = ["Type A", "Type B", "Type C"];
genres.forEach((genre, genreIndex) => {
  types.forEach((type, typeIndex) => {
    stackBarData.push({
      genre: genre,
      type: type,
      count: 5 + (((genreIndex + 1) * (typeIndex + 2) * 3) % 20),
    });
  });
});

// 1. Top Bar Chart (Intersection Size)
const topBarChart = chart({
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
const matrixChart = chart({
  data: matrixData,
  mark: "matrix",
  encoding: {
    x: "id",
    group: "genre",
    y: "active",
    groupDomain: genres, // Enforce specific order
  },
  width: 600,
  height: 300,
  stripe: true, // Enable background stripes
});

// 3. Left Bar Chart (Set Size)
const leftBarChart = chart({
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
  paddingInner: 0.3,
});

// 4. Box Plot (right of matrix)
const boxChart = chart({
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

// 5. Horizontal Stack Bar Chart (right of box plot)
const stackBarChart = chart({
  data: stackBarData,
  mark: "stackbar",
  encoding: {
    x: "count",
    y: "genre",
    group: "type",
  },
  width: 150,
  direction: "horizontal",
  showLabels: false,
  xAxisName: "Count",
  showYAxis: false,
});

// 6. Pie Chart Row (below Matrix)
// Create fake data for pie charts
const pieDataMap = {};
intersections.forEach((d, index) => {
  pieDataMap[d.id] = [
    { category: "A", value: 4 + ((index * 3) % 10) },
    { category: "B", value: 3 + ((index * 5) % 9) },
    { category: "C", value: 2 + ((index * 7) % 8) },
  ];
});

const pieRow = repeatX(
  intersections.map((d) => d.id),
  (id) => {
    return chart({
      data: pieDataMap[id],
      mark: "pie",
      encoding: {
        x: "category",
        y: "value",
      },
      width: 40,
      height: 40,
      showLabels: false,
    });
  },
);

const composite = stackX([leftBarChart, matrixChart, boxChart, stackBarChart]);
const final = stackY([topBarChart, composite, pieRow], {
  align: [null, matrixChart, null],
});

export function createExample() {
  return final;
}

if (typeof document !== "undefined") {
  createExample().render(document.getElementById("app"));
}
