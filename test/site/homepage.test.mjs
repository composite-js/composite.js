import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { navItems } from "../../site/src/data/nav.js";

{
  const githubItem = navItems.find((item) => item.label === "GitHub");

  assert.ok(githubItem, "Primary navigation should include a GitHub link");
  assert.equal(githubItem.href, "https://github.com/shenzhiy21/composite.js");
  assert.equal(githubItem.external, true);
}

{
  const homepagePath = path.resolve(
    process.cwd(),
    "site/src/pages/index.astro",
  );
  const homepageSource = readFileSync(homepagePath, "utf8");

  [
    "Describe charts. Compose their relationships.",
    "Automatic layout",
    "Optional overrides",
    "Get started",
    "View examples",
    "stackX",
    "repeatX",
  ].forEach((expectedText) => {
    assert.ok(
      homepageSource.includes(expectedText),
      `Homepage should include actual content: ${expectedText}`,
    );
  });

  assert.match(
    homepageSource,
    /import\s*\{\s*featuredExamples\s*\}\s*from\s*"\.\.\/data\/examples\.js"/,
    "Homepage should import the curated featured examples list",
  );
  assert.ok(
    homepageSource.includes("<ExampleGrid examples={featuredExamples} />"),
    "Homepage should render featured examples instead of the full gallery",
  );
  assert.ok(
    !homepageSource.includes("<ExampleGrid examples={examples} />"),
    "Homepage should not render every registered example",
  );
}
