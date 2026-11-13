import type { Seat } from '../ruleset/schema';

/**
 * Wall geometry.
 *
 * Top-down view as in the booklet: East at the bottom, South on the right,
 * West at the top, North on the left. Turns go counter-clockwise (E → S → W → N),
 * i.e. to the player on your right.
 *
 * Each player's wall sits in front of them. Stacks are counted from the owner's
 * right-hand end towards their left, which runs clockwise around the table.
 * We therefore store all stacks as one "ring", walls in clockwise order
 * E → N → W → S, each from its owner's right end (pos 0) to left end.
 * Counting stacks, dealing and drawing from the live wall all move forward
 * (+1) around the ring. Replacement tiles are drawn backward from the break.
 */

export const TURN_ORDER: Seat[] = ['E', 'S', 'W', 'N'];
export const RING_ORDER: Seat[] = ['E', 'N', 'W', 'S'];

/** The seat n turns after `seat` (counter-clockwise). */
export function seatAfter(seat: Seat, n: number): Seat {
  const i = TURN_ORDER.indexOf(seat);
  return TURN_ORDER[(((i + n) % 4) + 4) % 4];
}

export const wallStartIndex = (seat: Seat, stacksPerWall: number) => RING_ORDER.indexOf(seat) * stacksPerWall;

export function stackLocation(ringIndex: number, stacksPerWall: number): { seat: Seat; pos: number } {
  const len = stacksPerWall * 4;
  const i = ((ringIndex % len) + len) % len;
  return { seat: RING_ORDER[Math.floor(i / stacksPerWall)], pos: i % stacksPerWall };
}

/** Count `total` players counter-clockwise starting with (and counting) the dealer. */
export function chooseSide(dealer: Seat, total: number): Seat {
  return seatAfter(dealer, total - 1);
}

export interface BreakInput {
  dealer: Seat;
  dealerRoll: number;
  sideRoll: number;
  stacksPerWall: number;
  deadWallStacks: number;
  overflow: 'continueToNextWall' | 'wrapSameWall';
}

export interface BreakResult {
  side: Seat;
  total: number;
  /** Ring index of the last stack counted (just right of the break). */
  lastCounted: number;
  /** Ring index of the first live stack (the dealer's first tiles). */
  liveStart: number;
  /** Dead-wall stacks, nearest the break first (replacement draw order). */
  deadWall: number[];
}

const mod = (n: number, m: number) => ((n % m) + m) % m;

export function breakPosition(input: BreakInput): BreakResult {
  const { dealer, dealerRoll, sideRoll, stacksPerWall, deadWallStacks, overflow } = input;
  const ringLen = stacksPerWall * 4;
  const side = chooseSide(dealer, dealerRoll);
  const total = dealerRoll + sideRoll;
  const start = wallStartIndex(side, stacksPerWall);
  const lastCounted =
    overflow === 'wrapSameWall'
      ? start + mod(total - 1, stacksPerWall)
      : mod(start + total - 1, ringLen);
  const deadWall = Array.from({ length: deadWallStacks }, (_, k) => mod(lastCounted - k, ringLen));
  return { side, total, lastCounted, liveStart: mod(lastCounted + 1, ringLen), deadWall };
}

/** A stack: [top, bottom], each a tile uid or null once taken. */
export type Stack = (number | null)[];

/**
 * Take the next tile walking from `cursor` in `direction` (+1 live wall, -1 replacement).
 * Returns the uid and the updated cursor, or null when the wall is empty.
 */
export function takeTile(
  ring: Stack[],
  cursor: number,
  direction: 1 | -1,
): { uid: number; cursor: number } | null {
  const len = ring.length;
  for (let step = 0; step < len; step++) {
    const i = mod(cursor + step * direction, len);
    const stack = ring[i];
    const level = stack.findIndex((u) => u !== null);
    if (level >= 0) {
      const uid = stack[level] as number;
      stack[level] = null;
      return { uid, cursor: i };
    }
  }
  return null;
}

export const tilesLeft = (ring: Stack[]) => ring.reduce((n, s) => n + s.filter((u) => u !== null).length, 0);
