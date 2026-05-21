import { defineConfig } from "vite";

const esmEntryModule = "composite-js-esm-entry";
const cjsEntryModule = "composite-js-cjs-entry";

export default defineConfig({
  build: {
    ssr: "src/export/package-entry.js",
    outDir: "dist/export",
    emptyOutDir: true,
    target: "node18",
    rollupOptions: {
      external: ["sharp", esmEntryModule, cjsEntryModule],
      output: {
        entryFileNames: "index.js",
        format: "es",
        paths: {
          [esmEntryModule]: "../esm/index.js",
          [cjsEntryModule]: "../cjs/index.cjs",
        },
      },
    },
  },
});
