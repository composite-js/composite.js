import * as d3 from "d3";

function shouldAutoType(options) {
  return options.autoType !== false;
}

function convertRow(row, options) {
  return shouldAutoType(options) ? d3.autoType(row) : row;
}

function isEmptyValue(value) {
  return value === undefined || value === null || value === "";
}

function isFiniteNumericValue(value) {
  if (typeof value === "number") {
    return Number.isFinite(value);
  }

  if (typeof value === "string" && value.trim() !== "") {
    return Number.isFinite(Number(value));
  }

  return false;
}

function canFetchInNode(url) {
  if (url instanceof URL) {
    return url.protocol !== "file:";
  }

  try {
    const parsed = new URL(url);
    return parsed.protocol !== "file:";
  } catch (_error) {
    return false;
  }
}

async function fetchText(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Unable to load CSV dataset: ${response.status}`);
  }

  return response.text();
}

export async function loadCsvText(url) {
  if (typeof document !== "undefined" && typeof fetch === "function") {
    return fetchText(url);
  }

  if (globalThis.process?.versions?.node) {
    if (typeof fetch === "function" && canFetchInNode(url)) {
      return fetchText(url);
    }

    const fsPromisesModulePath = "node:fs/promises";
    const { readFile } = await import(/* @vite-ignore */ fsPromisesModulePath);
    const fileUrl =
      typeof url === "string" && url.startsWith("file:") ? new URL(url) : url;
    return readFile(fileUrl, "utf8");
  }

  return fetchText(url);
}

export function parseCsv(csvText, options = {}) {
  if (Array.isArray(options.columns)) {
    const rows = d3.csvParseRows(csvText, (values) => {
      const row = {};

      options.columns.forEach((column, index) => {
        row[column] = values[index] ?? "";
      });

      return convertRow(row, options);
    });

    rows.columns = [...options.columns];
    return rows;
  }

  return d3.csvParse(
    csvText,
    shouldAutoType(options) ? d3.autoType : undefined,
  );
}

export function tableColumns(rows) {
  if (Array.isArray(rows?.columns)) {
    return [...rows.columns];
  }

  if (!Array.isArray(rows) || rows.length === 0) {
    return [];
  }

  return Object.keys(rows[0] || {});
}

export function numericColumns(rows, options = {}) {
  const excluded = new Set(options.exclude || []);
  const columns = options.columns || tableColumns(rows);

  return columns.filter((column) => {
    if (excluded.has(column)) return false;

    const values = rows
      .map((row) => row?.[column])
      .filter((value) => !isEmptyValue(value));

    return (
      values.length > 0 && values.every((value) => isFiniteNumericValue(value))
    );
  });
}

export function crossJoin(left, right, mapper) {
  return left.flatMap((leftValue, leftIndex) =>
    right.map((rightValue, rightIndex) =>
      mapper
        ? mapper(leftValue, rightValue, leftIndex, rightIndex)
        : [leftValue, rightValue],
    ),
  );
}
