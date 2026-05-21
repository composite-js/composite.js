import path from "node:path";
import { pathToFileURL } from "node:url";
import { examples } from "../site/src/data/examples.js";

const outputDir = path.resolve(process.cwd(), "site", "public", "examples");
const formats = ["svg", "png"];

async function loadExample(example) {
  const source = example.source || example.slug;
  const moduleUrl = pathToFileURL(
    path.resolve(process.cwd(), "examples", `${source}.js`),
  ).href;
  const module = await import(moduleUrl);

  if (typeof module.createExample !== "function") {
    throw new Error(`examples/${source}.js must export createExample().`);
  }

  return module.createExample();
}

for (const example of examples) {
  const node = await loadExample(example);

  for (const format of formats) {
    const outputPath = path.join(outputDir, `${example.slug}.${format}`);
    await node.export({ format, path: outputPath });
    console.log(`Exported ${path.relative(process.cwd(), outputPath)}`);
  }
}
