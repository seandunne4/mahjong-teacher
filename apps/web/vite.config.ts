import { defineConfig, type Plugin, type TransformResult } from 'vite';
import react from '@vitejs/plugin-react';
import mdx from '@mdx-js/rollup';

type Transform = (this: unknown, code: string, id: string) => TransformResult | Promise<TransformResult> | null;

/** MDX, but leave "?raw" imports (used to build the rules search index) as plain text. */
function mdxExceptRaw(): Plugin {
  const inner = mdx({ include: /\.mdx$/ }) as Plugin;
  const transform = inner.transform as Transform;
  return {
    ...inner,
    name: 'mdx-except-raw',
    enforce: 'pre',
    transform(code, id) {
      if (id.includes('?')) return null;
      return transform.call(this, code, id);
    },
  };
}

export default defineConfig({
  // Relative base + hash routing so the build works from any GitHub Pages path.
  base: './',
  plugins: [mdxExceptRaw(), react({ include: /\.(mdx|tsx|ts)$/ })],
});
