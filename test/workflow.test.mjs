import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const packageJson = JSON.parse(
  readFileSync(path.join(process.cwd(), "package.json"), "utf8"),
);

assert.equal(
  packageJson.scripts["format:check"],
  "prettier --check .",
  "package scripts should include a non-mutating formatting check",
);
assert.equal(
  packageJson.scripts.check,
  "pnpm run lint && pnpm run test && pnpm run build && pnpm run test:dist && pnpm run test:pack",
  "package scripts should include the library check sequence",
);
assert.equal(
  packageJson.scripts["check:site"],
  "pnpm run site:build",
  "package scripts should include a site build check",
);

const ciPath = path.join(process.cwd(), ".github", "workflows", "ci.yml");
assert.ok(existsSync(ciPath), "GitHub Actions CI workflow should exist");

const ci = readFileSync(ciPath, "utf8");
assert.match(ci, /^name: CI$/m);
assert.match(ci, /\bpnpm\/action-setup@v4\b/);
assert.match(ci, /\bactions\/setup-node@v4\b/);
assert.match(ci, /pnpm install --frozen-lockfile/);
assert.match(ci, /pnpm run format:check/);
assert.match(ci, /pnpm run check$/m);
assert.match(ci, /pnpm run check:site/);

for (const [hookName, expectedCommands] of [
  ["pre-commit", ["pnpm run format:check", "pnpm run lint"]],
  [
    "pre-push",
    ["pnpm run format:check", "pnpm run check", "pnpm run check:site"],
  ],
]) {
  const hookPath = path.join(process.cwd(), ".githooks", hookName);
  assert.ok(existsSync(hookPath), `.githooks/${hookName} should exist`);

  const hook = readFileSync(hookPath, "utf8");
  assert.ok(
    hook.startsWith("#!/bin/sh\n"),
    `.githooks/${hookName} should be a POSIX shell script`,
  );

  for (const command of expectedCommands) {
    assert.match(hook, new RegExp(command.replaceAll(" ", "\\s+")));
  }
}

const readme = readFileSync(path.join(process.cwd(), "README.md"), "utf8");
assert.match(readme, /git config core\.hooksPath \.githooks/);
