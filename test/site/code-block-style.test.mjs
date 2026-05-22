import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const stylesheetPath = path.resolve(
  process.cwd(),
  "site/src/styles/global.css",
);
const stylesheetSource = readFileSync(stylesheetPath, "utf8");

function ruleBody(selector) {
  const escapedSelector = selector.replaceAll(".", "\\.");
  const match = stylesheetSource.match(
    new RegExp(`${escapedSelector}\\s*\\{(?<body>[^}]*)\\}`),
  );

  assert.ok(match?.groups?.body, `${selector} should have a CSS rule`);
  return match.groups.body;
}

[".code-panel", ".docs-code"].forEach((selector) => {
  const body = ruleBody(selector);

  assert.match(
    body,
    /background:\s*#ffffff;/,
    `${selector} should use a white background`,
  );
  assert.ok(
    !body.includes("background: #101827"),
    `${selector} should not use the old dark background`,
  );
});
