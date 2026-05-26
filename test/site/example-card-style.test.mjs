import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const cardPath = path.resolve(
  process.cwd(),
  "site/src/components/ExampleCard.astro",
);
const stylesheetPath = path.resolve(
  process.cwd(),
  "site/src/styles/global.css",
);
const cardSource = readFileSync(cardPath, "utf8");
const stylesheetSource = readFileSync(stylesheetPath, "utf8");
const previewRuleMatch = stylesheetSource.match(
  /\.example-card__preview\s*\{(?<body>[^}]*)\}/,
);
const previewIframeRuleMatch = stylesheetSource.match(
  /\.example-card__preview iframe\s*\{(?<body>[^}]*)\}/,
);

assert.ok(
  cardSource.includes("preview-runner/?example="),
  "Example cards should point their previews at the live preview runner",
);
assert.ok(
  cardSource.includes("<iframe"),
  "Example cards should render live preview iframes",
);
assert.ok(
  cardSource.includes('loading="lazy"'),
  "Example card preview iframes should lazy-load",
);
assert.ok(
  cardSource.includes('sandbox="allow-scripts allow-same-origin"'),
  "Example card preview iframes should use the expected sandbox permissions",
);
assert.ok(
  !cardSource.includes("<img"),
  "Example cards should not render static image previews",
);
assert.ok(
  !cardSource.includes('<a class="example-card"'),
  "Example cards should not wrap the preview iframe inside the card link",
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
assert.ok(
  previewIframeRuleMatch?.groups?.body,
  "Example card preview iframes should have a CSS rule",
);
assert.match(
  previewIframeRuleMatch.groups.body,
  /pointer-events:\s*none;/,
  "Example card preview iframes should not intercept card clicks",
);
