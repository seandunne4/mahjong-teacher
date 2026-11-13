import type { ResolvedRules, Seat, Snapshot, Walkthrough } from '@mj/engine';
import { seatAfter } from '@mj/engine';
import { tileById } from '../data';

export const SEAT_NAME: Record<Seat, string> = { E: 'East', S: 'South', W: 'West', N: 'North' };
export const SEAT_HANZI: Record<Seat, string> = { E: '東', S: '南', W: '西', N: '北' };

export interface StepText {
  title: string;
  caption: string;
  why: string;
}

const sum = (xs: number[] = []) => xs.reduce((a, b) => a + b, 0);
const ordinal = ['first', 'second', 'third', 'fourth', 'fifth'];

/** Short, plain-English captions for each walkthrough snapshot. Text lives here, not in the engine. */
export function stepText(s: Snapshot, w: Walkthrough, rules: ResolvedRules): StepText {
  const d = rules.derived;
  const name = (seat: Seat) => `${SEAT_NAME[seat]}${s.players ? ` (${s.players[seat]})` : ''}`;
  const tileName = (uid: number) => tileById.get(w.tiles[uid].id)?.english ?? w.tiles[uid].id;

  switch (s.step) {
    case 'seating':
      return {
        title: 'Seating',
        caption:
          'Each player draws one face-down wind tile to pick a seat. Seats go East → South → West → North counter-clockwise, so South sits on East’s right.',
        why: 'It isn’t laid out like a map: the order follows play, which passes to your right. Random seats also stop two friends from feeding each other discards. Beginners can skip this and just sit down.',
      };
    case 'chooseDealer':
      return {
        title: 'Choose the dealer',
        caption: `The player in the East seat starts as dealer (莊 zhuāng): ${s.players?.E ?? 'East'}.`,
        why: 'If you skipped seating: everyone rolls two dice and the highest total becomes dealer and takes East. Or, traditionally, the host rolls and counts counter-clockwise around the table starting with themselves; whoever the count lands on is dealer.',
      };
    case 'shuffle':
      return {
        title: 'Shuffle',
        caption: `Turn all ${d.tileCount} tiles face down in the middle and shuffle them, as loudly as you like.`,
        why: d.hasBonus
          ? 'With the 8 flower and season tiles that’s 144 tiles. Leave out the 2 blank spares.'
          : 'Your house rules leave out the 8 flower and season tiles, so it’s 136. Leave out the 2 blank spares too.',
      };
    case 'buildWalls':
      return {
        title: 'Build the walls',
        caption: `Each player builds a wall ${d.stacksPerWall} stacks long and 2 tiles high (${d.tilesPerWall} tiles) in front of them, then the four walls are pushed into a square.`,
        why: `${d.stacksPerWall} stacks × 2 high × 4 walls = ${d.tileCount} tiles. With flowers it’s 18 stacks per wall; without them, 17.`,
      };
    case 'rollForSide': {
      const total = sum(s.dice.side);
      const count = Array.from({ length: total }, (_, i) => `${i + 1} ${SEAT_NAME[seatAfter(s.dealer, i)]}`).join(', ');
      return {
        title: 'Dealer rolls: which wall?',
        caption: `The dealer rolls ${s.dice.side?.join(' + ')} = ${total}. Count players counter-clockwise starting with the dealer as 1: it lands on ${SEAT_NAME[s.side!]}.`,
        why: `Counting: ${count}. The wall in front of ${SEAT_NAME[s.side!]} is where it will break.`,
      };
    }
    case 'rollForCount': {
      const first = sum(s.dice.side);
      const overflow = (s.total ?? 0) > w.stacksPerWall;
      return {
        title: 'Second roll: which stack?',
        caption: `${SEAT_NAME[s.side!]} rolls ${s.dice.count?.join(' + ')} = ${sum(s.dice.count)}. Add the dealer’s ${first}: ${s.total}. Count ${s.total} stacks along ${SEAT_NAME[s.side!]}’s wall, from that player’s right to their left.${overflow ? ' That’s longer than one wall, so keep counting onto the next wall.' : ''}`,
        why: 'In the booklet’s example the dealer rolls 2 + 4 = 6 (South), South rolls 1 + 3 = 4, and 6 + 4 = 10 stacks are counted on South’s wall.',
      };
    }
    case 'breakWall':
      return {
        title: 'Break the wall',
        caption: `Break the wall after stack ${s.total}. The dealer takes the next 2 stacks to the left (4 tiles). Everything from here onward is the live wall.`,
        why: 'Tiles are always drawn from the live wall in order, starting at the break and moving along the wall clockwise around the table.',
      };
    case 'markDeadWall':
      return {
        title: 'Mark the dead wall',
        caption: `The ${rules.ruleset.deadWall.stacks} stacks (${d.deadWallTiles} tiles) just right of the break are the dead wall. Replacement tiles for kongs${d.hasBonus ? ' and flowers' : ''} come from here.`,
        why: 'Nobody draws from the dead wall on a normal turn. Some groups push it slightly apart so it’s easy to see. When the live wall reaches it, the hand is a draw.',
      };
    case 'dealerExtra':
      return w.options.dealerExtraMode === 'twoAtOnce'
        ? {
            title: 'Dealer’s extra tile',
            caption: 'The dealer takes 2 more tiles, then South, West and North take 1 each. The dealer now has 14 tiles; everyone else has 13.',
            why: 'The other way: the dealer takes 1, everyone else takes 1, then the dealer takes 1 more. Both give the same result; switch the method above to see it.',
          }
        : {
            title: 'Dealer’s extra tile',
            caption: 'The dealer takes 1 tile, South, West and North take 1 each, then the dealer takes 1 more. The dealer has 14; everyone else has 13.',
            why: 'The other way: the dealer takes 2 at once, then everyone else takes 1. Both give the same result.',
          };
    case 'replaceBonus': {
      if (!s.seat) {
        return {
          title: 'Replace flowers',
          caption: 'Check your tiles for flowers and seasons. Nobody was dealt one this time.',
          why: 'Anyone holding a flower or season exposes it and draws a replacement from the dead wall, starting with the dealer.',
        };
      }
      const bonus = s.events.filter((e) => e.kind === 'bonus');
      const names = bonus.map((e) => (e.kind === 'bonus' ? tileName(e.uid) : '')).join(', ');
      const again = bonus.some((e) => e.kind === 'bonus' && e.replacement !== null && w.tiles[e.replacement].id.match(/[fx]$/));
      return {
        title: 'Replace flowers',
        caption: `${name(s.seat)} exposes ${names} and draws ${bonus.length === 1 ? 'a replacement' : `${bonus.length} replacements`} from the dead wall.${again ? ' One replacement was another bonus tile, so they exposed that too and drew again.' : ''}`,
        why: `Each flower or season is worth ${rules.ruleset.bonusTiles.fanEach} fan at scoring, but only after the hand already qualifies to win.`,
      };
    }
    case 'firstDiscard': {
      const uid = s.discards[s.discards.length - 1];
      return {
        title: 'First discard',
        caption: `The dealer discards ${tileName(uid)}, and the hand begins. Next, South may claim it or draw from the live wall.`,
        why: 'Everyone now has 13 tiles. From here, each turn is: draw or claim, then discard.',
      };
    }
    default: {
      const round = s.round ?? 1;
      const n = rules.ruleset.deal.rounds[round - 1];
      return {
        title: `Deal: ${ordinal[round - 1] ?? `round ${round}`} round`,
        caption: `Starting with the dealer and going counter-clockwise, each player takes ${n} tiles (${n / 2} stacks) from the live wall.`,
        why: `After ${rules.ruleset.deal.rounds.length} rounds everyone has ${rules.ruleset.deal.rounds.reduce((a, b) => a + b, 0)} tiles. Take 2 from the top row and 2 from the bottom: a whole stack at a time.`,
      };
    }
  }
}
