import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    {
      name: "composite-example-entry",
      transformIndexHtml(html) {
        const example = process.env.COMPOSITE_EXAMPLE || "upset";
        return html.replace("/examples/upset.js", `/examples/${example}.js`);
      },
    },
  ],
  build: {
    lib: {
      entry: "src/index.js",
      name: "composite",
      fileName: (format) => {
        if (format === "es") return "esm/index.js";
        if (format === "cjs") return "cjs/index.cjs";
        return "umd/composite.umd.cjs";
      },
      formats: ["es", "cjs", "umd"],
    },
    rollupOptions: {
      // externalize deps that shouldn't be bundled into the library
      external: [],
      output: {
        globals: {},
      },
    },
  },
});
