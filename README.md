# composite-js (Vite + pnpm demo)

这是一个最小的 NodeJS JavaScript library 模板，使用 pnpm 作为包管理，Vite 用于打包为 library。

包含文件：

- `package.json` - 项目配置与脚本（dev/build/test）
- `vite.config.js` - Vite library 构建配置
- `src/index.js` - 库源码（导出 `compose`）
- `test/run.mjs` - 示例运行脚本（用 Node 执行演示功能）

快速开始：

1. 安装依赖（需要系统已安装 pnpm）

   pnpm install

2. 本地开发（Vite dev）

   pnpm dev

3. 打包为 library

   pnpm build

4. 运行示例（不需要安装依赖）

   node test/run.mjs

说明：如果你使用旧版 Node，请确保支持 ES 模块（或将示例改为 CommonJS）。

关于你遇到的警告
--------------------------------
如果运行 `pnpm dev` 时看到：

   (!) Could not auto-determine entry point from rollupOptions or html files and there are no explicit optimizeDeps.include patterns. Skipping dependency pre-bundling.

原因：当你以 library 模式配置 `vite.config.js`（即设置了 `build.lib`）时，`vite` 在 dev 模式需要一个 HTML 入口（通常是项目根的 `index.html`）来启动开发服务器并确定模块入口。如果找不到 HTML 文件，且没有在 `vite.config.js` 的 `optimizeDeps.include` 中显式列出要预打包的依赖，Vite 会报上述警告并跳过预打包步骤。

解决办法：

- 推荐：在项目根添加一个 `index.html`（已包含在本示例中），它导入你的 `src` 入口。这样 `pnpm dev`（`vite`）会正常启动并识别入口。
- 另一种：如果你确实不需要页面 demo，可以在 `vite.config.js` 中配置 `optimizeDeps.include` 列出需要预打包的依赖（适用于依赖导致的问题），例如：

```js
// vite.config.js
export default defineConfig({
   optimizeDeps: {
      include: ['some-dep-you-use']
   },
   build: { /* ... */ }
})
```

但对开发演示而言，添加 `index.html` 是最简单且常用的做法。
