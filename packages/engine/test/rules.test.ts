import { describe, expect, it } from 'vitest';
import { buildTileSet, evaluateWhen, isOverridden, resolveRules, ruleValue, tileTypesForRules } from '../src';
import { casual, mcrProfile, NO_FLOWERS, rules, ruleset } from './helpers';

describe('tile set', () => {
  it('has 144 tiles with flowers and seasons', () => {
    expect(buildTileSet(ruleset)).toHaveLength(144);
    expect(tileTypesForRules(ruleset)).toHaveLength(42);
  });
  it('has 136 tiles without them', () => {
    const r = rules(NO_FLOWERS);
    expect(buildTileSet(r.ruleset)).toHaveLength(136);
    expect(tileTypesForRules(r.ruleset)).toHaveLength(34);
  });
  it('gives every physical tile a unique uid', () => {
    const uids = buildTileSet(ruleset).map((t) => t.uid);
    expect(new Set(uids).size).toBe(uids.length);
  });
});

describe('resolveRules', () => {
  it('derives 18x2 walls with flowers', () => {
    const r = rules();
    expect(r.derived).toMatchObject({ tileCount: 144, stacksPerWall: 18, tilesPerWall: 36, deadWallTiles: 14 });
  });
  it('derives 17x2 walls without flowers', () => {
    const r = rules(NO_FLOWERS);
    expect(r.derived).toMatchObject({ tileCount: 136, stacksPerWall: 17, tilesPerWall: 34, bonusTiles: 0 });
  });
  it('rejects a tile count that does not fit the walls', () => {
    expect(() => rules({ 'tiles.bonus.flowers': false })).toThrow(/Wall size mismatch/);
  });
  it('rejects unknown house-rule paths', () => {
    expect(() => rules({ 'claims.chow.fromAcross': true })).toThrow(/does not exist/);
  });
  it('rejects invalid values', () => {
    expect(() => rules({ 'claims.chow.from': 'across' })).toThrow();
  });
  it('applies profile overrides and records what changed', () => {
    const r = resolveRules(ruleset, mcrProfile, { 'profile.minimumFan': 3, ...NO_FLOWERS });
    expect(r.profile.minimumFan).toBe(3);
    expect(ruleValue(r, 'profile.minimumFan')).toBe(3);
    expect(isOverridden(r, 'profile.minimumFan')).toBe(true);
    expect(isOverridden(r, 'tiles.bonus')).toBe(true);
    expect(isOverridden(r, 'claims')).toBe(false);
  });
  it('does not mutate the base ruleset', () => {
    rules(NO_FLOWERS);
    expect(ruleset.tiles.bonus.flowers).toBe(true);
    expect(casual.minimumFan).toBe(0);
  });
});

describe('evaluateWhen', () => {
  const withF = rules();
  const without = rules(NO_FLOWERS);
  it('matches plain values', () => {
    expect(evaluateWhen({ 'claims.chow.from': 'left' }, withF)).toBe(true);
    expect(evaluateWhen({ 'tiles.bonus.flowers': true }, without)).toBe(false);
  });
  it('supports in / not and derived values', () => {
    expect(evaluateWhen({ 'derived.bonusTiles': { not: 0 } }, withF)).toBe(true);
    expect(evaluateWhen({ 'derived.bonusTiles': { not: 0 } }, without)).toBe(false);
    expect(evaluateWhen({ 'derived.stacksPerWall': { in: [17, 18] } }, without)).toBe(true);
  });
  it('treats a missing condition as true', () => {
    expect(evaluateWhen(undefined, without)).toBe(true);
  });
});
