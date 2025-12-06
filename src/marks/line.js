export function drawLineChart(svg, data, options) {
  const { encoding = {}, width = 400, height = 300 } = options;

  const xField = encoding.x;
  const yField = encoding.y;
  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const maxValue = Math.max(...data.map((d) => d[yField] || 0));
  const stepWidth = chartWidth / data.length;

  // 辅助函数：计算坐标
  const getX = (i) => padding + i * stepWidth + stepWidth * 0.5;
  const getY = (val) => height - padding - (val / maxValue) * chartHeight;

  // 生成路径数据
  let pathD = "";
  const points = [];

  data.forEach((d, i) => {
    const value = d[yField];
    const x = getX(i);
    const y = getY(value);
    points.push({ x, y, value, label: d[xField] });

    if (i === 0) {
      pathD += `M ${x} ${y}`;
    } else {
      pathD += ` L ${x} ${y}`;
    }
  });

  // 绘制折线
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", pathD);
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", "steelblue");
  path.setAttribute("stroke-width", "2");
  svg.appendChild(path);

  // 绘制数据点
  points.forEach((p) => {
    const circle = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle",
    );
    circle.setAttribute("cx", p.x);
    circle.setAttribute("cy", p.y);
    circle.setAttribute("r", 4);
    circle.setAttribute("fill", "white");
    circle.setAttribute("stroke", "steelblue");
    circle.setAttribute("stroke-width", "2");

    // 交互
    circle.addEventListener("mouseenter", () => {
      circle.setAttribute("fill", "orange");
      circle.setAttribute("r", 6);
    });
    circle.addEventListener("mouseleave", () => {
      circle.setAttribute("fill", "white");
      circle.setAttribute("r", 4);
    });

    const title = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "title",
    );
    title.textContent = `${p.label}: ${p.value}`;
    circle.appendChild(title);

    svg.appendChild(circle);
  });

  // 绘制 X 轴标签
  data.forEach((d, i) => {
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", getX(i));
    text.setAttribute("y", height - padding + 20);
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("font-size", "12px");
    text.textContent = d[xField];
    svg.appendChild(text);
  });

  // 绘制坐标轴
  const yAxis = document.createElementNS("http://www.w3.org/2000/svg", "line");
  yAxis.setAttribute("x1", padding);
  yAxis.setAttribute("y1", padding);
  yAxis.setAttribute("x2", padding);
  yAxis.setAttribute("y2", height - padding);
  yAxis.setAttribute("stroke", "black");
  svg.appendChild(yAxis);

  const xAxis = document.createElementNS("http://www.w3.org/2000/svg", "line");
  xAxis.setAttribute("x1", padding);
  xAxis.setAttribute("y1", height - padding);
  xAxis.setAttribute("x2", width - padding);
  xAxis.setAttribute("y2", height - padding);
  xAxis.setAttribute("stroke", "black");
  svg.appendChild(xAxis);
}
