# 项目架构与运行指南

## 项目简介

本项目 `composite.js` 旨在构建一个基于 JavaScript 的可视化语法（Visualization Grammar），允许用户通过声明式的方式构建交互式可视化图表。

## 核心架构

该库的核心思想是将可视化分解为可组合的组件。

### 核心 API

- **`createChart(options)`**: 创建一个图表实例。
  - `options`: 配置对象，包含数据 (`data`)、标记类型 (`mark`) 等信息。
- **`chart.render(container)`**: 将图表渲染到指定的 DOM 容器中。

### 目录结构

```
.
├── index.html          # 演示页面，用于开发调试
├── package.json        # 项目依赖与脚本配置
├── vite.config.js      # Vite 配置文件
├── src/
│   └── index.js        # 库的入口文件，包含核心逻辑
└── docs/               # 文档目录
```

## 运行方法

本项目使用 [Vite](https://vitejs.dev/) 作为开发服务器和构建工具，使用 [pnpm](https://pnpm.io/) 进行包管理。

### 1. 安装依赖

在项目根目录下运行：

```bash
pnpm install
```

### 2. 启动开发服务器

启动本地开发服务器，实时预览修改：

```bash
pnpm run dev
```

访问终端输出的地址（通常是 `http://localhost:5173`）即可查看 `index.html` 中的演示效果。

### 3. 构建生产版本

```bash
pnpm run build
```

## 使用示例

```javascript
import { createChart } from "./src/index.js";

const data = [
  { category: "A", value: 30 },
  { category: "B", value: 80 },
  { category: "C", value: 45 },
];

const chart = createChart({
  data: data,
  mark: "bar",
  encoding: {
    x: "category",
    y: "value",
  },
});

const root = document.getElementById("app");
chart.render(root);
```
