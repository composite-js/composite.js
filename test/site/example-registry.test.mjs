import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import path from "node:path";
import { examples } from "../../site/src/data/examples.js";

const examplesDir = path.join(process.cwd(), "examples");
const exampleSources = readdirSync(examplesDir)
  .filter((file) => file.endsWith(".js"))
  .map((file) => path.basename(file, ".js"))
  .sort();
const siteSources = examples.map((example) => example.source || example.slug);
const uniqueSiteSources = [...new Set(siteSources)].sort();

{
  const duplicates = siteSources
    .filter((source, index) => siteSources.indexOf(source) !== index)
    .sort();

  assert.deepEqual(
    duplicates,
    [],
    "site examples should not duplicate sources",
  );
}

{
  const missing = exampleSources.filter(
    (source) => !uniqueSiteSources.includes(source),
  );

  assert.deepEqual(
    missing,
    [],
    "site examples should include every examples/*.js source",
  );
}

{
  const extra = uniqueSiteSources.filter(
    (source) => !exampleSources.includes(source),
  );

  assert.deepEqual(
    extra,
    [],
    "site examples should only reference existing examples/*.js sources",
  );
}
