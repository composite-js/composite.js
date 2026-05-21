// System: DropoutSeer
// Title: DropoutSeer: Visualizing learning patterns in Massive Open Online Courses for dropout reasoning and prediction
// Authors: Yuanzhe Chen, Qing Chen, Mingqian Zhao, Sebastien Boyer, Kalyan Veeramachaneni, and Huamin Qu
// Link: https://ieeexplore.ieee.org/document/7883517

import {
  chart,
  embed,
  repeat,
  sequenceContainer,
  stackX,
} from "../src/index.js";

const weeks = Array.from({ length: 10 }, (_, index) => index);
const groups = [
  { id: "steady", size: 4, dropoutStart: 10 },
  { id: "early-risk", size: 4, dropoutStart: 5 },
  { id: "mid-risk", size: 4, dropoutStart: 3 },
  { id: "recovering", size: 4, dropoutStart: 7 },
];
const activityTypes = ["video", "quiz", "forum", "assignment"];
const colors = ["#89d4c9", "#f7ea57", "#f47f6b", "#2f77b4"];

const rows = groups.flatMap((group, groupIndex) =>
  Array.from({ length: group.size }, (_, rowIndex) => {
    const absoluteIndex = groupIndex * group.size + rowIndex;
    return {
      id: `${group.id}-${rowIndex + 1}`,
      group: group.id,
      dropoutWeek:
        group.dropoutStart === 10
          ? 10
          : Math.min(9, group.dropoutStart + ((rowIndex + groupIndex) % 3)),
      index: absoluteIndex,
    };
  }),
);

function activityMix(row, week) {
  return activityTypes.map((type, typeIndex) => ({
    category: type,
    value: 2 + (((row.index + 1) * (week + 2) * (typeIndex + 3)) % 9),
  }));
}

const sequenceRecords = rows.flatMap((row) =>
  weeks
    .filter((week) => week <= row.dropoutWeek)
    .map((week) => ({
      id: `${row.id}-${week}`,
      learner: row.id,
      week,
      mix: activityMix(row, week),
    })),
);

const missing = rows.flatMap((row) =>
  weeks
    .filter((week) => week > row.dropoutWeek)
    .map((week) => ({ learner: row.id, week })),
);

const events = rows
  .filter((row) => row.dropoutWeek < 9)
  .map((row) => ({ learner: row.id, week: row.dropoutWeek, type: "dropout" }));

const dates = [
  "Jun 22",
  "Jun 29",
  "Jul 06",
  "Jul 13",
  "Jul 20",
  "Jul 27",
  "Aug 03",
  "Aug 10",
  "Aug 17",
  "Aug 24",
  "Aug 31",
  "Sep 07",
  "Sep 14",
  "Sep 21",
  "Sep 28",
];

const flowData = rows.flatMap((row) =>
  dates.map((date, dateIndex) => ({
    learner: row.id,
    date,
    count:
      row.dropoutWeek <= dateIndex % weeks.length
        ? 1 + ((row.index + dateIndex) % 4)
        : 0.6 + (((row.index + 1) * (dateIndex + 2)) % 5),
  })),
);

const barSegments = ["active", "at-risk", "dropout"];
const barData = dates.flatMap((date, dateIndex) =>
  barSegments.map((segment, segmentIndex) => ({
    date,
    segment,
    count:
      segment === "active"
        ? Math.max(2, 38 - dateIndex * 2 + (dateIndex % 3) * 8)
        : segment === "at-risk"
          ? 10 + (((dateIndex + 2) * 7) % 24)
          : 4 + (((dateIndex + segmentIndex) * 5) % 18),
  })),
);

const sequence = embed(
  sequenceContainer({
    width: 700,
    height: 640,
    xDomain: weeks,
    yDomain: rows.map((row) => row.id),
    tracks: rows.map((row) => row.id),
    missing,
    events,
    trackColor: "#a9a9a9",
    missingColor: "#8b8b8b",
  }),
  repeat(sequenceRecords, (record) =>
    chart({
      mark: "pie",
      width: 28,
      height: 28,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      data: record.mix,
      encoding: { value: "value", category: "category" },
      colorScheme: colors,
      innerRadius: 8,
    }),
  ),
  { x: "week", y: "learner", key: "id", width: 28, height: 28 },
);

const flow = chart({
  mark: "flow",
  width: 280,
  height: 640,
  margin: { top: 0, right: 0, bottom: 0, left: 0 },
  data: flowData,
  encoding: { source: "learner", target: "date", value: "count" },
  sourceDomain: rows.map((row) => row.id),
  targetDomain: dates,
  color: "#f2ad73",
  opacity: 0.12,
  minStrokeWidth: 0.35,
  maxStrokeWidth: 5,
});

const bars = chart({
  mark: "stackbar",
  width: 230,
  height: 640,
  margin: { top: 26, right: 20, bottom: 20, left: 58 },
  data: barData,
  direction: "horizontal",
  encoding: { x: "count", y: "date", stack: "segment" },
  colorScheme: ["#2d6fa8", "#2fb5c4", "#cdebdc"],
  xAxisPos: "top",
  xAxisName: "",
  showLabels: false,
});

export function createExample() {
  return stackX([sequence, flow, bars]);
}

function applyExampleStyle() {
  const style = document.createElement("style");
  style.textContent = `
    body {
      margin: 0;
      font-family: Georgia, "Times New Roman", serif;
      background: #fff;
    }

    #app {
      padding: 18px 24px;
    }
  `;
  document.head.appendChild(style);
}

if (typeof document !== "undefined") {
  applyExampleStyle();
  createExample().render(document.getElementById("app"));
}
