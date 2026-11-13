export interface RuleBlock {
  id: string;
  title: string;
  topic: string;
  topicTitle: string;
  setting?: string;
  text: string;
  hasDiagram: boolean;
}

/** Pull <Rule> blocks out of MDX source (used for search and content checks). */
export function extractRuleBlocks(source: string, topic: string, topicTitle: string): RuleBlock[] {
  const out: RuleBlock[] = [];
  const re = /<Rule\s([^>]*?)>([\s\S]*?)<\/Rule>/g;
  for (const m of source.matchAll(re)) {
    const attrs = m[1];
    const body = m[2];
    const attr = (name: string) => new RegExp(`${name}="([^"]*)"`).exec(attrs)?.[1];
    out.push({
      id: attr('id') ?? '',
      title: attr('title') ?? '',
      setting: attr('setting'),
      topic,
      topicTitle,
      hasDiagram: /<Diagram\s/.test(body),
      text: body
        .replace(/<Val path="[^"]*"\s*\/>/g, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/[*_`#]/g, '')
        .replace(/\s+/g, ' ')
        .trim(),
    });
  }
  return out;
}
