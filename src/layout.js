/**
 * src/layout.js - Composition utilities
 */

export function stack(charts, direction) {
  return { type: "stack", charts, direction };
}

export function composite(charts, { constraints = [] } = {}) {
  return {
    render(container) {
      // 1. Initialize grid coordinates for each chart
      // We use a Map to store { row, col } for each chart object
      const coords = new Map();
      charts.forEach((chart) => coords.set(chart, { row: 0, col: 0 }));

      // 2. Resolve constraints
      // This is a simplified solver. It assumes constraints form a connected graph
      // and we can propagate from the first chart in the first constraint.
      // A more robust solver would use topological sort or a constraint solver.

      // We'll iterate multiple times to propagate changes (simple relaxation)
      // Since we have few charts, this is fast enough.
      for (let i = 0; i < charts.length; i++) {
        constraints.forEach((c) => {
          if (c.type === "stack") {
            const [c1, c2] = c.charts;
            const p1 = coords.get(c1);
            const p2 = coords.get(c2);

            if (!p1 || !p2) return;

            if (c.direction === "vertical") {
              // c1 is above c2
              // We align them on column, and stack on row
              // If p2 is fixed (visited), update p1. If p1 is fixed, update p2?
              // Let's just enforce relative position: p1.row = p2.row - 1
              // And align columns: p1.col = p2.col

              // But wait, we might overwrite previous constraints.
              // Let's assume the graph is a tree for now or consistent.
              // We anchor everything to the first chart of the first constraint if possible,
              // or just pick one.

              // Let's try to keep relative positions consistent.
              // We can fix c2 and move c1, or fix c1 and move c2.
              // Let's move the one that hasn't been "touched" or just propagate.
              // Actually, let's just set p1 relative to p2.
              p1.row = p2.row - 1;
              p1.col = p2.col;
            } else if (c.direction === "horizontal") {
              // c1 is left of c2
              p1.col = p2.col - 1;
              p1.row = p2.row;
            }
          }
        });
      }

      // 3. Normalize coordinates
      let minRow = Infinity,
        minCol = Infinity;
      coords.forEach((p) => {
        if (p.row < minRow) minRow = p.row;
        if (p.col < minCol) minCol = p.col;
      });

      // Shift to 1-based index for CSS Grid
      let maxRow = 0,
        maxCol = 0;
      coords.forEach((p) => {
        p.row = p.row - minRow + 1;
        p.col = p.col - minCol + 1;
        if (p.row > maxRow) maxRow = p.row;
        if (p.col > maxCol) maxCol = p.col;
      });

      // 4. Determine Grid Dimensions
      // We need row heights and column widths.
      // Row height = max height of charts in that row
      // Col width = max width of charts in that col
      const rowHeights = new Array(maxRow + 1).fill(0);
      const colWidths = new Array(maxCol + 1).fill(0);

      charts.forEach((chart) => {
        const { row, col } = coords.get(chart);
        const w = chart.width || 0;
        const h = chart.height || 0;
        if (h > rowHeights[row]) rowHeights[row] = h;
        if (w > colWidths[col]) colWidths[col] = w;
      });

      // 5. Apply Styles
      container.style.display = "grid";
      // Generate template strings
      // slice(1) because we are 1-based
      container.style.gridTemplateRows = rowHeights
        .slice(1)
        .map((h) => h + "px")
        .join(" ");
      container.style.gridTemplateColumns = colWidths
        .slice(1)
        .map((w) => w + "px")
        .join(" ");
      container.style.gap = "10px"; // Optional gap

      // 6. Render Items
      charts.forEach((chart) => {
        const { row, col } = coords.get(chart);
        const div = document.createElement("div");
        div.style.gridRow = row;
        div.style.gridColumn = col;
        // Center content if needed, or stretch
        div.style.width = "100%";
        div.style.height = "100%";
        div.style.overflow = "hidden"; // Prevent overflow

        container.appendChild(div);
        chart.render(div);
      });
    },
  };
}

export function vconcat(charts) {
  return {
    render(container) {
      container.style.display = "flex";
      container.style.flexDirection = "column";

      charts.forEach((chart) => {
        const div = document.createElement("div");
        // Ensure the div doesn't collapse if chart has no intrinsic size (though SVG usually has width/height)
        container.appendChild(div);
        chart.render(div);
      });
    },
  };
}

export function hconcat(charts) {
  return {
    render(container) {
      container.style.display = "flex";
      container.style.flexDirection = "row";

      charts.forEach((chart) => {
        const div = document.createElement("div");
        container.appendChild(div);
        chart.render(div);
      });
    },
  };
}
