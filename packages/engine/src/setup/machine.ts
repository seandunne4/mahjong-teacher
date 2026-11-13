import type { DealerExtraMode, Seat } from '../ruleset/schema';
import type { ResolvedRules } from '../ruleset/resolve';
import { buildTileSet, isBonus, isHonor, isTerminal, tileSortKey, type TileInstance } from '../tiles';
import { mulberry32, rollDice, shuffle, type Rng } from './rng';
import { breakPosition, seatAfter, takeTile, tilesLeft, TURN_ORDER, type Stack } from './wall';

/**
 * Setup walkthrough as a pure, deterministic state machine.
 * buildWalkthrough() precomputes one snapshot per step from (rules, seed, scenario),
 * and walkReducer() moves an index through them, so Back restores the exact
 * previous state and the UI only animates the difference between snapshots.
 */

export type StepId =
  | 'seating'
  | 'chooseDealer'
  | 'shuffle'
  | 'buildWalls'
  | 'rollForSide'
  | 'rollForCount'
  | 'breakWall'
  | 'markDeadWall'
  | `deal-${number}`
  | 'dealerExtra'
  | 'replaceBonus'
  | 'firstDiscard';

export type Scenario = 'booklet-example' | 'random';

export interface SetupOptions {
  scenario: Scenario;
  seed: number;
  dealerExtraMode?: DealerExtraMode;
}

export type SetupEvent =
  | { kind: 'take'; seat: Seat; uids: number[]; from: 'live' | 'replacement' }
  | { kind: 'bonus'; seat: Seat; uid: number; replacement: number | null }
  | { kind: 'discard'; seat: Seat; uid: number }
  | { kind: 'roll'; seat: Seat; dice: number[] };

export interface Snapshot {
  step: StepId;
  /** For deal-N and replaceBonus snapshots. */
  round?: number;
  seat?: Seat;
  players: Record<Seat, string> | null;
  dealer: Seat;
  shuffled: boolean;
  wallsBuilt: boolean;
  dice: { side?: number[]; count?: number[] };
  side?: Seat;
  total?: number;
  lastCounted?: number;
  liveStart?: number;
  deadWall?: number[];
  showDeadWall: boolean;
  ring: Stack[];
  hands: Record<Seat, number[]>;
  bonus: Record<Seat, number[]>;
  discards: number[];
  liveCursor: number;
  replacementCursor: number;
  highlight: { stacks: number[]; seats: Seat[]; uids: number[] };
  events: SetupEvent[];
}

export interface Walkthrough {
  options: Required<SetupOptions>;
  tiles: TileInstance[];
  stacksPerWall: number;
  height: number;
  snapshots: Snapshot[];
}

/** The booklet's worked example: dealer rolls 2+4 = 6 → South; South rolls 1+3 → 10 stacks. */
export const BOOKLET_DICE = { dealer: [2, 4], side: [1, 3] } as const;
export const PLAYER_NAMES = ['Player A', 'Player B', 'Player C', 'Player D'];

const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T;
const emptySeats = <T>(make: () => T): Record<Seat, T> => ({ E: make(), S: make(), W: make(), N: make() });
const sum = (xs: readonly number[]) => xs.reduce((a, b) => a + b, 0);

export function buildWalkthrough(rules: ResolvedRules, opts: SetupOptions): Walkthrough {
  const { ruleset, derived } = rules;
  const options: Required<SetupOptions> = {
    dealerExtraMode: ruleset.deal.defaultDealerExtraMode,
    ...opts,
  };
  const rng: Rng = mulberry32(options.seed);
  const tiles = buildTileSet(ruleset);
  const idOf = (uid: number) => tiles[uid].id;
  const spw = derived.stacksPerWall;
  const height = ruleset.walls.height;
  const dealer: Seat = 'E';

  const st: Snapshot = {
    step: 'seating',
    players: null,
    dealer,
    shuffled: false,
    wallsBuilt: false,
    dice: {},
    showDeadWall: false,
    ring: Array.from({ length: spw * 4 }, () => Array<number | null>(height).fill(null)),
    hands: emptySeats(() => []),
    bonus: emptySeats(() => []),
    discards: [],
    liveCursor: 0,
    replacementCursor: 0,
    highlight: { stacks: [], seats: [], uids: [] },
    events: [],
  };
  const snapshots: Snapshot[] = [];
  const push = (step: StepId, extra: Partial<Snapshot> = {}) => {
    Object.assign(st, { step, round: undefined, seat: undefined }, extra);
    snapshots.push(clone(st));
    st.highlight = { stacks: [], seats: [], uids: [] };
    st.events = [];
  };

  // 1. Seating: players draw wind tiles at random.
  const winds = shuffle(TURN_ORDER, rng);
  const players = emptySeats(() => '');
  winds.forEach((seat, i) => (players[seat] = PLAYER_NAMES[i]));
  push('seating', { players, highlight: { stacks: [], seats: [...TURN_ORDER], uids: [] } });

  // 2. Dealer: East starts as dealer.
  push('chooseDealer', { highlight: { stacks: [], seats: [dealer], uids: [] } });

  // 3. Shuffle, 4. build walls.
  const order = shuffle(tiles.map((t) => t.uid), rng);
  push('shuffle', { shuffled: true });
  order.forEach((uid, i) => {
    st.ring[Math.floor(i / height)][i % height] = uid;
  });
  push('buildWalls', { wallsBuilt: true });

  // 5–7. Dice and break.
  const booklet = options.scenario === 'booklet-example';
  const dealerDice = booklet ? [...BOOKLET_DICE.dealer] : rollDice(rng, ruleset.wallBreak.dice);
  const sideDice = booklet ? [...BOOKLET_DICE.side] : rollDice(rng, ruleset.wallBreak.dice);
  const brk = breakPosition({
    dealer,
    dealerRoll: sum(dealerDice),
    sideRoll: sum(sideDice),
    stacksPerWall: spw,
    deadWallStacks: ruleset.deadWall.stacks,
    overflow: ruleset.wallBreak.overflow,
  });
  st.events = [{ kind: 'roll', seat: dealer, dice: dealerDice }];
  push('rollForSide', {
    dice: { side: dealerDice },
    side: brk.side,
    highlight: { stacks: [], seats: [brk.side], uids: [] },
  });
  st.events = [{ kind: 'roll', seat: brk.side, dice: sideDice }];
  const counted = Array.from({ length: brk.total }, (_, k) => (brk.lastCounted - k + spw * 8) % (spw * 4));
  push('rollForCount', {
    dice: { side: dealerDice, count: sideDice },
    total: brk.total,
    highlight: { stacks: counted, seats: [brk.side], uids: [] },
  });
  st.lastCounted = brk.lastCounted;
  st.liveStart = brk.liveStart;
  st.deadWall = brk.deadWall;
  st.liveCursor = brk.liveStart;
  st.replacementCursor = brk.lastCounted;
  push('breakWall', {
    highlight: { stacks: [brk.liveStart, (brk.liveStart + 1) % (spw * 4)], seats: [dealer], uids: [] },
  });
  push('markDeadWall', { showDeadWall: true, highlight: { stacks: [...brk.deadWall], seats: [], uids: [] } });

  // Drawing helpers.
  const drawLive = (seat: Seat, n: number) => {
    const uids: number[] = [];
    for (let k = 0; k < n; k++) {
      const got = takeTile(st.ring, st.liveCursor, 1);
      if (!got) throw new Error('Live wall ran out during setup');
      st.liveCursor = got.cursor;
      uids.push(got.uid);
    }
    st.hands[seat].push(...uids);
    st.events.push({ kind: 'take', seat, uids, from: 'live' });
    st.highlight.uids.push(...uids);
  };
  const drawReplacement = (): number | null => {
    const got = takeTile(st.ring, st.replacementCursor, -1);
    if (!got) return null;
    st.replacementCursor = got.cursor;
    return got.uid;
  };
  const sortHands = () => {
    for (const s of TURN_ORDER) st.hands[s].sort((a, b) => tileSortKey(idOf(a)) - tileSortKey(idOf(b)) || a - b);
  };

  // 8. Deal rounds (4-4-4), counter-clockwise from the dealer.
  ruleset.deal.rounds.forEach((n, r) => {
    for (let k = 0; k < 4; k++) drawLive(seatAfter(dealer, k), n);
    push(`deal-${r + 1}`, { round: r + 1 });
  });

  // 9. Dealer's extra tile(s).
  const each = ruleset.deal.handSize - sum(ruleset.deal.rounds);
  const extra = ruleset.deal.dealerExtra;
  if (options.dealerExtraMode === 'twoAtOnce') {
    drawLive(dealer, each + extra);
    for (let k = 1; k < 4; k++) drawLive(seatAfter(dealer, k), each);
  } else {
    for (let k = 0; k < 4; k++) drawLive(seatAfter(dealer, k), each);
    drawLive(dealer, extra);
  }
  sortHands();
  push('dealerExtra', { highlight: { ...st.highlight, seats: [dealer] } });

  // 10. Flower/season replacement (only when bonus tiles are in play).
  if (derived.hasBonus) {
    let any = false;
    for (let k = 0; k < 4; k++) {
      const seat = seatAfter(dealer, k);
      let found = false;
      for (;;) {
        const uid = st.hands[seat].find((u) => isBonus(idOf(u)));
        if (uid === undefined) break;
        found = true;
        st.hands[seat] = st.hands[seat].filter((u) => u !== uid);
        st.bonus[seat].push(uid);
        const replacement = drawReplacement();
        if (replacement !== null) st.hands[seat].push(replacement);
        st.events.push({ kind: 'bonus', seat, uid, replacement });
        st.highlight.uids.push(uid, ...(replacement !== null ? [replacement] : []));
      }
      if (found) {
        any = true;
        sortHands();
        push('replaceBonus', { seat, highlight: { ...st.highlight, seats: [seat] } });
      }
    }
    if (!any) push('replaceBonus');
  }

  // 11. First discard: a lone honor or terminal if possible.
  const hand = st.hands[dealer];
  const count = (id: string) => hand.filter((u) => idOf(u) === id).length;
  const score = (u: number) => {
    const id = idOf(u);
    if (count(id) > 1) return 0;
    return isHonor(id) ? 3 : isTerminal(id) ? 2 : 1;
  };
  const discard = [...hand].sort((a, b) => score(b) - score(a) || a - b)[0];
  st.hands[dealer] = hand.filter((u) => u !== discard);
  st.discards.push(discard);
  st.events = [{ kind: 'discard', seat: dealer, uid: discard }];
  push('firstDiscard', { highlight: { stacks: [], seats: [dealer], uids: [discard] } });

  return { options, tiles, stacksPerWall: spw, height, snapshots };
}

export const remainingTiles = (s: Snapshot) => tilesLeft(s.ring);

/* ------------------------------------------------------------------ */
/* Reducer for stepping through snapshots                              */
/* ------------------------------------------------------------------ */

export interface WalkState {
  index: number;
  length: number;
}
export type WalkAction = { type: 'next' } | { type: 'back' } | { type: 'reset' } | { type: 'goto'; index: number };

export function walkReducer(state: WalkState, action: WalkAction): WalkState {
  const clamp = (i: number) => Math.max(0, Math.min(state.length - 1, i));
  switch (action.type) {
    case 'next':
      return { ...state, index: clamp(state.index + 1) };
    case 'back':
      return { ...state, index: clamp(state.index - 1) };
    case 'reset':
      return { ...state, index: 0 };
    case 'goto':
      return { ...state, index: clamp(action.index) };
  }
}
