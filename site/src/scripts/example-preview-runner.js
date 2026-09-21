import * as composite from "../../../src/index.js";
import * as d3 from "d3";
import { getExampleBySlug } from "../data/examples.js";
import { getExampleSnippet } from "../data/example-snippets.js";

const viewport = document.getElementById("viewport");
const root = document.getElementById("app");
const status = document.getElementById("status");
const AsyncFunction = async function () {}.constructor;
const minPreviewScale = 0.08;
const maxPreviewScale = 1;
const previewPadding = 12;
const exampleAssetBase = new URL(
  `${import.meta.env.BASE_URL || "/"}examples/`,
  window.location.origin,
);
const helpers = {
  chart: composite.chart,
  crossJoin: composite.crossJoin,
  custom: composite.custom,
  customContainer: composite.customContainer,
  embed: composite.embed,
  wrapper: composite.wrapper,
  gridContainer: composite.gridContainer,
  image: composite.image,
  loadCsvText: composite.loadCsvText,
  numericColumns: composite.numericColumns,
  parseCsv: composite.parseCsv,
  repeat: composite.repeat,
  repeatX: composite.repeatX,
  repeatY: composite.repeatY,
  sequenceContainer: composite.sequenceContainer,
  stackX: composite.stackX,
  stackY: composite.stackY,
  text: composite.text,
  d3,
};

function exampleAssetUrl(relativePath) {
  return new URL(String(relativePath).replace(/^\.\//u, ""), exampleAssetBase);
}

helpers.exampleAssetUrl = exampleAssetUrl;

function showStatus(message) {
  root.replaceChildren();
  status.hidden = false;
  status.textContent = message;
}

function hideStatus() {
  status.hidden = true;
  status.textContent = "";
}

function getSvgSize(svg) {
  const width = Number(svg.getAttribute("width")) || svg.viewBox.baseVal.width;
  const height =
    Number(svg.getAttribute("height")) || svg.viewBox.baseVal.height;

  if (
    Number.isFinite(width) &&
    Number.isFinite(height) &&
    width > 0 &&
    height > 0
  ) {
    return { width, height };
  }

  const bounds = svg.getBoundingClientRect();

  return { width: bounds.width, height: bounds.height };
}

function clampScale(scale) {
  return Math.min(maxPreviewScale, Math.max(minPreviewScale, scale));
}

function fitRenderedPreview() {
  const svg = root.querySelector("svg");

  if (!svg) return;

  const viewportBounds = viewport.getBoundingClientRect();
  const contentSize = getSvgSize(svg);

  if (
    viewportBounds.width <= 0 ||
    viewportBounds.height <= 0 ||
    contentSize.width <= 0 ||
    contentSize.height <= 0
  ) {
    return;
  }

  const availableWidth = Math.max(1, viewportBounds.width - previewPadding * 2);
  const availableHeight = Math.max(
    1,
    viewportBounds.height - previewPadding * 2,
  );
  const scale = clampScale(
    Math.min(
      availableWidth / contentSize.width,
      availableHeight / contentSize.height,
    ),
  );
  const x = (viewportBounds.width - contentSize.width * scale) / 2;
  const y = (viewportBounds.height - contentSize.height * scale) / 2;

  root.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
}

async function renderSnippet(snippet) {
  root.replaceChildren();
  root.style.transform = "";
  hideStatus();

  const helperNames = Object.keys(helpers);
  const runSnippet = new AsyncFunction(...helperNames, snippet);
  const node = await runSnippet(...helperNames.map((name) => helpers[name]));

  if (!node || typeof node.render !== "function") {
    throw new Error("Snippet must return a composite layout node.");
  }

  node.render(root);
  window.requestAnimationFrame(fitRenderedPreview);
}

async function renderSelectedExample() {
  try {
    const searchParams = new URLSearchParams(window.location.search);
    const exampleSlug = searchParams.get("example");
    const example = exampleSlug ? getExampleBySlug(exampleSlug) : undefined;

    if (!example) {
      throw new Error("Unknown example");
    }

    await renderSnippet(getExampleSnippet(example));
  } catch (error) {
    showStatus(error instanceof Error ? error.message : "Preview unavailable");
  }
}

window.addEventListener("resize", fitRenderedPreview);
void renderSelectedExample();
