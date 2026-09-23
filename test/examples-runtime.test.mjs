import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { isLayoutNode } from "../src/index.js";
import { withFakeSvgDocument } from "./helpers/fake-svg.mjs";

const examplesDir = path.join(process.cwd(), "examples");
const exampleFiles = readdirSync(examplesDir)
  .filter((file) => file.endsWith(".js"))
  .sort();

assert.ok(exampleFiles.includes("country.js"), "country example should exist");
assert.ok(
  !exampleFiles.includes("houseprices.js"),
  "houseprices example should be removed",
);
assert.ok(
  exampleFiles.includes("scatterplotmatrix.js"),
  "scatterplotmatrix example should exist",
);

for (const file of exampleFiles) {
  const moduleUrl = pathToFileURL(path.join(examplesDir, file)).href;
  const module = await import(moduleUrl);

  assert.equal(
    typeof module.createExample,
    "function",
    `${file} should export createExample()`,
  );

  const node = await Promise.resolve(module.createExample());
  assert.ok(isLayoutNode(node), `${file} should create a layout node`);

  if (file === "scatterplotmatrix.js") {
    assert.equal(
      node.repeated.shareDomains,
      false,
      "scatterplot-matrix should not share domains across different variables",
    );
  }

  await withFakeSvgDocument(async (document) => {
    const container = document.createElement("div");
    node.render(container);

    const svg = container.firstElementChild;
    assert.equal(svg?.tagName, "svg", `${file} should render an SVG element`);

    if (file === "country.js") {
      const flagUrls = svg
        .querySelectorAll("image")
        .map((image) => image.getAttribute("href"));

      assert.ok(flagUrls.length > 0, "country should render flag images");
      assert.ok(
        flagUrls.includes(
          "https://kapowaz.github.io/circle-flags/flags/us.svg",
        ),
        "country should use circle-flags flag artwork",
      );
      assert.ok(
        flagUrls.every((url) => !url?.startsWith("https://flagcdn.com/")),
        "country should not use rectangular FlagCDN artwork",
      );
      assert.ok(
        svg.querySelectorAll("circle").length > 0,
        "country should render PAC circles",
      );
      assert.equal(
        svg.querySelectorAll(".stack-link").length,
        6,
        "country should link bars to PAC circles",
      );
    }

    if (file === "scatterplotmatrix.js") {
      const labels = svg
        .querySelectorAll("text")
        .map((text) => text.textContent);

      assert.ok(
        svg.querySelectorAll("circle").length > 0,
        "scatterplot-matrix should render scatter plot points",
      );
      assert.ok(
        svg.querySelectorAll(".embed").length > 0,
        "scatterplot-matrix should use an embedded grid layout",
      );
      assert.ok(
        labels.includes("Sepal length"),
        "scatterplot-matrix should render variable labels",
      );
      assert.equal(
        labels.filter((label) => label === "Sepal length").length,
        1,
        "scatterplot-matrix should only render each variable label once",
      );
    }

    if (file === "mediafears.js") {
      const labels = svg
        .querySelectorAll("text")
        .map((text) => text.textContent);

      assert.equal(
        svg.querySelectorAll(".wrapper").length,
        13,
        "media-fears should render one framed area lane per topic",
      );
      assert.equal(
        svg.querySelectorAll(".media-fears-timeline-axis").length,
        1,
        "media-fears should render one shared timeline axis",
      );
      assert.ok(
        labels.includes("ZIKA") && labels.includes("MILLENNIUM BUG"),
        "media-fears should label the repeated topic lanes",
      );
      assert.ok(
        labels.includes("Intensity") && labels.includes("Nov 2021"),
        "media-fears should label its shared axes",
      );
    }

    if (file === "overlay.js") {
      const labels = svg
        .querySelectorAll("text")
        .map((text) => text.textContent);

      assert.equal(
        svg.querySelectorAll(".overlay").length,
        1,
        "overlay example should share one plot rectangle",
      );
      assert.equal(
        svg.querySelectorAll(".line-series").length,
        3,
        "overlay example should render three line series",
      );
      assert.ok(
        labels.includes("Base %") && labels.includes("Total XA"),
        "overlay example should render its color legend",
      );
    }
  });
}
