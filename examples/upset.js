import {
  chart,
  loadCsvText,
  parseCsv,
  repeatX,
  stackX,
  stackY,
} from "../src/index.js";

const datasetUrls = {
  intersections: new URL("./dataset/upset/intersections.csv", import.meta.url),
  boxes: new URL("./dataset/upset/boxes.csv", import.meta.url),
  stacks: new URL("./dataset/upset/stacks.csv", import.meta.url),
  pies: new URL("./dataset/upset/pies.csv", import.meta.url),
};

function buildView({ intersections: rows, boxes, stacks, pies }) {
  const intersections = rows.map((row) => ({
    ...row,
    sets: row.sets.split("|"),
  }));
  const genres = intersections
    .filter((row) => row.sets.length === 1)
    .map((row) => row.sets[0]);
  const topBarData = intersections.map((row) => ({
    id: row.id,
    size: row.intersectionSize,
  }));
  const matrixData = intersections.flatMap((row) =>
    genres.map((genre) => ({
      id: row.id,
      genre,
      active: row.sets.includes(genre),
    })),
  );
  const setSizeData = genres.map((genre) => ({
    genre,
    size: intersections.find(
      (row) => row.sets.length === 1 && row.sets[0] === genre,
    ).setSize,
  }));

  const topBarChart = chart({
    data: topBarData,
    mark: "bar",
    encoding: { x: "id", y: "size" },
    height: 200,
    color: "black",
    showLabels: true,
    yAxisName: "Intersection Size",
  });

  const matrixChart = chart({
    data: matrixData,
    mark: "matrix",
    encoding: {
      x: "id",
      group: "genre",
      y: "active",
      groupDomain: genres,
    },
    width: 600,
    height: 300,
    stripe: true,
  });

  const leftBarChart = chart({
    data: setSizeData,
    mark: "bar",
    encoding: { x: "size", y: "genre" },
    width: 100,
    yAxisPos: "right",
    color: "black",
    showLabels: true,
    showXAxis: false,
    yAxisName: "Set Size",
    paddingInner: 0.3,
  });

  const boxChart = chart({
    data: boxes,
    mark: "box",
    encoding: { x: "value", y: "genre", yDomain: genres },
    width: 200,
    color: "black",
    xAxisName: "Value",
    showYAxis: false,
  });

  const stackBarChart = chart({
    data: stacks,
    mark: "stackbar",
    encoding: { x: "count", y: "genre", group: "type" },
    width: 150,
    showLabels: false,
    xAxisName: "Count",
    showYAxis: false,
    markStyle: "sketch",
  });

  const pieRow = repeatX(
    intersections.map((row) => row.id),
    (id) =>
      chart({
        data: pies.filter((row) => row.id === id),
        mark: "pie",
        encoding: { x: "category", y: "value" },
        width: 40,
        height: 40,
        markStyle: "sketch",
        showLabels: false,
      }),
  );

  const composite = stackX(
    [leftBarChart, matrixChart, boxChart, stackBarChart],
    { margin: 5 },
  );
  return stackY([topBarChart, composite, pieRow], {
    align: [null, matrixChart, null],
  });
}

export async function createExample() {
  const [intersections, boxes, stacks, pies] = await Promise.all(
    Object.values(datasetUrls).map(async (url) =>
      parseCsv(await loadCsvText(url)),
    ),
  );

  return buildView({ intersections, boxes, stacks, pies });
}

if (typeof document !== "undefined") {
  createExample().then((view) => {
    view.render(document.getElementById("app"));
  });
}
