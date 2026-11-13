import { useMemo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { mulberry32, stackLocation, type Seat, type Snapshot, type Walkthrough } from '@mj/engine';
import { TileGraphic, useFaceOptions, C } from '../tiles/Tile';
import { SEAT_HANZI, SEAT_NAME } from './captions';

/**
 * Top-down table in a 1000×1000 SVG. Everything for one seat is drawn in
 * East's frame (bottom of the table) and rotated into place, which keeps the
 * geometry identical to the engine's ring model: each wall runs from its
 * owner's right end (pos 0) to their left end.
 */

const VB = 1000;
const MID = VB / 2;
const SEAT_ANGLE: Record<Seat, number> = { E: 0, S: -90, W: 180, N: 90 };
const SEATS: Seat[] = ['E', 'S', 'W', 'N'];

const STACK_W = 27;
const STACK_D = 34;
const HAND_W = 38;

function DieFace({ value, x, y, size = 46 }: { value: number; x: number; y: number; size?: number }) {
  const pips: Record<number, [number, number][]> = {
    1: [[0.5, 0.5]],
    2: [[0.25, 0.25], [0.75, 0.75]],
    3: [[0.25, 0.25], [0.5, 0.5], [0.75, 0.75]],
    4: [[0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]],
    5: [[0.25, 0.25], [0.75, 0.25], [0.5, 0.5], [0.25, 0.75], [0.75, 0.75]],
    6: [[0.25, 0.22], [0.75, 0.22], [0.25, 0.5], [0.75, 0.5], [0.25, 0.78], [0.75, 0.78]],
  };
  return (
    <motion.g
      key={`${value}-${x}`}
      initial={{ rotate: -200, opacity: 0, scale: 0.4 }}
      animate={{ rotate: 0, opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 140, damping: 14 }}
      style={{ originX: `${x + size / 2}px`, originY: `${y + size / 2}px` }}
    >
      <rect x={x} y={y} width={size} height={size} rx={9} fill="#fff" stroke="#999" strokeWidth={1.5} />
      {pips[value].map(([px, py], i) => (
        <circle key={i} cx={x + px * size} cy={y + py * size} r={size * 0.085} fill={value === 1 || value === 4 ? C.red : '#1d3c9a'} />
      ))}
    </motion.g>
  );
}

export function SetupTable({ walk, snap, big = false }: { walk: Walkthrough; snap: Snapshot; big?: boolean }) {
  const spw = walk.stacksPerWall;
  const opts = useFaceOptions({ badges: false });
  const idOf = (uid: number) => walk.tiles[uid].id;
  const half = (spw * STACK_W) / 2;
  const wallY = MID + half + 12; // front edge of East's wall in East's frame

  const highlightStacks = new Set(snap.highlight.stacks);
  const highlightUids = new Set(snap.highlight.uids);
  const dead = new Set(snap.showDeadWall ? snap.deadWall ?? [] : []);
  const countedOrder = snap.step === 'rollForCount' ? snap.highlight.stacks : [];

  // Group stacks per seat wall.
  const walls = useMemo(() => {
    const by: Record<Seat, { ring: number; pos: number }[]> = { E: [], S: [], W: [], N: [] };
    for (let i = 0; i < spw * 4; i++) {
      const { seat, pos } = stackLocation(i, spw);
      by[seat].push({ ring: i, pos });
    }
    return by;
  }, [spw]);

  // Shuffle scatter (deterministic per walkthrough).
  const scatter = useMemo(() => {
    const rng = mulberry32(walk.options.seed + 17);
    return Array.from({ length: 70 }, () => ({
      x: MID + (rng() - 0.5) * 420,
      y: MID + (rng() - 0.5) * 420,
      a: rng() * 360,
    }));
  }, [walk.options.seed]);

  const stackX = (pos: number) => MID + half - (pos + 1) * STACK_W; // pos 0 at the owner's right (East: screen right)

  return (
    <svg className={`setup-table ${big ? 'big' : ''}`} viewBox={`0 0 ${VB} ${VB}`} role="img" aria-label={`Mahjong table: ${snap.step}`}>
      <rect x={0} y={0} width={VB} height={VB} rx={28} fill="var(--felt)" />
      <rect x={14} y={14} width={VB - 28} height={VB - 28} rx={22} fill="none" stroke="var(--felt-line)" strokeWidth={2} />

      {/* Shuffle */}
      {snap.shuffled && !snap.wallsBuilt &&
        scatter.map((p, i) => (
          <motion.g key={`sc${i}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.006 }}>
            <g transform={`translate(${p.x} ${p.y}) rotate(${p.a}) translate(-13 -17) scale(0.9)`}>
              <TileGraphic faceDown opts={opts} />
            </g>
          </motion.g>
        ))}

      {SEATS.map((seat) => {
        const hand = snap.hands[seat];
        const bonus = snap.bonus[seat];
        const seatHi = snap.highlight.seats.includes(seat);
        const handStart = MID - (hand.length * HAND_W) / 2;
        return (
          <g key={seat} transform={`rotate(${SEAT_ANGLE[seat]} ${MID} ${MID})`}>
            {/* Wall */}
            {snap.wallsBuilt &&
              walls[seat].map(({ ring, pos }) => {
                const stack = snap.ring[ring];
                const n = stack.filter((u) => u !== null).length;
                const x = stackX(pos);
                const hi = highlightStacks.has(ring);
                const isDead = dead.has(ring);
                const countIdx = countedOrder.indexOf(ring);
                return (
                  <g key={ring}>
                    {n > 0 && (
                      <motion.g initial={false} animate={{ opacity: 1 }}>
                        {n === 2 && <rect x={x + 1} y={wallY + 5} width={STACK_W - 2} height={STACK_D} rx={4} fill={C.backEdge} />}
                        <rect x={x + 1} y={wallY} width={STACK_W - 2} height={STACK_D} rx={4} fill={C.back} stroke={C.backEdge} strokeWidth={1} />
                      </motion.g>
                    )}
                    {n === 0 && <rect x={x + 1} y={wallY} width={STACK_W - 2} height={STACK_D} rx={4} fill="none" stroke="var(--felt-line)" strokeDasharray="3 3" />}
                    {isDead && n > 0 && <rect x={x + 1} y={wallY} width={STACK_W - 2} height={STACK_D + 5} rx={4} fill="rgba(124,58,237,0.28)" stroke="#7c3aed" strokeWidth={2} />}
                    {hi && <rect x={x - 1} y={wallY - 2} width={STACK_W + 2} height={STACK_D + 9} rx={5} fill="none" stroke="#f0b429" strokeWidth={3} />}
                    {countIdx >= 0 && (
                      <text x={x + STACK_W / 2} y={wallY - 10} textAnchor="middle" fontSize={15} fontWeight={700} fill="#f0b429">
                        {countedOrder.length - countIdx}
                      </text>
                    )}
                  </g>
                );
              })}

            {/* Break marker */}
            {snap.liveStart !== undefined && stackLocation(snap.liveStart, spw).seat === seat && (
              <line
                x1={stackX(stackLocation(snap.liveStart, spw).pos) + STACK_W}
                x2={stackX(stackLocation(snap.liveStart, spw).pos) + STACK_W}
                y1={wallY - 18}
                y2={wallY + STACK_D + 16}
                stroke="#ef4444"
                strokeWidth={4}
                strokeLinecap="round"
              />
            )}

            {/* Bonus tiles */}
            {bonus.map((uid, i) => (
              <motion.g key={`b${uid}`} initial={{ opacity: 0, y: -40 }} animate={{ opacity: 1, y: 0 }}>
                <g transform={`translate(${MID - half + i * 25} ${wallY + STACK_D + 16}) scale(0.78)`}>
                  <TileGraphic id={idOf(uid)} opts={opts} highlight={highlightUids.has(uid)} />
                </g>
              </motion.g>
            ))}

            {/* Hand */}
            <AnimatePresence>
              {hand.map((uid, i) => (
                <motion.g
                  key={uid}
                  initial={{ opacity: 0, y: -90, x: handStart + i * HAND_W }}
                  animate={{ opacity: 1, y: 0, x: handStart + i * HAND_W }}
                  exit={{ opacity: 0, y: -60 }}
                  transition={{ duration: 0.35 }}
                >
                  <g transform={`translate(0 ${VB - 128}) scale(${HAND_W / 30.5})`}>
                    <TileGraphic id={idOf(uid)} opts={opts} highlight={highlightUids.has(uid)} />
                  </g>
                </motion.g>
              ))}
            </AnimatePresence>

            {/* Seat label */}
            <text x={MID} y={VB - 26} textAnchor="middle" fontSize={big ? 26 : 22} fontWeight={seatHi ? 800 : 600} fill={seatHi ? '#fde68a' : 'var(--felt-text)'}>
              {SEAT_HANZI[seat]} {SEAT_NAME[seat]}
              {snap.players ? ` · ${snap.players[seat]}` : ''}
              {seat === snap.dealer && snap.step !== 'seating' ? ' · Dealer' : ''}
              {hand.length > 0 ? ` · ${hand.length} tiles` : ''}
            </text>
          </g>
        );
      })}

      {/* Dice */}
      {snap.dice.side && !snap.discards.length && (
        <g>
          <DieFace value={snap.dice.side[0]} x={MID - 110} y={MID - 60} />
          <DieFace value={snap.dice.side[1]} x={MID - 55} y={MID - 60} />
          {snap.dice.count && (
            <>
              <DieFace value={snap.dice.count[0]} x={MID + 10} y={MID - 60} />
              <DieFace value={snap.dice.count[1]} x={MID + 65} y={MID - 60} />
            </>
          )}
          <text x={MID} y={MID + 30} textAnchor="middle" fontSize={20} fill="var(--felt-text)">
            {snap.dice.side.join('+')}
            {snap.dice.count ? `  then  ${snap.dice.count.join('+')}  →  ${snap.total} stacks` : ''}
          </text>
        </g>
      )}

      {/* Discards */}
      {snap.discards.map((uid, i) => (
        <motion.g key={`d${uid}`} initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }} style={{ originX: `${MID}px`, originY: `${MID}px` }}>
          <g transform={`translate(${MID - 22 + i * 46} ${MID - 30}) scale(1.45)`}>
            <TileGraphic id={idOf(uid)} opts={opts} highlight />
          </g>
        </motion.g>
      ))}

      {/* Seat legend for orientation */}
      {!snap.wallsBuilt && !snap.shuffled && (
        <g fill="var(--felt-text)" textAnchor="middle" fontSize={60} fontWeight={700} opacity={0.85}>
          <text x={MID} y={MID + 250}>東 E</text>
          <text x={MID + 250} y={MID + 20}>南 S</text>
          <text x={MID} y={MID - 220}>西 W</text>
          <text x={MID - 250} y={MID + 20}>北 N</text>
          <text x={MID} y={MID + 15} fontSize={22} fontWeight={500}>turns go counter-clockwise ↺</text>
        </g>
      )}
    </svg>
  );
}
