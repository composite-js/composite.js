import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const stylesheetPath = path.resolve(
  process.cwd(),
  "site/src/styles/global.css",
);
const stylesheetSource = readFileSync(stylesheetPath, "utf8");
const previewRuleMatch = stylesheetSource.match(
  /\.example-card__preview\s*\{(?<body>[^}]*)\}/,
);

assert.ok(
  previewRuleMatch?.groups?.body,
  "Example card previews should have a CSS rule",
);

const previewRuleBody = previewRuleMatch.groups.body;

assert.ok(
  !previewRuleBody.includes("linear-gradient"),
  "Example card previews should not use a grid gradient background",
);
assert.ok(
  !previewRuleBody.includes("background-size"),
  "Example card previews should not size a grid background pattern",
);
