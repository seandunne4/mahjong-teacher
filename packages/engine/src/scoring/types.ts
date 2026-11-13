import type { TileId } from '../ruleset/schema';
import type { Seat } from '../ruleset/schema';

/**
 * Phase 3 interfaces. Phase 1 ships these types and an empty registry so the
 * pattern data (detector keys) can be validated now and filled in later.
 */

export type SetKind = 'chow' | 'pung' | 'kong' | 'pair' | 'knitted' | 'single';

export interface DecomposedSet {
  kind: SetKind;
  tiles: TileId[];
  concealed: boolean;
}

export interface DecomposedHand {
  shape: 'standard' | 'sevenPairs' | 'thirteenOrphans' | 'knitted';
  sets: DecomposedSet[];
  bonus: TileId[];
}

export interface WinContext {
  winningTile: TileId;
  selfDrawn: boolean;
  seatWind: Seat;
  prevalentWind: Seat;
  lastTile: boolean;
  replacementTile: boolean;
  robbedKong: boolean;
}

export type Detector = (hand: DecomposedHand, ctx: WinContext) => boolean;

/** Filled in Phase 3, keyed by Pattern.detector (e.g. "mcr.bigFourWinds"). */
export const detectorRegistry: Record<string, Detector> = {};
