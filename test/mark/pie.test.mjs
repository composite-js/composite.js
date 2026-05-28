import assert from "node:assert/strict";
import { PieChartRenderer } from "../../src/mark/pie.js";
import { createFakeSvg } from "../helpers/fake-svg.mjs";

{
  const svg = createFakeSvg();
  const renderer = new PieChartRenderer({
    width: 100,
    height: 100,
    encoding: { x: "category", y: "value" },
    colorScheme: ["red", "blue"],
    showLabels: true,
  });

  const axisConfig = renderer.render(svg, [
    { category: "A", value: 1 },
    { category: "B", value: 2 },
  ]);

  const paths = svg.querySelectorAll("path");
  assert.equal(axisConfig, null);
  assert.equal(paths.length, 2);
  assert.equal(paths[0].getAttribute("fill"), "red");
  assert.equal(paths[1].getAttribute("fill"), "blue");
  assert.equal(paths[0].style.getPropertyValue("stroke-width"), "2px");
  assert.deepEqual(
    svg.querySelectorAll("text").map((text) => text.textContent),
    ["A", "B"],
  );
}

{
  const svg = createFakeSvg();
  const renderer = new PieChartRenderer({
    width: 100,
    height: 100,
    encoding: { x: "category", y: "value" },
  });

  renderer.render(svg, [
    { category: "A", value: 1 },
    { category: "B", value: 2 },
  ]);

  assert.equal(svg.querySelectorAll("path").length, 2);
  assert.equal(svg.querySelectorAll("text").length, 0);
}

{
  const svg = createFakeSvg();
  const renderer = new PieChartRenderer({
    width: 100,
    height: 100,
    innerRadius: 18,
    encoding: { x: "category", y: "value" },
  });

  renderer.render(svg, [
    { category: "A", value: 1 },
    { category: "B", value: 1 },
  ]);

  const firstPath = svg.querySelectorAll("path")[0].getAttribute("d");
  assert.match(firstPath, /A18,18/);
}

{
  const svg = createFakeSvg();
  const renderer = new PieChartRenderer({
    width: 100,
    height: 100,
    mark: "pie",
    markStyle: "rounded",
    innerRadius: 18,
    encoding: { x: "category", y: "value" },
  });

  renderer.render(svg, [
    { category: "A", value: 1 },
    { category: "B", value: 1 },
  ]);

  const paths = svg.querySelectorAll("path");
  assert.equal(paths.length, 2);
  assert.equal(paths[0].getAttribute("stroke-linejoin"), "round");
  assert.equal(paths[0].getAttribute("stroke-linecap"), "round");
}

{
  const svg = createFakeSvg();
  const renderer = new PieChartRenderer({
    width: 100,
    height: 100,
    mark: "pie",
    markStyle: "sketch",
    encoding: { x: "category", y: "value" },
  });

  renderer.render(svg, [
    { category: "A", value: 1 },
    { category: "B", value: 1 },
  ]);

  const sketchGroups = svg
    .querySelectorAll("g")
    .filter((node) => node.getAttribute("data-mark-style") === "sketch");
  const paths = svg.querySelectorAll("path");
  assert.equal(sketchGroups.length, 2);
  assert.ok(paths.length > 2);
  assert.match(
    sketchGroups[0].querySelectorAll("path")[0].getAttribute("d"),
    /[MLA]/,
  );
}

{
  const svg = createFakeSvg();
  const styleOptions = {};
  const contexts = [];
  const renderer = new PieChartRenderer({
    width: 100,
    height: 100,
    mark: "pie",
    markStyle: {
      type: "rounded",
      options: styleOptions,
      sector(context) {
        contexts.push(context);
        return context.container
          .append("path")
          .attr("d", "M0,0")
          .attr("data-role", context.role);
      },
    },
    encoding: { x: "category", y: "value" },
  });
  const datum = { category: "A", value: 1 };

  renderer.render(svg, [datum]);

  assert.equal(contexts.length, 1);
  assert.equal(contexts[0].container.node().tagName, "g");
  assert.equal(contexts[0].datum, datum);
  assert.equal(contexts[0].arcDatum.data, datum);
  assert.equal(contexts[0].value, 1);
  assert.equal(contexts[0].category, "A");
  assert.equal(contexts[0].innerRadius, 0);
  assert.equal(contexts[0].outerRadius, 50);
  assert.equal(contexts[0].role, "sector");
  assert.equal(contexts[0].mark, "pie");
  assert.equal(contexts[0].encoding, renderer.encoding);
  assert.equal(contexts[0].styleOptions, styleOptions);
  assert.equal(
    svg.querySelectorAll("path")[0].getAttribute("data-role"),
    "sector",
  );
}
