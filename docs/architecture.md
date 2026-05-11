# 项目架构与运行指南

## 项目简介

本项目 `composite.js` 旨在构建一个基于 JavaScript 的可视化语法（Visualization Grammar），允许用户通过声明式的方式构建交互式可视化图表。

## 核心架构

该库的核心思想是将可视化分解为可组合的组件。

### 核心 API

- **`chart(options)`**: 创建一个 leaf layout node，内部包装具体 chart renderer。
- **`stackX(nodes, options)` / `stackY(nodes, options)`**: 将 layout nodes 按横向或纵向组合。
- **`repeatX(domain, fn, options)` / `repeatY(domain, fn, options)`**: 根据 domain 生成重复节点。
- **`node.render(container, options)`**: 将单个 chart 或组合节点渲染到 DOM 容器中。

组合 API 只接受 layout node。也就是说，用户应该传入 `chart({...})` 的返回值，而不是直接把 `new Chart(...)` 放进 `stackX` 或 `stackY`。

### 目录结构

```
.
├── index.html          # 演示页面，用于开发调试
├── package.json        # 项目依赖与脚本配置
├── vite.config.js      # Vite 配置文件
├── src/
│   ├── index.js        # 库的公开入口
│   ├── chart.js        # leaf chart wrapper
│   ├── layout.js       # layout public exports
│   ├── layout/         # node、composition、measurement、engine、renderer
│   └── marks/          # mark renderers
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
import { chart } from "./src/index.js";

const data = [
  { category: "A", value: 30 },
  { category: "B", value: 80 },
  { category: "C", value: 45 },
];

const bar = chart({
  data: data,
  mark: "bar",
  encoding: {
    x: "category",
    y: "value",
  },
});

const root = document.getElementById("app");
bar.render(root);
```
