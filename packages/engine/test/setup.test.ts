import { describe, expect, it } from 'vitest';
import {
  breakPosition,
  buildWalkthrough,
  chooseSide,
  isBonus,
  remainingTiles,
  stackLocation,
  takeTile,
  walkReducer,
  type Snapshot,
  type Stack,
} from '../src';
import { NO_FLOWERS, rules } from './helpers';

const TURN = ['E', 'S', 'W', 'N'] as const;
const handSizes = (s: Snapshot) => TURN.map((seat) => s.hands[seat].length);

describe('breakPosition', () => {
  it("reproduces the booklet's example (2+4 → South, +1+3 = 10, dealer takes stacks 11–12)", () => {
    expect(chooseSide('E', 6)).toBe('S');
    const b = breakPosition({ dealer: 'E', dealerRoll: 6, sideRoll: 4, stacksPerWall: 18, deadWallStacks: 7, overflow: 'continueToNextWall' });
    expect(b.side).toBe('S');
    expect(b.total).toBe(10);
    // pos is 0-based from the owner's right end: stack 10 → pos 9, stack 11 → pos 10.
    expect(stackLocation(b.lastCounted, 18)).toEqual({ seat: 'S', pos: 9 });
    expect(stackLocation(b.liveStart, 18)).toEqual({ seat: 'S', pos: 10 });
    expect(b.deadWall.map((i) => stackLocation(i, 18).pos)).toEqual([9, 8, 7, 6, 5, 4, 3]);
  });

  it('counts dealer-first counter-clockwise for every dice total', () => {
    const expected = ['E', 'S', 'W', 'N'];
    for (let t = 2; t <= 12; t++) expect(chooseSide('E', t)).toBe(expected[(t - 1) % 4]);
  });

  it.each([18, 19, 20, 21, 22, 23, 24])('continues onto the next wall when the total is %i (17-stack walls)', (total) => {
    const b = breakPosition({ dealer: 'E', dealerRoll: 5, sideRoll: total - 5, stacksPerWall: 17, deadWallStacks: 7, overflow: 'continueToNextWall' });
    expect(b.side).toBe('E'); // 5 → East
    // Counting runs right-to-left along East's wall, then onto North's wall (clockwise).
    expect(stackLocation(b.lastCounted, 17)).toEqual({ seat: 'N', pos: total - 17 - 1 });
  });

  it('can wrap on the same wall instead', () => {
    const b = breakPosition({ dealer: 'E', dealerRoll: 5, sideRoll: 15, stacksPerWall: 17, deadWallStacks: 7, overflow: 'wrapSameWall' });
    expect(stackLocation(b.lastCounted, 17)).toEqual({ seat: 'E', pos: 2 });
  });

  it('puts small totals partly onto the previous wall for the dead wall', () => {
    const b = breakPosition({ dealer: 'E', dealerRoll: 2, sideRoll: 2, stacksPerWall: 17, deadWallStacks: 7, overflow: 'continueToNextWall' });
    expect(b.side).toBe('S');
    // South's right-hand end meets West's left-hand end, so the dead wall spills onto West's wall.
    expect(stackLocation(b.deadWall[6], 17).seat).toBe('W');
  });
});

describe('takeTile', () => {
  it('takes top before bottom and skips empty stacks', () => {
    const ring: Stack[] = [[0, 1], [null, null], [2, 3]];
    expect(takeTile(ring, 0, 1)).toEqual({ uid: 0, cursor: 0 });
    expect(takeTile(ring, 0, 1)).toEqual({ uid: 1, cursor: 0 });
    expect(takeTile(ring, 0, 1)).toEqual({ uid: 2, cursor: 2 });
    expect(takeTile(ring, 0, -1)).toEqual({ uid: 3, cursor: 2 });
    expect(takeTile(ring, 0, 1)).toBeNull();
  });
});

describe('buildWalkthrough', () => {
  it.each(['twoAtOnce', 'oneThenOne'] as const)('deals 14/13/13/13 (%s)', (mode) => {
    const w = buildWalkthrough(rules(NO_FLOWERS), { scenario: 'random', seed: 7, dealerExtraMode: mode });
    const extra = w.snapshots.find((s) => s.step === 'dealerExtra')!;
    expect(handSizes(extra)).toEqual([14, 13, 13, 13]);
    expect(remainingTiles(extra)).toBe(136 - 53);
    const last = w.snapshots[w.snapshots.length - 1];
    expect(last.step).toBe('firstDiscard');
    expect(handSizes(last)).toEqual([13, 13, 13, 13]);
    expect(last.discards).toHaveLength(1);
  });

  it('follows the booklet example dice', () => {
    const w = buildWalkthrough(rules(), { scenario: 'booklet-example', seed: 1 });
    const brk = w.snapshots.find((s) => s.step === 'breakWall')!;
    expect(brk.dice).toEqual({ side: [2, 4], count: [1, 3] });
    expect(brk.side).toBe('S');
    expect(brk.total).toBe(10);
    expect(stackLocation(brk.liveStart!, 18)).toEqual({ seat: 'S', pos: 10 });
    expect(brk.deadWall).toHaveLength(7);
  });

  it('marks a 14-tile dead wall', () => {
    const w = buildWalkthrough(rules(NO_FLOWERS), { scenario: 'random', seed: 3 });
    const s = w.snapshots.find((x) => x.step === 'markDeadWall')!;
    const tiles = s.deadWall!.reduce((n, i) => n + s.ring[i].filter((u) => u !== null).length, 0);
    expect(tiles).toBe(14);
  });

  it('skips flower replacement when flowers are off', () => {
    const w = buildWalkthrough(rules(NO_FLOWERS), { scenario: 'random', seed: 3 });
    expect(w.snapshots.some((s) => s.step === 'replaceBonus')).toBe(false);
    expect(w.tiles).toHaveLength(136);
  });

  it('replaces every bonus tile until no hand holds one', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const w = buildWalkthrough(rules(), { scenario: 'random', seed });
      const idOf = (u: number) => w.tiles[u].id;
      const steps = w.snapshots.filter((s) => s.step === 'replaceBonus');
      expect(steps.length).toBeGreaterThan(0);
      const after = steps[steps.length - 1];
      for (const seat of TURN) expect(after.hands[seat].some((u) => isBonus(idOf(u)))).toBe(false);
      expect(handSizes(after)).toEqual([14, 13, 13, 13]);
      const exposed = TURN.reduce((n, seat) => n + after.bonus[seat].length, 0);
      expect(remainingTiles(after)).toBe(144 - 53 - exposed);
    }
  });

  it('finds a seed that exercises the repeat-replacement loop', () => {
    let found = false;
    for (let seed = 1; seed <= 400 && !found; seed++) {
      const w = buildWalkthrough(rules(), { scenario: 'random', seed });
      found = w.snapshots.some((s) => s.events.some((e) => e.kind === 'bonus' && e.replacement !== null && isBonus(w.tiles[e.replacement].id)));
    }
    expect(found).toBe(true);
  });

  it('is deterministic for a seed', () => {
    const a = buildWalkthrough(rules(), { scenario: 'random', seed: 99 });
    const b = buildWalkthrough(rules(), { scenario: 'random', seed: 99 });
    expect(a).toEqual(b);
    const c = buildWalkthrough(rules(), { scenario: 'random', seed: 100 });
    expect(c.snapshots).not.toEqual(a.snapshots);
  });

  it('keeps every tile accounted for in every snapshot', () => {
    const w = buildWalkthrough(rules(), { scenario: 'random', seed: 5 });
    for (const s of w.snapshots.filter((x) => x.wallsBuilt)) {
      const inHands = TURN.reduce((n, seat) => n + s.hands[seat].length + s.bonus[seat].length, 0);
      expect(remainingTiles(s) + inHands + s.discards.length).toBe(144);
    }
  });
});

describe('walkReducer', () => {
  it('steps forward and back within bounds, and Back restores the same snapshot', () => {
    const w = buildWalkthrough(rules(), { scenario: 'booklet-example', seed: 1 });
    let st = { index: 0, length: w.snapshots.length };
    st = walkReducer(st, { type: 'back' });
    expect(st.index).toBe(0);
    st = walkReducer(st, { type: 'next' });
    st = walkReducer(st, { type: 'next' });
    const at2 = w.snapshots[st.index];
    st = walkReducer(st, { type: 'next' });
    st = walkReducer(st, { type: 'back' });
    expect(w.snapshots[st.index]).toBe(at2);
    st = walkReducer(st, { type: 'goto', index: 999 });
    expect(st.index).toBe(w.snapshots.length - 1);
    expect(walkReducer(st, { type: 'reset' }).index).toBe(0);
  });
});
