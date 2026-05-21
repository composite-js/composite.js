import { existsSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { spawn } from "node:child_process";

export function parseDevArgs(argv) {
  const passthrough = [];
  let example = "upset";

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === "--example") {
      example = argv[i + 1] || "upset";
      i += 1;
      continue;
    }

    if (arg.startsWith("--example=")) {
      example = arg.slice("--example=".length) || "upset";
      continue;
    }

    passthrough.push(arg);
  }

  return { example, passthrough };
}

export function parseExampleName(argv) {
  return parseDevArgs(argv).example;
}

export function resolveExamplePath(example, options = {}) {
  if (!/^[a-zA-Z0-9_-]+$/.test(example)) {
    throw new Error(`Invalid example name: ${example}`);
  }

  const cwd = options.cwd || process.cwd();
  const examplePath = path.resolve(cwd, "examples", `${example}.js`);

  if (!existsSync(examplePath)) {
    throw new Error(`Example not found: ${example}`);
  }

  return examplePath;
}

export function run(argv = process.argv.slice(2), options = {}) {
  const cwd = options.cwd || process.cwd();
  const { example, passthrough } = parseDevArgs(argv);
  resolveExamplePath(example, { cwd });

  const viteBin = path.resolve(
    cwd,
    "node_modules",
    ".bin",
    process.platform === "win32" ? "vite.CMD" : "vite",
  );

  const child = spawn(viteBin, passthrough, {
    cwd,
    env: { ...process.env, COMPOSITE_EXAMPLE: example },
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code ?? 0);
  });
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  run();
}
