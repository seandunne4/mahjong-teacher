import type { TileId } from './ruleset/schema';
import { isBonus } from './tiles';

/**
 * Hand notation used by content and diagrams.
 *
 *   "123m 555p* 1111s! 77z | 1f"
 *
 * - Digits then a suit letter: m Characters, p Dots, s Bamboo, z honors
 *   (1-4 E S W N, 5 White, 6 Green, 7 Red), f flowers, x seasons.
 * - Honor aliases: E S W N Wh G R, repeatable ("EEE", "WhWh").
 * - Suffix "*" = exposed (claimed/melded), "!" = concealed kong.
 * - "|" splits the diagram into separate groups (e.g. "hand | claimed tile").
 */
export type MeldMark = 'none' | 'exposed' | 'concealedKong';

export interface Meld {
  tiles: TileId[];
  mark: MeldMark;
}
export type HandSection = Meld[];

const ALIASES: Record<string, TileId> = { Wh: '5z', E: '1z', S: '2z', W: '3z', N: '4z', G: '6z', R: '7z' };
const MAX_RANK: Record<string, number> = { m: 9, p: 9, s: 9, z: 7, f: 4, x: 4 };

function parseToken(raw: string): Meld {
  let token = raw;
  let mark: MeldMark = 'none';
  if (token.endsWith('*')) {
    mark = 'exposed';
    token = token.slice(0, -1);
  } else if (token.endsWith('!')) {
    mark = 'concealedKong';
    token = token.slice(0, -1);
  }
  const numeric = /^([1-9]+)([mpszfx])$/.exec(token);
  if (numeric) {
    const [, digits, suit] = numeric;
    const tiles = [...digits].map((d) => {
      if (Number(d) > MAX_RANK[suit]) throw new Error(`Invalid tile "${d}${suit}" in "${raw}"`);
      return `${d}${suit}`;
    });
    return { tiles, mark };
  }
  // Honor aliases, greedy so "Wh" wins over "W".
  const tiles: TileId[] = [];
  let i = 0;
  while (i < token.length) {
    if (token.startsWith('Wh', i)) {
      tiles.push(ALIASES.Wh);
      i += 2;
    } else if (ALIASES[token[i]] && token[i] !== 'h') {
      tiles.push(ALIASES[token[i]]);
      i += 1;
    } else {
      throw new Error(`Cannot parse tile token "${raw}"`);
    }
  }
  if (tiles.length === 0) throw new Error(`Empty tile token "${raw}"`);
  return { tiles, mark };
}

export function parseHand(text: string): HandSection[] {
  return text
    .split('|')
    .map((section) =>
      section
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map(parseToken),
    )
    .filter((s) => s.length > 0);
}

/** Canonical string form; parseHand(formatHand(x)) deep-equals x. */
export function formatHand(sections: HandSection[]): string {
  return sections
    .map((section) =>
      section
        .map((meld) => {
          const suits = new Set(meld.tiles.map((t) => t[1]));
          if (suits.size !== 1) throw new Error('A meld token must use a single suit');
          const body = meld.tiles.map((t) => t[0]).join('') + meld.tiles[0][1];
          return body + (meld.mark === 'exposed' ? '*' : meld.mark === 'concealedKong' ? '!' : '');
        })
        .join(' '),
    )
    .join(' | ');
}

export const handTiles = (sections: HandSection[]): TileId[] =>
  sections.flatMap((s) => s.flatMap((m) => m.tiles));

/**
 * Checks a complete winning-hand example: 14 non-bonus tiles plus one per kong,
 * and no tile used more than 4 times. (Shape checking is Phase 3's decomposer.)
 */
export function checkTileCount(sections: HandSection[]): { ok: boolean; reason?: string } {
  const tiles = handTiles(sections).filter((t) => !isBonus(t));
  const melds = sections.flat();
  const kongs = melds.filter((m) => m.tiles.length === 4 && new Set(m.tiles).size === 1).length;
  const expected = 14 + kongs;
  if (tiles.length !== expected) return { ok: false, reason: `has ${tiles.length} tiles, expected ${expected}` };
  const counts = new Map<string, number>();
  for (const t of handTiles(sections)) counts.set(t, (counts.get(t) ?? 0) + 1);
  for (const [t, n] of counts) {
    const max = isBonus(t) ? 1 : 4;
    if (n > max) return { ok: false, reason: `uses ${t} ${n} times` };
  }
  return { ok: true };
}
