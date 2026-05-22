import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { docsNavItems } from "../../site/src/data/docs.js";
import { MARK_DEFINITIONS } from "../../src/mark/validation.js";

const marksNavItem = docsNavItems.find((item) => item.href === "/docs/marks/");
const markNames = Object.keys(MARK_DEFINITIONS);

assert.ok(marksNavItem, "Documentation navigation should include Marks");
assert.deepEqual(
  marksNavItem.children?.map((item) => item.label),
  markNames,
  "Marks navigation should include every supported mark as child links",
);
assert.deepEqual(
  marksNavItem.children?.map((item) => item.href),
  markNames.map((mark) => `/docs/marks/#${mark}`),
  "Marks navigation child links should target mark anchors",
);

const docsNavPath = path.resolve(
  process.cwd(),
  "site/src/components/DocsNav.astro",
);
const docsNavSource = readFileSync(docsNavPath, "utf8");

assert.ok(
  docsNavSource.includes("docs-nav__children"),
  "DocsNav should render nested navigation links",
);
assert.ok(
  docsNavSource.includes("item.children"),
  "DocsNav should read child navigation items",
);
