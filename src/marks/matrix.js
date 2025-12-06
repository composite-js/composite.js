export function drawMatrix(svg, data, options) {
  const { encoding = {}, width = 400, height = 300, stripe = true } = options;

  const xField = encoding.x;
  const yField = encoding.y; // Expecting an array of strings
  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  // 1. Identify all unique categories for Y axis (the sets)
  let sortedSets;
  if (encoding.yDomain) {
    sortedSets = encoding.yDomain;
  } else {
    const allSets = new Set();
    data.forEach((d) => {
      const sets = d[yField];
      if (Array.isArray(sets)) {
        sets.forEach((s) => allSets.add(s));
      }
    });
    sortedSets = Array.from(allSets).sort();
  }

  const stepWidth = chartWidth / data.length;
  const stepHeight = chartHeight / sortedSets.length;

  // Helper to get coordinates
  const getX = (i) => padding + i * stepWidth + stepWidth * 0.5;
  const getY = (setIndex) => padding + setIndex * stepHeight + stepHeight * 0.5;

  // Draw Rows (Sets)
  sortedSets.forEach((setName, setIndex) => {
    // Draw Background Stripe
    if (stripe && setIndex % 2 === 0) {
      const rect = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "rect",
      );
      rect.setAttribute("x", padding);
      rect.setAttribute("y", padding + setIndex * stepHeight);
      rect.setAttribute("width", chartWidth);
      rect.setAttribute("height", stepHeight);
      rect.setAttribute("fill", "#f9f9f9");
      svg.appendChild(rect);
    }

    // Draw Row Label (Optional, if not handled by side bar)
    // In our composite, we might want to hide these if the side bar has them.
    // But for now, let's keep them hidden or make them optional.
    // The user wants to replicate the image. The image has labels on the left.
    // If we use the side bar for labels, we should hide them here.
    // Let's assume we hide them here and let the side bar handle it.
    /*
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", padding - 10);
    text.setAttribute("y", getY(setIndex) + 4);
    text.setAttribute("text-anchor", "end");
    text.setAttribute("font-size", "12px");
    text.textContent = setName;
    svg.appendChild(text);
    */
  });

  // Draw Columns (Intersections)
  data.forEach((d, i) => {
    const activeSets = new Set(d[yField] || []);
    const x = getX(i);

    // Find range of active sets for the vertical connecting line
    let minIndex = Infinity;
    let maxIndex = -Infinity;

    sortedSets.forEach((setName, setIndex) => {
      if (activeSets.has(setName)) {
        if (setIndex < minIndex) minIndex = setIndex;
        if (setIndex > maxIndex) maxIndex = setIndex;
      }
    });

    // Draw connecting line
    if (minIndex < maxIndex) {
      const line = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line",
      );
      line.setAttribute("x1", x);
      line.setAttribute("y1", getY(minIndex));
      line.setAttribute("x2", x);
      line.setAttribute("y2", getY(maxIndex));
      line.setAttribute("stroke", "black");
      line.setAttribute("stroke-width", "2");
      svg.appendChild(line);
    }

    // Draw circles for each set
    sortedSets.forEach((setName, setIndex) => {
      const y = getY(setIndex);
      const isActive = activeSets.has(setName);

      const circle = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "circle",
      );
      circle.setAttribute("cx", x);
      circle.setAttribute("cy", y);
      circle.setAttribute("r", 5); // Slightly larger
      circle.setAttribute("fill", isActive ? "black" : "#e0e0e0");
      // No stroke for inactive, just fill

      svg.appendChild(circle);
    });
  });
}
