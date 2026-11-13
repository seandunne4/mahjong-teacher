import { describe, expect, it } from 'vitest';
import tilesJson from '@mj/data/tiles.json';
import glossaryJson from '@mj/data/glossary.json';
import patternsJson from '@mj/data/patterns/mcr.json';
import {
  checkTileCount,
  GlossarySchema,
  parseHand,
  PatternLibrarySchema,
  TileCatalogueSchema,
  tileTypesForRules,
} from '../src';
import { ruleset } from './helpers';

const tiles = TileCatalogueSchema.parse(tilesJson);
const patterns = PatternLibrarySchema.parse(patternsJson);
GlossarySchema.parse(glossaryJson);

/** The booklet's scoring examples, transcribed from the PDF (pp. 14–19). */
const BOOKLET: Record<number, string[]> = {
  88: ['Big Four Winds', 'Big Three Dragons', 'All Green', 'Nine Gates', 'Thirteen Orphans'],
  64: ['All Terminals', 'Little Four Winds', 'Little Three Dragons', 'All Honors', 'Pure Terminal Chows'],
  48: ['Quadruple Chow', 'Four Pure Shifted Pungs'],
  32: ['Four Pure Shifted Chows', 'Three Kongs', 'All Terminals and Honors'],
  24: ['Seven Pairs', 'Greater Honors and Knitted Tiles', 'Full Flush', 'Upper Tiles'],
  16: ['Pure Straight', 'Three-Suited Terminal Chows', 'Pure Shifted Chows', 'All Fives', 'Triple Pung'],
  12: ['Lesser Honors and Knitted Tiles', 'Knitted Straight', 'Upper Four', 'Lower Four', 'Big Three Winds'],
  8: ['Mixed Straight', 'Reversible Tiles', 'Mixed Triple Chow', 'Mixed Shifted Pungs', 'Chicken Hand'],
  6: ['All Pungs', 'Half Flush', 'Mixed Shifted Chows', 'All Types'],
  4: ['Outside Hand', 'Two Melded Kongs'],
  2: ['Dragon Pung', 'Prevalent Wind', 'Seat Wind', 'All Chows', 'Tile Hog', 'Two Concealed Pungs', 'Concealed Kong'],
  1: ['Pure Double Chow', 'Mixed Double Chow', 'Short Straight', 'Two Terminal Chows', 'Pung of Terminals or Honors', 'Melded Kong', 'One Voided Suit', 'No Honors', 'Flower Tiles'],
};

describe('tiles.json', () => {
  it('has all 42 tile types matching the ruleset, in order', () => {
    expect(tiles.map((t) => t.id)).toEqual(tileTypesForRules(ruleset));
  });
  it('has unique ids and complete names', () => {
    expect(new Set(tiles.map((t) => t.id)).size).toBe(42);
    for (const t of tiles) {
      expect(t.hanzi.trad && t.hanzi.simp && t.pinyin.marks && t.english).toBeTruthy();
    }
  });
  it('uses 4 copies for suit/honor tiles and 1 for bonus tiles', () => {
    for (const t of tiles) expect(t.copies).toBe(t.group === 'bonus' ? 1 : 4);
  });
  it('only lists real look-alikes', () => {
    const ids = new Set(tiles.map((t) => t.id));
    for (const t of tiles) for (const l of t.lookAlikes ?? []) expect(ids.has(l)).toBe(true);
  });
});

describe('patterns/mcr.json', () => {
  it('has the 81 MCR patterns with unique ids and detectors', () => {
    expect(patterns).toHaveLength(81);
    expect(new Set(patterns.map((p) => p.id)).size).toBe(81);
    expect(new Set(patterns.map((p) => p.detector)).size).toBe(81);
  });
  it('has the standard number of patterns at each fan value', () => {
    const counts: Record<number, number> = {};
    for (const p of patterns) counts[p.fan] = (counts[p.fan] ?? 0) + 1;
    expect(counts).toEqual({ 88: 7, 64: 6, 48: 2, 32: 3, 24: 9, 16: 6, 12: 5, 8: 9, 6: 7, 4: 4, 2: 10, 1: 13 });
  });
  it("flags exactly the booklet's patterns, at the booklet's fan values", () => {
    const flagged = patterns.filter((p) => p.inBooklet);
    const expected = Object.entries(BOOKLET).flatMap(([fan, names]) => names.map((n) => `${fan}:${n}`));
    expect(flagged.map((p) => `${p.fan}:${p.nameEn}`).sort()).toEqual(expected.sort());
    expect(flagged).toHaveLength(56);
  });
  it('only excludes patterns that exist and are worth less or equal', () => {
    const byId = new Map(patterns.map((p) => [p.id, p]));
    for (const p of patterns) {
      for (const x of p.excludes) {
        expect(byId.has(x), `${p.id} excludes unknown ${x}`).toBe(true);
        expect(byId.get(x)!.fan).toBeLessThanOrEqual(p.fan);
      }
    }
  });
  it.each(patterns.map((p) => [p.id, p.example]))('%s example is a legal 14-tile hand', (_id, example) => {
    const r = checkTileCount(parseHand(example));
    expect(r.ok, r.reason).toBe(true);
  });
});
