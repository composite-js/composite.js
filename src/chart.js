import { drawBarChart } from "./marks/bar.js";
import { drawLineChart } from "./marks/line.js";
import { drawMatrix } from "./marks/matrix.js";

/**
 * src/chart.js - Visualization grammar core
 */

/**
 * 创建一个图表实例
 * @param {Object} options - 图表配置选项
 * @param {Array} options.data - 数据数组
 * @param {string} options.mark - 标记类型 ('bar' | 'line' | 'matrix')
 * @param {Object} options.encoding - 编码配置 (例如 { x: 'field', y: 'field' })
 * @param {number} [options.width=400] - 图表宽度
 * @param {number} [options.height=300] - 图表高度
 * @param {string} [options.direction='vertical'] - 图表方向 (仅 bar chart 支持 'horizontal')
 * @param {Object} [options.axis] - 坐标轴配置 { x: { display: boolean }, y: { display: boolean } }
 * @returns {Object} 图表实例，包含 render 方法
 */
export function createChart(options) {
  const {
    data = [],
    mark = "bar",
    encoding = {},
    width = 400,
    height = 300,
  } = options;

  return {
    width,
    height,
    options, // Expose options for layout engine if needed
    /**
     * 将图表渲染到指定的 DOM 容器中
     * @param {HTMLElement} container - 容器元素
     */
    render(container) {
      // 清空容器
      container.innerHTML = "";

      // 创建 SVG 容器
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("width", width);
      svg.setAttribute("height", height);
      // Remove border for cleaner composition, or make it optional.
      // For now, let's keep it minimal or move it to CSS.
      // svg.style.border = "1px solid #ccc";

      // 简单的比例尺计算 (仅适用于数值型 y 轴)
      const yField = encoding.y;
      const xField = encoding.x;

      if (!yField || !xField) {
        console.warn("Missing encoding configuration for x or y.");
        return;
      }

      if (mark === "bar") {
        drawBarChart(svg, data, options);
      } else if (mark === "line") {
        drawLineChart(svg, data, options);
      } else if (mark === "matrix") {
        drawMatrix(svg, data, options);
      }

      container.appendChild(svg);
    },
  };
}
