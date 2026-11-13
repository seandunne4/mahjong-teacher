import type { ReactNode } from 'react';
import type { TileId } from '@mj/engine';
import { tileById } from '../data';
import { useSettings } from '../state/settings';

/**
 * Tiles drawn entirely in SVG (our own art, styled on the Yellow Mountain set):
 * ivory face on a mint/jade back, red 萬, black brush-style winds,
 * dots and bamboo drawn as shapes. viewBox is 30 × 40; the face occupies y 0–36.
 */

export const C = {
  ivory: '#f7f3e8',
  ivoryEdge: '#d6cdb5',
  back: '#a8e0c4',
  backEdge: '#79bf9e',
  green: '#1f7a4a',
  red: '#c8202a',
  navy: '#1d2d5a',
  ink: '#151515',
  badge: '#2563c9',
};

export interface FaceOptions {
  script: 'trad' | 'simp';
  numerals: 'set' | 'printed';
  badges: boolean;
}

const BRUSH = "'LXGW WenKai TC', 'Noto Serif TC', 'Noto Serif SC', serif";
const PRINT_TC = "'Noto Serif TC', 'Noto Serif SC', serif";
const PRINT_SC = "'Noto Serif SC', 'Noto Serif TC', serif";

const NUMERALS_PRINTED = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
const NUMERALS_SET = ['', '一', '二', '三', '四', '伍', '六', '七', '八', '九'];

/* ---------------------------- Dots ---------------------------- */

type Dot = [x: number, y: number, r: number, color: string];
const g = C.green;
const r = C.red;
const n = C.navy;
const DOTS: Record<number, Dot[]> = {
  2: [[15, 10.5, 5.6, g], [15, 26, 5.6, n]],
  3: [[8, 8, 4.6, g], [15, 18.2, 4.6, r], [22, 28.4, 4.6, n]],
  4: [[9.5, 10.5, 4.8, n], [20.5, 10.5, 4.8, g], [9.5, 25.8, 4.8, g], [20.5, 25.8, 4.8, n]],
  5: [[8.5, 8.6, 4.2, n], [21.5, 8.6, 4.2, g], [15, 18.2, 4.2, r], [8.5, 27.8, 4.2, g], [21.5, 27.8, 4.2, n]],
  6: [[10, 7.2, 4, g], [20, 7.2, 4, g], [10, 18.2, 4, r], [20, 18.2, 4, r], [10, 28, 4, r], [20, 28, 4, r]],
  7: [[7, 5.6, 3.3, g], [15, 8.8, 3.3, g], [23, 12, 3.3, g], [10, 20, 3.8, r], [20, 20, 3.8, r], [10, 29, 3.8, r], [20, 29, 3.8, r]],
  8: [6.4, 14.3, 22.2, 30.1].flatMap((y): Dot[] => [[10, y, 3.6, n], [20, y, 3.6, n]]),
  9: ([[8, g], [18.2, r], [28.4, n]] as const).flatMap(([y, col]): Dot[] => [[7.6, y, 3.5, col], [15, y, 3.5, col], [22.4, y, 3.5, col]]),
};

function DotShape({ dot: [x, y, rad, col] }: { dot: Dot }) {
  return (
    <g>
      <circle cx={x} cy={y} r={rad} fill={col} />
      <circle cx={x} cy={y} r={rad * 0.74} fill={C.ivory} />
      <circle cx={x} cy={y} r={rad * 0.55} fill={col} />
      <circle cx={x} cy={y} r={rad * 0.22} fill={C.ivory} />
    </g>
  );
}

function OneDot() {
  const petals = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2;
    return <circle key={i} cx={15 + Math.cos(a) * 7.6} cy={18.2 + Math.sin(a) * 7.6} r={1.5} fill={C.ivory} />;
  });
  return (
    <g>
      <circle cx={15} cy={18.2} r={11.2} fill={C.green} />
      <circle cx={15} cy={18.2} r={9.6} fill={C.ivory} />
      <circle cx={15} cy={18.2} r={9} fill={C.green} />
      {petals}
      <circle cx={15} cy={18.2} r={4.6} fill={C.ivory} />
      <circle cx={15} cy={18.2} r={3.6} fill={C.red} />
      <circle cx={15} cy={18.2} r={1.1} fill={C.ivory} />
    </g>
  );
}

/* --------------------------- Bamboo --------------------------- */

type Stick = [x: number, y: number, h: number, color: string, angle?: number];
const BAMBOO: Record<number, Stick[]> = {
  2: [[15, 4.5, 12, g], [15, 19.8, 12, g]],
  3: [[15, 4.5, 12, g], [10, 19.8, 12, g], [20, 19.8, 12, g]],
  4: [[10, 4.5, 12, g], [20, 4.5, 12, g], [10, 19.8, 12, g], [20, 19.8, 12, g]],
  5: [[8, 4.5, 12, g], [22, 4.5, 12, g], [15, 12.2, 12, r], [8, 19.8, 12, g], [22, 19.8, 12, g]],
  6: [8, 15, 22].flatMap((x): Stick[] => [[x, 4.5, 12, g], [x, 19.8, 12, g]]),
  7: [[15, 3, 9, r], ...[8, 15, 22].flatMap((x): Stick[] => [[x, 13.5, 9, g], [x, 24.3, 9, g]])],
  8: [
    [6.8, 4.5, 12, g, 22], [12.2, 4.5, 12, g, -22], [17.8, 4.5, 12, g, 22], [23.2, 4.5, 12, g, -22],
    [6.8, 19.8, 12, g, -22], [12.2, 19.8, 12, g, 22], [17.8, 19.8, 12, g, -22], [23.2, 19.8, 12, g, 22],
  ],
  9: [8, 15, 22].flatMap((x): Stick[] => [3, 13.5, 24].map((y): Stick => [x, y, 9, x === 15 ? r : g])),
};

function StickShape({ stick: [x, y, h, col, angle = 0] }: { stick: Stick }) {
  return (
    <g transform={angle ? `rotate(${angle} ${x} ${y + h / 2})` : undefined}>
      <rect x={x - 1.6} y={y} width={3.2} height={h} rx={1.5} fill={col} />
      <line x1={x - 1.7} x2={x + 1.7} y1={y + h / 2} y2={y + h / 2} stroke={C.ivory} strokeWidth={0.7} />
      <line x1={x} x2={x} y1={y + 1.2} y2={y + h - 1.2} stroke={C.ivory} strokeWidth={0.5} opacity={0.6} />
    </g>
  );
}

function Bird() {
  return (
    <g>
      {/* tail */}
      <path d="M15 26 L8 34 M15 26 L12 35 M15 26 L18 35 M15 26 L22 34" stroke={C.green} strokeWidth={1.8} strokeLinecap="round" />
      {/* body and wing */}
      <ellipse cx={15} cy={19.5} rx={5.6} ry={7.5} fill={C.green} />
      <path d="M11 17 Q16 19 18.5 25" stroke={C.ivory} strokeWidth={0.9} fill="none" />
      <path d="M12.5 15.5 Q16.5 17 19 22" stroke={C.ivory} strokeWidth={0.7} fill="none" opacity={0.8} />
      {/* head, crest, beak, eye */}
      <path d="M15 4.6 L13.4 2.2 M15.6 4.4 L16.6 1.9" stroke={C.red} strokeWidth={0.9} strokeLinecap="round" />
      <circle cx={15} cy={8.6} r={3.8} fill={C.red} />
      <path d="M18.4 8.2 L21.6 9.2 L18.4 10.1 Z" fill={C.navy} />
      <circle cx={16.1} cy={7.9} r={1} fill={C.ivory} />
      <circle cx={16.3} cy={7.9} r={0.45} fill={C.ink} />
    </g>
  );
}

/* ---------------------- Flowers & seasons --------------------- */

const BLOSSOM: Record<string, string> = {
  '1f': '#d0457a', '2f': '#8a4fbf', '3f': '#d99a1e', '4f': C.green,
  '1x': '#e26a9a', '2x': C.red, '3x': '#d9731e', '4x': '#3f6fc0',
};

function Plant({ id }: { id: TileId }) {
  const col = BLOSSOM[id];
  if (id === '4f') {
    // bamboo plant: stalk and leaves
    return (
      <g>
        <rect x={13.8} y={13} width={2.4} height={20} rx={1} fill={C.green} />
        <line x1={13.6} x2={16.4} y1={20} y2={20} stroke={C.ivory} strokeWidth={0.6} />
        <line x1={13.6} x2={16.4} y1={27} y2={27} stroke={C.ivory} strokeWidth={0.6} />
        <path d="M16 18 Q22 14 25 16 Q21 19 16 18Z M14 24 Q8 20 5 22 Q9 25 14 24Z M16 14 Q20 9 23 9 Q20 13 16 14Z" fill={C.green} />
      </g>
    );
  }
  return (
    <g>
      <path d="M15 34 Q14 26 15.5 18" stroke={C.green} strokeWidth={1.3} fill="none" />
      <path d="M15 28 Q9 25 7 27 Q11 30 15 28Z M15.3 24 Q21 20 23 22 Q19 25 15.3 24Z" fill={C.green} />
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
        return <circle key={i} cx={15.5 + Math.cos(a) * 3.3} cy={15 + Math.sin(a) * 3.3} r={2.6} fill={col} opacity={0.9} />;
      })}
      <circle cx={15.5} cy={15} r={1.6} fill="#f2c94c" />
    </g>
  );
}

/* --------------------------- Faces ---------------------------- */

function Glyph({ x = 15, y, size, fill, font, children }: { x?: number; y: number; size: number; fill: string; font: string; children: ReactNode }) {
  return (
    <text x={x} y={y} fontSize={size} fill={fill} fontFamily={font} textAnchor="middle" dominantBaseline="central">
      {children}
    </text>
  );
}

function Badge({ text, color = C.badge }: { text: string; color?: string }) {
  return (
    <text x={3.2} y={4.6} fontSize={5.2} fontWeight={700} fill={color} fontFamily="system-ui, sans-serif" dominantBaseline="central">
      {text}
    </text>
  );
}

export function Face({ id, opts }: { id: TileId; opts: FaceOptions }) {
  const rank = Number(id[0]);
  const suit = id[1];
  const t = tileById.get(id);
  const print = opts.script === 'simp' ? PRINT_SC : PRINT_TC;
  const brushOrPrint = opts.numerals === 'set' ? BRUSH : print;

  if (suit === 'p') return rank === 1 ? <OneDot /> : <>{DOTS[rank].map((d, i) => <DotShape key={i} dot={d} />)}</>;
  if (suit === 's') return rank === 1 ? <Bird /> : <>{BAMBOO[rank].map((s, i) => <StickShape key={i} stick={s} />)}</>;
  if (suit === 'm') {
    const numeral = (opts.numerals === 'set' ? NUMERALS_SET : NUMERALS_PRINTED)[rank];
    return (
      <g>
        <Glyph y={11.5} size={13} fill={C.ink} font={brushOrPrint}>{numeral}</Glyph>
        <Glyph y={26.5} size={15.5} fill={C.red} font={brushOrPrint}>{opts.script === 'simp' ? '万' : '萬'}</Glyph>
        {opts.badges && <Badge text={String(rank)} />}
      </g>
    );
  }
  if (suit === 'z') {
    if (rank <= 4) {
      return (
        <g>
          <Glyph y={18.6} size={21} fill={C.ink} font={brushOrPrint}>{opts.script === 'simp' ? t?.hanzi.simp : t?.hanzi.trad}</Glyph>
          {opts.badges && <Badge text={t?.short ?? ''} />}
        </g>
      );
    }
    if (rank === 5) {
      return (
        <g>
          <rect x={6.5} y={6.5} width={17} height={23.4} rx={1.2} fill="none" stroke={C.navy} strokeWidth={2.2} />
          <rect x={9.4} y={9.4} width={11.2} height={17.6} rx={0.6} fill="none" stroke={C.navy} strokeWidth={0.6} />
        </g>
      );
    }
    if (rank === 6) return <Glyph y={18.4} size={21} fill={C.green} font={brushOrPrint}>{opts.script === 'simp' ? '发' : '發'}</Glyph>;
    return <Glyph y={18.4} size={23} fill={C.red} font={brushOrPrint}>中</Glyph>;
  }
  // flowers / seasons
  return (
    <g>
      <Plant id={id} />
      <text x={3.4} y={5.4} fontSize={6.4} fontWeight={700} fill={C.red} fontFamily="system-ui, sans-serif" dominantBaseline="central">
        {rank}
      </text>
      <Glyph x={24.6} y={5.6} size={5.6} fill={C.ink} font={print}>
        {opts.script === 'simp' ? t?.hanzi.simp : t?.hanzi.trad}
      </Glyph>
    </g>
  );
}

/** Tile body drawn as an SVG group, for use inside a larger SVG (setup table, diagrams). */
export function TileGraphic({
  id,
  faceDown = false,
  highlight = false,
  dim = false,
  opts,
}: {
  id?: TileId;
  faceDown?: boolean;
  highlight?: boolean;
  dim?: boolean;
  opts: FaceOptions;
}) {
  return (
    <g opacity={dim ? 0.45 : 1}>
      <rect x={0.4} y={0.4} width={29.2} height={39.2} rx={4} fill={C.back} stroke={C.backEdge} strokeWidth={0.8} />
      {faceDown ? (
        <g stroke={C.backEdge} strokeWidth={0.6} fill="none" opacity={0.55}>
          <path d="M15 8 L21 11.5 L21 18.5 L15 22 L9 18.5 L9 11.5 Z" />
          <path d="M15 22 L21 25.5 L21 32.5 L15 36 L9 32.5 L9 25.5 Z" />
          <path d="M9 11.5 L3 8 M21 11.5 L27 8 M9 25.5 L3 22 M21 25.5 L27 22" />
        </g>
      ) : (
        <>
          <rect x={0.4} y={0.4} width={29.2} height={35.6} rx={3.6} fill={C.ivory} stroke={C.ivoryEdge} strokeWidth={0.6} />
          {id && <Face id={id} opts={opts} />}
        </>
      )}
      {highlight && <rect x={-0.6} y={-0.6} width={31.2} height={41.2} rx={4.6} fill="none" stroke="#f0b429" strokeWidth={2.2} />}
    </g>
  );
}

export function useFaceOptions(overrides?: Partial<FaceOptions>): FaceOptions {
  const s = useSettings();
  return { script: s.script, numerals: s.numerals, badges: s.badges, ...overrides };
}

export interface TileProps {
  id?: TileId;
  /** Width in CSS pixels; height is 4/3 of it. */
  size?: number;
  faceDown?: boolean;
  highlight?: boolean;
  dim?: boolean;
  rotated?: boolean;
  badges?: boolean;
  className?: string;
  title?: string;
}

export function Tile({ id, size = 40, faceDown, highlight, dim, rotated, badges, className, title }: TileProps) {
  const opts = useFaceOptions(badges === undefined ? undefined : { badges });
  const label = faceDown ? 'Face-down tile' : (title ?? tileById.get(id ?? '')?.english ?? id ?? 'Tile');
  const w = rotated ? size * (4 / 3) : size;
  const h = rotated ? size : size * (4 / 3);
  return (
    <svg
      className={`tile ${className ?? ''}`}
      width={w}
      height={h}
      viewBox={rotated ? '0 0 40 30' : '0 0 30 40'}
      role="img"
      aria-label={label}
    >
      <title>{label}</title>
      <g transform={rotated ? 'translate(40 0) rotate(90)' : undefined}>
        <TileGraphic id={id} faceDown={faceDown} highlight={highlight} dim={dim} opts={opts} />
      </g>
    </svg>
  );
}
