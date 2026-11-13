import type { Ruleset, Suit, TileId } from './ruleset/schema';

export const SUIT_LETTER: Record<Suit, 'm' | 'p' | 's'> = {
  characters: 'm',
  dots: 'p',
  bamboo: 's',
};

const GROUP_ORDER = ['m', 'p', 's', 'z', 'f', 'x'] as const;

export interface TileInstance {
  /** Unique per physical tile in a set. */
  uid: number;
  id: TileId;
}

export const tileSuitLetter = (id: TileId) => id[1] as (typeof GROUP_ORDER)[number];
export const tileRank = (id: TileId) => Number(id[0]);
export const isBonus = (id: TileId) => id[1] === 'f' || id[1] === 'x';
export const isHonor = (id: TileId) => id[1] === 'z';
export const isSuited = (id: TileId) => 'mps'.includes(id[1]);
export const isTerminal = (id: TileId) => isSuited(id) && (id[0] === '1' || id[0] === '9');

/** Sort key: Characters, Dots, Bamboo, honors (E S W N White Green Red), flowers, seasons. */
export function tileSortKey(id: TileId): number {
  return GROUP_ORDER.indexOf(tileSuitLetter(id)) * 10 + tileRank(id);
}

export const sortTileIds = (ids: TileId[]) => [...ids].sort((a, b) => tileSortKey(a) - tileSortKey(b));

/** Every tile type that is in play under these rules, in display order. */
export function tileTypesForRules(rules: Ruleset): TileId[] {
  const ids: TileId[] = [];
  for (const suit of rules.tiles.suits) {
    for (let r = 1; r <= 9; r++) ids.push(`${r}${SUIT_LETTER[suit]}`);
  }
  if (rules.tiles.winds) ids.push('1z', '2z', '3z', '4z');
  if (rules.tiles.dragons) ids.push('5z', '6z', '7z');
  if (rules.tiles.bonus.flowers) ids.push('1f', '2f', '3f', '4f');
  if (rules.tiles.bonus.seasons) ids.push('1x', '2x', '3x', '4x');
  return sortTileIds(ids);
}

/** The physical set: 4 copies of each suit/honor tile, 1 of each bonus tile. */
export function buildTileSet(rules: Ruleset): TileInstance[] {
  const out: TileInstance[] = [];
  let uid = 0;
  for (const id of tileTypesForRules(rules)) {
    const copies = isBonus(id) ? 1 : 4;
    for (let c = 0; c < copies; c++) out.push({ uid: uid++, id });
  }
  return out;
}
