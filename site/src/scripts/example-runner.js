import * as composite from "../../../src/index.js";

const editorMessageSource = "composite-example-editor";
const runnerMessageSource = "composite-example-runner";
const viewport = document.getElementById("viewport");
const root = document.getElementById("app");
const minPreviewScale = 0.2;
const maxPreviewScale = 4;
const previewTransform = {
  x: 0,
  y: 0,
  scale: 1,
};
const helpers = {
  chart: composite.chart,
  embed: composite.embed,
  frame: composite.frame,
  image: composite.image,
  repeat: composite.repeat,
  repeatX: composite.repeatX,
  repeatY: composite.repeatY,
  sequenceContainer: composite.sequenceContainer,
  stackX: composite.stackX,
  stackY: composite.stackY,
  text: composite.text,
};

function postStatus(type, payload = {}) {
  window.parent.postMessage(
    {
      source: runnerMessageSource,
      type,
      ...payload,
    },
    window.location.origin,
  );
}

function serializeError(error) {
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack || "",
    };
  }

  return {
    message: String(error),
    stack: "",
  };
}

function applyPreviewTransform() {
  root.style.transform = `translate(${previewTransform.x}px, ${previewTransform.y}px) scale(${previewTransform.scale})`;
}

function resetPreviewTransform() {
  previewTransform.x = 0;
  previewTransform.y = 0;
  previewTransform.scale = 1;
  applyPreviewTransform();
}

function clampPreviewScale(scale) {
  return Math.min(maxPreviewScale, Math.max(minPreviewScale, scale));
}

function initializePreviewInteraction() {
  let activePointerId = null;
  let dragStartX = 0;
  let dragStartY = 0;
  let transformStartX = 0;
  let transformStartY = 0;

  viewport.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    activePointerId = event.pointerId;
    dragStartX = event.clientX;
    dragStartY = event.clientY;
    transformStartX = previewTransform.x;
    transformStartY = previewTransform.y;
    viewport.classList.add("is-panning");
    viewport.setPointerCapture(activePointerId);
  });

  viewport.addEventListener("pointermove", (event) => {
    if (event.pointerId !== activePointerId) return;

    previewTransform.x = transformStartX + event.clientX - dragStartX;
    previewTransform.y = transformStartY + event.clientY - dragStartY;
    applyPreviewTransform();
  });

  function endPan(event) {
    if (event.pointerId !== activePointerId) return;

    viewport.classList.remove("is-panning");
    if (viewport.hasPointerCapture(activePointerId)) {
      viewport.releasePointerCapture(activePointerId);
    }
    activePointerId = null;
  }

  viewport.addEventListener("pointerup", endPan);
  viewport.addEventListener("pointercancel", endPan);

  viewport.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();

      const bounds = viewport.getBoundingClientRect();
      const pointerX = event.clientX - bounds.left;
      const pointerY = event.clientY - bounds.top;
      const previousScale = previewTransform.scale;
      const zoomFactor = Math.exp(-event.deltaY * 0.001);
      const nextScale = clampPreviewScale(previousScale * zoomFactor);

      if (nextScale === previousScale) return;

      const contentX = (pointerX - previewTransform.x) / previousScale;
      const contentY = (pointerY - previewTransform.y) / previousScale;
      previewTransform.scale = nextScale;
      previewTransform.x = pointerX - contentX * nextScale;
      previewTransform.y = pointerY - contentY * nextScale;
      applyPreviewTransform();
    },
    { passive: false },
  );

  viewport.addEventListener("dblclick", () => {
    resetPreviewTransform();
  });
}

function renderSnippet(snippet) {
  try {
    root.replaceChildren();
    resetPreviewTransform();

    const helperNames = Object.keys(helpers);
    const runSnippet = new Function(...helperNames, snippet);
    const node = runSnippet(...helperNames.map((name) => helpers[name]));

    if (!node || typeof node.render !== "function") {
      throw new Error("Snippet must return a composite layout node.");
    }

    node.render(root);
    postStatus("success");
  } catch (error) {
    root.replaceChildren();
    postStatus("error", serializeError(error));
  }
}

window.addEventListener("message", (event) => {
  if (event.origin !== window.location.origin) return;

  const message = event.data;
  if (!message || message.source !== editorMessageSource) return;
  if (message.type !== "run") return;

  renderSnippet(String(message.snippet || ""));
});

initializePreviewInteraction();
resetPreviewTransform();
postStatus("ready");
