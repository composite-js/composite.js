import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.js',
      name: 'composite',
      fileName: (format) => `composite.${format}`,
      formats: ['es', 'cjs', 'umd']
    },
    rollupOptions: {
      // externalize deps that shouldn't be bundled into the library
      external: [],
      output: {
        globals: {}
      }
    }
  }
})
