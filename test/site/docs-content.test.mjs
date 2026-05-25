import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { docsCards, docsNavItems } from "../../site/src/data/docs.js";

const root = process.cwd();
const docsRoot = path.resolve(root, "site/src/pages/docs");

const pagePath = (name) => path.join(docsRoot, name);
const readPage = (name) => readFileSync(pagePath(name), "utf8");

{
  const navLabels = docsNavItems.map((item) => item.label);

  [
    "Overview",
    "Getting Started",
    "Concepts",
    "API",
    "Marks",
    "Patterns",
  ].forEach((label) => {
    assert.ok(navLabels.includes(label), `Docs nav should include ${label}`);
  });
}

{
  [
    "getting-started.astro",
    "patterns.astro",
    "index.astro",
    "concepts.astro",
    "api.astro",
    "marks.astro",
  ].forEach((filename) => {
    assert.ok(existsSync(pagePath(filename)), `${filename} should exist`);
  });
}

{
  docsCards.forEach((card) => {
    assert.ok(card.href, `${card.label} should have a docs card href`);
    assert.ok(card.label, "Docs cards should have labels");
    assert.ok(card.summary, `${card.label} should have a docs card summary`);
    assert.doesNotMatch(
      card.label,
      /placeholder/i,
      `${card.label} should not use placeholder copy`,
    );
  });
}

{
  ["index.astro", "concepts.astro", "api.astro"].forEach((filename) => {
    assert.doesNotMatch(
      readPage(filename),
      /placeholder/i,
      `${filename} should not contain placeholder copy`,
    );
  });
}

{
  const gettingStarted = readPage("getting-started.astro");

  assert.ok(
    gettingStarted.includes("pnpm add composite-js"),
    "Getting Started should document package installation",
  );
  assert.ok(
    gettingStarted.includes('from "composite-js"'),
    "Getting Started should import from the package entry",
  );
}

{
  const api = readPage("api.astro");

  [
    "chart(",
    "stackX(",
    "stackY(",
    "repeatX(",
    "repeatY(",
    "repeat(",
    "embed(",
    "sequenceContainer(",
    "text(",
    "image(",
    "frame(",
    ".render(",
    ".export(",
  ].forEach((apiName) => {
    assert.ok(api.includes(apiName), `API docs should mention ${apiName}`);
  });
}
