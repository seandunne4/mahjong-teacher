import type { ComponentType } from 'react';
import MiniSearch from 'minisearch';
import { extractRuleBlocks, type RuleBlock } from './extract';

export interface TopicMeta {
  slug: string;
  title: string;
  order: number;
  blurb: string;
}

interface MdxModule {
  default: ComponentType<{ components?: Record<string, unknown> }>;
  meta: Omit<TopicMeta, 'slug'>;
}

const modules = import.meta.glob<MdxModule>('../../content/rules/*.mdx', { eager: true });
const raws = import.meta.glob<string>('../../content/rules/*.mdx', { eager: true, query: '?raw', import: 'default' });

const slugOf = (path: string) => path.split('/').pop()!.replace(/\.mdx$/, '');

export const topics = Object.entries(modules)
  .map(([path, mod]) => ({ ...mod.meta, slug: slugOf(path), Component: mod.default }))
  .sort((a, b) => a.order - b.order);

export const ruleBlocks: RuleBlock[] = Object.entries(raws).flatMap(([path, src]) => {
  const slug = slugOf(path);
  const title = topics.find((t) => t.slug === slug)?.title ?? slug;
  return extractRuleBlocks(src, slug, title);
});

const index = new MiniSearch<RuleBlock>({
  fields: ['title', 'text', 'topicTitle'],
  storeFields: ['id', 'title', 'topic', 'topicTitle', 'text'],
  searchOptions: { boost: { title: 3 }, prefix: true, fuzzy: 0.2 },
});
index.addAll(ruleBlocks);

export function searchRules(q: string): RuleBlock[] {
  if (!q.trim()) return [];
  return index.search(q).slice(0, 12) as unknown as RuleBlock[];
}
