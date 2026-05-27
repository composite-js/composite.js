import path from "node:path";
import { pathToFileURL } from "node:url";
import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { examples } from "../site/src/data/examples.js";

const defaultOutputDir = path.resolve(
  process.cwd(),
  "site",
  "public",
  "examples",
);
const defaultExamplesDir = path.resolve(process.cwd(), "examples");
const defaultSnippetDir = path.resolve(
  process.cwd(),
  "site",
  "src",
  "data",
  "example-snippets",
);

function stripImports(source) {
  return source.replace(/^\s*import[\s\S]*?;\s*/gm, "");
}

function findMatchingBrace(source, openBraceIndex) {
  let depth = 0;
  let quote = "";
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (let index = openBraceIndex; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];

    if (lineComment) {
      if (char === "\n") lineComment = false;
      continue;
    }

    if (blockComment) {
      if (char === "*" && next === "/") {
        blockComment = false;
        index += 1;
      }
      continue;
    }

    if (quote) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === "\\") {
        escaped = true;
        continue;
      }
      if (char === quote) quote = "";
      continue;
    }

    if (char === "/" && next === "/") {
      lineComment = true;
      index += 1;
      continue;
    }

    if (char === "/" && next === "*") {
      blockComment = true;
      index += 1;
      continue;
    }

    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      continue;
    }

    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return index;
    }
  }

  return -1;
}

function dedentBlock(source) {
  const lines = source.replace(/\s+$/u, "").split("\n");
  const nonEmptyLines = lines.filter((line) => line.trim() !== "");
  const indent = Math.min(
    ...nonEmptyLines.map((line) => line.match(/^\s*/u)[0].length),
  );

  return lines
    .map((line) => line.slice(Math.min(indent, line.match(/^\s*/u)[0].length)))
    .join("\n")
    .trim();
}

function rewriteExampleAssetUrls(source) {
  return source.replace(
    /new URL\(\s*(['"])\.\/([^'"]+)\1\s*,\s*import\.meta\.url\s*\)/gu,
    (_match, _quote, relativePath) =>
      `exampleAssetUrl(${JSON.stringify(relativePath)})`,
  );
}

export function createExampleSnippet(source) {
  const normalizedSource = source.replace(/\r\n/g, "\n");
  const createExampleMatch =
    /export\s+(?:async\s+)?function\s+createExample\s*\([^)]*\)\s*\{/u.exec(
      normalizedSource,
    );

  if (!createExampleMatch) {
    throw new Error("Example source must export createExample().");
  }

  const openBraceIndex =
    createExampleMatch.index + createExampleMatch[0].length - 1;
  const closeBraceIndex = findMatchingBrace(normalizedSource, openBraceIndex);

  if (closeBraceIndex === -1) {
    throw new Error("Unable to find the end of createExample().");
  }

  const moduleBody = stripImports(
    normalizedSource.slice(0, createExampleMatch.index),
  ).trimEnd();
  const createExampleBody = dedentBlock(
    normalizedSource.slice(openBraceIndex + 1, closeBraceIndex),
  );
  const snippet = [moduleBody, createExampleBody]
    .filter((section) => section.trim() !== "")
    .join("\n\n")
    .trim();

  if (!/^\s*return\b/mu.test(snippet)) {
    throw new Error("createExample() must return a layout node.");
  }

  return rewriteExampleAssetUrls(snippet);
}

async function syncExampleAssets(options = {}) {
  const examplesDir = options.examplesDir || defaultExamplesDir;
  const exampleAssetsDir =
    options.exampleAssetsDir || path.join(examplesDir, "dataset");
  const outputDir = options.outputDir || defaultOutputDir;

  await mkdir(outputDir, { recursive: true });
  await cp(exampleAssetsDir, path.join(outputDir, "dataset"), {
    recursive: true,
    force: true,
  }).catch((error) => {
    if (error?.code !== "ENOENT") throw error;
  });
}

export async function syncExampleSnippet(example, options = {}) {
  const source = example.source || example.slug;
  const examplesDir = options.examplesDir || defaultExamplesDir;
  const snippetDir = options.snippetDir || defaultSnippetDir;
  const inputPath = path.join(examplesDir, `${source}.js`);
  const outputPath = path.join(snippetDir, `${source}.txt`);
  const exampleSource = await readFile(inputPath, "utf8");
  const snippet = createExampleSnippet(exampleSource);

  await mkdir(snippetDir, { recursive: true });
  await writeFile(outputPath, `${snippet}\n`);

  return { source, outputPath, snippet };
}

export async function exportSiteExamples(options = {}) {
  const exampleList = options.examples || examples;
  const logger = options.logger || console.log;

  await syncExampleAssets(options);

  for (const example of exampleList) {
    const snippet = await syncExampleSnippet(example, options);
    logger(`Synced ${path.relative(process.cwd(), snippet.outputPath)}`);
  }
}

export function isDirectExecution(
  entryPoint = process.argv[1],
  moduleUrl = import.meta.url,
) {
  return Boolean(entryPoint) && moduleUrl === pathToFileURL(entryPoint).href;
}

if (isDirectExecution()) {
  await exportSiteExamples();
}
