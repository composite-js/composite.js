export function drawBarChart(svg, data, options) {
  const {
    encoding = {},
    width = 400,
    height = 300,
    direction = "vertical", // 'vertical' | 'horizontal'
    color = "steelblue",
    reverse = false, // For horizontal: grow right-to-left
    showLabels = false, // Show value labels on bars
    yAxisAlign = "left", // 'left' | 'right' for horizontal chart labels
    hideAxisLabels = false, // Hide category labels
    yAxisLabel = "", // Label for Y axis
  } = options;

  const xField = encoding.x;
  const yField = encoding.y;
  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  if (direction === "horizontal") {
    // Horizontal Bar Chart
    // x: value (quantitative), y: category (nominal)

    const maxValue = Math.max(...data.map((d) => d[xField] || 0));
    const stepHeight = chartHeight / data.length;
    const barHeight = stepHeight * 0.8;

    data.forEach((d, i) => {
      const value = d[xField];
      const barWidth = (value / maxValue) * chartWidth;

      const rect = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "rect",
      );

      let x, y;
      y = padding + i * stepHeight + (stepHeight - barHeight) / 2;

      if (reverse) {
        // Grow from right to left
        // Start x is at the right edge of the chart area
        x = width - padding - barWidth;
      } else {
        // Grow from left to right
        x = padding;
      }

      rect.setAttribute("x", x);
      rect.setAttribute("y", y);
      rect.setAttribute("width", barWidth);
      rect.setAttribute("height", barHeight);
      rect.setAttribute("fill", color);

      // 交互
      rect.addEventListener("mouseenter", () =>
        rect.setAttribute("fill", "orange"),
      );
      rect.addEventListener("mouseleave", () =>
        rect.setAttribute("fill", color),
      );

      // Tooltip
      const title = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "title",
      );
      title.textContent = `${d[yField]}: ${value}`;
      rect.appendChild(title);

      svg.appendChild(rect);

      // Value Labels on top/side of bar
      if (showLabels) {
        const label = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "text",
        );
        // Position label slightly outside the bar end
        if (reverse) {
          label.setAttribute("x", x - 5);
          label.setAttribute("text-anchor", "end");
        } else {
          label.setAttribute("x", x + barWidth + 5);
          label.setAttribute("text-anchor", "start");
        }

        label.setAttribute("y", y + barHeight / 2 + 4);
        label.setAttribute("font-size", "10px");
        label.textContent = value;
        svg.appendChild(label);
      }

      // Y Axis Labels (Categories)
      if (!hideAxisLabels) {
        const text = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "text",
        );

        if (yAxisAlign === "right") {
          text.setAttribute("x", width - padding + 5);
          text.setAttribute("text-anchor", "start");
        } else {
          text.setAttribute("x", padding - 5);
          text.setAttribute("text-anchor", "end");
        }

        text.setAttribute("y", y + barHeight / 2 + 4); // 垂直居中
        text.setAttribute("font-size", "12px");
        text.textContent = d[yField];
        svg.appendChild(text);
      }
    });

    // 绘制坐标轴
    // Y 轴线
    const yAxis = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "line",
    );
    if (reverse) {
      // Axis on the right
      yAxis.setAttribute("x1", width - padding);
      yAxis.setAttribute("x2", width - padding);
    } else {
      yAxis.setAttribute("x1", padding);
      yAxis.setAttribute("x2", padding);
    }
    yAxis.setAttribute("y1", padding);
    yAxis.setAttribute("y2", height - padding);
    yAxis.setAttribute("stroke", "black");
    svg.appendChild(yAxis);

    // X 轴线
    const xAxis = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "line",
    );
    xAxis.setAttribute("x1", padding);
    xAxis.setAttribute("y1", height - padding);
    xAxis.setAttribute("x2", width - padding);
    xAxis.setAttribute("y2", height - padding);
    xAxis.setAttribute("stroke", "black");
    svg.appendChild(xAxis);

    // X Axis Labels (Simple min/max)
    const label0 = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text",
    );
    label0.setAttribute("y", height - padding + 15);
    label0.setAttribute("font-size", "10px");
    label0.textContent = "0";

    const labelMax = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text",
    );
    labelMax.setAttribute("y", height - padding + 15);
    labelMax.setAttribute("font-size", "10px");
    labelMax.textContent = maxValue;

    if (reverse) {
      label0.setAttribute("x", width - padding);
      label0.setAttribute("text-anchor", "middle");
      labelMax.setAttribute("x", padding);
      labelMax.setAttribute("text-anchor", "middle");
    } else {
      label0.setAttribute("x", padding);
      label0.setAttribute("text-anchor", "middle");
      labelMax.setAttribute("x", width - padding);
      labelMax.setAttribute("text-anchor", "middle");
    }
    svg.appendChild(label0);
    svg.appendChild(labelMax);
  } else {
    // Vertical Bar Chart (Default)
    // x: category, y: value

    const maxValue = Math.max(...data.map((d) => d[yField] || 0));
    const stepWidth = chartWidth / data.length;
    const barWidth = stepWidth * 0.8;

    data.forEach((d, i) => {
      const value = d[yField];
      const barHeight = (value / maxValue) * chartHeight;

      const rect = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "rect",
      );

      // x 坐标
      const x = padding + i * stepWidth + (stepWidth - barWidth) / 2;
      // y 坐标
      const y = height - padding - barHeight;

      rect.setAttribute("x", x);
      rect.setAttribute("y", y);
      rect.setAttribute("width", barWidth);
      rect.setAttribute("height", barHeight);
      rect.setAttribute("fill", color);

      // 交互
      rect.addEventListener("mouseenter", () =>
        rect.setAttribute("fill", "orange"),
      );
      rect.addEventListener("mouseleave", () =>
        rect.setAttribute("fill", color),
      );

      // Tooltip
      const title = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "title",
      );
      title.textContent = `${d[xField]}: ${value}`;
      rect.appendChild(title);

      svg.appendChild(rect);

      // Value Labels on top
      if (showLabels) {
        const label = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "text",
        );
        label.setAttribute("x", x + barWidth / 2);
        label.setAttribute("y", y - 5);
        label.setAttribute("text-anchor", "middle");
        label.setAttribute("font-size", "10px");
        label.textContent = value;
        svg.appendChild(label);
      }

      // X 轴标签 (Category)
      if (!hideAxisLabels) {
        const text = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "text",
        );
        text.setAttribute("x", x + barWidth / 2);
        text.setAttribute("y", height - padding + 15);
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("font-size", "12px");
        text.textContent = d[xField];
        svg.appendChild(text);
      }
    });

    // 绘制坐标轴
    const yAxis = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "line",
    );
    yAxis.setAttribute("x1", padding);
    yAxis.setAttribute("y1", padding);
    yAxis.setAttribute("x2", padding);
    yAxis.setAttribute("y2", height - padding);
    yAxis.setAttribute("stroke", "black");
    svg.appendChild(yAxis);

    // Y Axis Label
    if (yAxisLabel) {
      const label = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text",
      );
      label.setAttribute("x", padding - 30);
      label.setAttribute("y", height / 2);
      label.setAttribute("text-anchor", "middle");
      label.setAttribute(
        "transform",
        `rotate(-90, ${padding - 30}, ${height / 2})`,
      );
      label.setAttribute("font-size", "14px");
      label.textContent = yAxisLabel;
      svg.appendChild(label);
    }

    const xAxis = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "line",
    );
    xAxis.setAttribute("x1", padding);
    xAxis.setAttribute("y1", height - padding);
    xAxis.setAttribute("x2", width - padding);
    xAxis.setAttribute("y2", height - padding);
    xAxis.setAttribute("stroke", "black");
    svg.appendChild(xAxis);
  }
}
