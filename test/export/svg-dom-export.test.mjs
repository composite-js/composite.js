import assert from "node:assert/strict";
import { chart, text } from "../../src/index.js";
import { withExportSvgDocument } from "../../src/export/svg-dom.js";

{
  const previousDocument = globalThis.document;
  const previousSVGElement = globalThis.SVGElement;
  const previousWindow = globalThis.window;

  await assert.rejects(
    () =>
      withExportSvgDocument(() => {
        throw new Error("intentional export document failure");
      }),
    /intentional export document failure/,
  );

  assert.equal(globalThis.document, previousDocument);
  assert.equal(globalThis.SVGElement, previousSVGElement);
  assert.equal(globalThis.window, previousWindow);
}

{
  const label = text({
    text: "A & <B>",
    title: "Details & <more>",
    width: 80,
    height: 24,
  });
  const svg = await label.export({ format: "svg" });

  assert.ok(svg.includes("A &amp; &lt;B&gt;"));
  assert.ok(svg.includes("Details &amp; &lt;more&gt;"));
}

{
  const pie = chart({
    mark: "pie",
    data: [
      { category: "A", value: 1 },
      { category: "B", value: 2 },
    ],
    encoding: { x: "category", y: "value" },
    width: 80,
    height: 80,
  });
  const svg = await pie.export({ format: "svg" });

  assert.match(
    svg,
    /stroke-width/,
    "serialized SVG should preserve style() declarations used by marks",
  );
}
