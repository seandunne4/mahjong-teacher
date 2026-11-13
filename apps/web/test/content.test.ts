import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { getPath, parseHand } from '@mj/engine';
import { extractRuleBlocks } from '../src/reference/extract';
import { baseRuleset, profiles } from '../src/data';

const dir = fileURLToPath(new URL('../content/rules', import.meta.url));
const files = readdirSync(dir).filter((f) => f.endsWith('.mdx'));
const blocks = files.flatMap((f) => extractRuleBlocks(readFileSync(join(dir, f), 'utf8'), f, f));
const sources = files.map((f) => readFileSync(join(dir, f), 'utf8')).join('\n');

const resolvable = (path: string) => {
  if (path.startsWith('profile.')) return getPath(profiles[0], path.slice(8)) !== undefined;
  if (path.startsWith('derived.')) return ['bonusTiles', 'hasBonus', 'tileCount', 'stacksPerWall', 'tilesPerWall', 'deadWallTiles'].includes(path.slice(8));
  return getPath(baseRuleset, path) !== undefined;
};

describe('rules reference content', () => {
  it('has five topics with rules', () => {
    expect(files).toHaveLength(5);
    expect(blocks.length).toBeGreaterThanOrEqual(20);
  });
  it('gives every rule a unique id and a title', () => {
    expect(new Set(blocks.map((b) => b.id)).size).toBe(blocks.length);
    for (const b of blocks) expect(b.title, b.id).toBeTruthy();
  });
  it('tags every rule with a setting that exists in the ruleset or profile', () => {
    for (const b of blocks) {
      expect(b.setting, `${b.id} has no setting`).toBeTruthy();
      expect(resolvable(b.setting!), `${b.id}: ${b.setting}`).toBe(true);
    }
  });
  it('gives every rule a tile diagram', () => {
    for (const b of blocks) expect(b.hasDiagram, `${b.id} has no <Diagram>`).toBe(true);
  });
  it('only uses diagrams that parse', () => {
    for (const m of sources.matchAll(/<Diagram hand="([^"]*)"/g)) expect(() => parseHand(m[1]), m[1]).not.toThrow();
  });
  it('only interpolates settings that exist', () => {
    for (const m of sources.matchAll(/(?:<Val|<When) path="([^"]*)"/g)) expect(resolvable(m[1]), m[1]).toBe(true);
    for (const m of sources.matchAll(/"([a-zA-Z]+(?:\.[a-zA-Z]+)+)":/g)) expect(resolvable(m[1]), `when: ${m[1]}`).toBe(true);
  });
  it('gives each topic a Summary, Full and Edge layer per rule', () => {
    for (const f of files) {
      const src = readFileSync(join(dir, f), 'utf8');
      const rules = src.split('<Rule ').length - 1;
      expect(src.split('<Summary>').length - 1, f).toBe(rules);
      expect(src.split('<Full>').length - 1, f).toBe(rules);
      expect(src.split('<Edge>').length - 1, f).toBe(rules);
    }
  });
});
