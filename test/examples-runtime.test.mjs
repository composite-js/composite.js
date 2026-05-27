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
    }
  });
}
