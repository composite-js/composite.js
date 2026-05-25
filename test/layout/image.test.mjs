import assert from "node:assert/strict";
import { image, Node } from "../../src/layout.js";
import { createFakeSvg } from "../helpers/fake-svg.mjs";

const zeroMargin = { top: 0, right: 0, bottom: 0, left: 0 };

{
  const node = image({
    url: "https://flagcdn.com/us.svg",
    width: 32,
    height: 32,
    fit: "cover",
    clip: "circle",
    clipPathId: "flag-us-clip",
    stroke: "#ffffff",
    strokeWidth: 2,
    opacity: 0.9,
    className: "flag-icon",
    id: "flag-us",
    title: "United States",
  });

  assert.ok(node instanceof Node);
  assert.equal(node.classTag, "image");

  const svg = createFakeSvg();
  node.render(svg, { width: 32, height: 32, margin: zeroMargin });

  const renderedImage = svg.querySelectorAll("image")[0];
  assert.equal(
    renderedImage.getAttribute("href"),
    "https://flagcdn.com/us.svg",
  );
  assert.equal(
    renderedImage.getAttribute("xlink:href"),
    "https://flagcdn.com/us.svg",
  );
  assert.equal(renderedImage.getAttribute("width"), "32");
  assert.equal(renderedImage.getAttribute("height"), "32");
  assert.equal(
    renderedImage.getAttribute("preserveAspectRatio"),
    "xMidYMid slice",
  );
  assert.equal(renderedImage.getAttribute("clip-path"), "url(#flag-us-clip)");
  assert.equal(renderedImage.getAttribute("opacity"), "0.9");
  assert.equal(renderedImage.getAttribute("class"), "flag-icon");
  assert.equal(renderedImage.getAttribute("id"), "flag-us");
  assert.equal(
    renderedImage.querySelectorAll("title")[0].textContent,
    "United States",
  );

  const clipPath = svg.querySelectorAll("clipPath")[0];
  assert.equal(clipPath.getAttribute("id"), "flag-us-clip");

  const circles = svg.querySelectorAll("circle");
  assert.equal(circles[0].getAttribute("cx"), "16");
  assert.equal(circles[0].getAttribute("cy"), "16");
  assert.equal(circles[0].getAttribute("r"), "16");
  assert.equal(circles[1].getAttribute("fill"), "none");
  assert.equal(circles[1].getAttribute("stroke"), "#ffffff");
  assert.equal(circles[1].getAttribute("stroke-width"), "2");
}

{
  const urls = [
    "https://flagcdn.com/us.svg",
    "https://flagcdn.com/w80/us.png",
    "https://example.com/photo.jpg",
  ];

  urls.forEach((url) => {
    const node = image({ url, width: 20, height: 12 });
    const svg = createFakeSvg();
    node.render(svg, { width: 20, height: 12, margin: zeroMargin });

    assert.equal(svg.querySelectorAll("image")[0].getAttribute("href"), url);
  });
}

{
  const node = image({
    src: "https://example.com/photo.jpeg",
    width: 48,
    height: 30,
    x: 4,
    y: 3,
    fit: "fill",
    rotate: 15,
  });

  const svg = createFakeSvg();
  node.render(svg, { width: 48, height: 30, margin: zeroMargin });

  const renderedImage = svg.querySelectorAll("image")[0];
  assert.equal(
    renderedImage.getAttribute("href"),
    "https://example.com/photo.jpeg",
  );
  assert.equal(renderedImage.getAttribute("x"), "4");
  assert.equal(renderedImage.getAttribute("y"), "3");
  assert.equal(renderedImage.getAttribute("preserveAspectRatio"), "none");
  assert.equal(renderedImage.getAttribute("transform"), "rotate(15, 28, 18)");
}

{
  assert.throws(
    () => image({ width: 20, height: 20 }),
    /image\(\) requires a url or src string/i,
  );
}
