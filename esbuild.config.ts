import { build } from 'esbuild'

/**
 * Bundles the action into a single ESM file at `dist/index.js`, which
 * `action.yml` (`runs.using: node24`) executes.
 *
 * The banner provides a CommonJS `require` shim so any dynamic `require` inside
 * bundled CJS dependencies (e.g. `@actions/*`) resolves under ESM.
 */
await build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node24',
  outfile: 'dist/index.js',
  banner: {
    js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);"
  }
})
