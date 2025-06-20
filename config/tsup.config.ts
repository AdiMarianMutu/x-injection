import { defineConfig } from 'tsup';

export default defineConfig({
  clean: true,
  entry: ['src/index.ts', '!src/.docs-entry.ts'],
  format: ['cjs', 'esm'],
  dts: true, // Generate declaration file (.d.ts)
  skipNodeModulesBundle: true,
  minify: 'terser',
  terserOptions: {
    format: {
      beautify: true,
      comments: false,
    },
  },
  splitting: false,
  sourcemap: false,
  target: 'esnext',
});
