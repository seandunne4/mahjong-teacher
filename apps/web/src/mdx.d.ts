declare module '*.mdx' {
  import type { ComponentType } from 'react';
  export const meta: { title: string; order: number; blurb: string };
  const Component: ComponentType<{ components?: Record<string, unknown> }>;
  export default Component;
}
