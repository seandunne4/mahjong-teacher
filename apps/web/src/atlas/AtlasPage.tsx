import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import type { TileType } from '@mj/engine';
import { patternsUsingTile, tileById, tiles } from '../data';
import { SpeakButton } from '../audio/speak';
import { useResolvedRules, useSettings } from '../state/settings';
import { Tile } from '../tiles/Tile';

export const stripTones = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ü/g, 'u').toLowerCase();

export function matchesTile(t: TileType, q: string): boolean {
  const query = stripTones(q.trim());
  if (!query) return true;
  const hay = [t.id, t.english, t.short, t.hanzi.trad, t.hanzi.simp, t.hanzi.setForm ?? '', t.pinyin.marks, t.pinyin.numbered, t.suit ?? '', t.kind ?? '']
    .map(stripTones)
    .join(' | ');
  // Single CJK characters match anywhere (e.g. "萬" or "伍"); words match as substrings.
  return query.split(/\s+/).every((w) => hay.includes(w));
}

const GROUPS: { title: string; filter: (t: TileType) => boolean; note?: string }[] = [
  { title: 'Characters 萬 wàn', filter: (t) => t.suit === 'characters', note: 'Read the black number on top; the red 萬 just means "Characters suit".' },
  { title: 'Dots 筒 tǒng', filter: (t) => t.suit === 'dots', note: 'Count the circles. 1 Dot is a big medallion.' },
  { title: 'Bamboo 索 suǒ', filter: (t) => t.suit === 'bamboo', note: 'Count the sticks. 1 Bamboo is a bird; 8 Bamboo is two zigzags.' },
  { title: 'Winds 風 fēng', filter: (t) => t.kind === 'wind' },
  { title: 'Dragons 三元 sān yuán', filter: (t) => t.kind === 'dragon' },
  { title: 'Flowers 花 huā', filter: (t) => t.kind === 'flower' },
  { title: 'Seasons 季 jì', filter: (t) => t.kind === 'season' },
];

function DecoderStrip() {
  const s = useSettings();
  const set = ['一', '二', '三', '四', '伍', '六', '七', '八', '九'];
  const printed = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];
  return (
    <section className="decoder" aria-label="Numeral decoder">
      <h2>Numeral decoder</h2>
      <div className="decoder-row">
        {set.map((c, i) => (
          <div className="decoder-cell" key={i}>
            <span className="brush big">{c}</span>
            {c !== printed[i] && <span className="printed small">= {printed[i]}</span>}
            <span className="arabic">{i + 1}</span>
          </div>
        ))}
        <div className="decoder-cell wan">
          <span className="brush big red">{s.script === 'simp' ? '万' : '萬'}</span>
          <span className="arabic small">wàn = Characters suit</span>
        </div>
      </div>
      <p className="hint">Top row is how our set draws them (5 is the formal 伍). Winds: 東 E · 南 S · 西 W · 北 N.</p>
    </section>
  );
}

function TileDetail({ tile }: { tile: TileType }) {
  const s = useSettings();
  const chars = s.script === 'simp' ? tile.hanzi.simp : tile.hanzi.trad;
  const used = patternsUsingTile.get(tile.id) ?? [];
  return (
    <aside className="tile-detail card" aria-live="polite">
      <div className="tile-detail-head">
        <Tile id={tile.id} size={96} />
        <div>
          <h2>{tile.english}</h2>
          <p className="hanzi-line">
            <span className="hanzi">{chars}</span> <span className="pinyin">{tile.pinyin.marks}</span>{' '}
            <SpeakButton text={chars} label={tile.english} />
          </p>
          {tile.hanzi.setForm && <p className="small">On our set: <span className="hanzi">{tile.hanzi.setForm}</span></p>}
          {tile.hanzi.trad !== tile.hanzi.simp && (
            <p className="small">Traditional {tile.hanzi.trad} · Simplified {tile.hanzi.simp}</p>
          )}
          <p className="small muted">
            {tile.group === 'suit' ? `Suit tile · ${tile.suit}` : tile.group === 'honor' ? `Honor tile · ${tile.kind}` : `Bonus tile · ${tile.kind}`} · {tile.copies} in the set
          </p>
        </div>
      </div>
      <p>{tile.faceNotes}</p>
      {tile.lookAlikes && tile.lookAlikes.length > 0 && (
        <div className="lookalikes">
          <strong>Don't confuse with:</strong>
          {tile.lookAlikes.map((id) => (
            <span key={id} className="lookalike">
              <Tile id={id} size={30} /> {tileById.get(id)?.english}
            </span>
          ))}
        </div>
      )}
      {used.length > 0 && (
        <div>
          <strong>Shows up in patterns like:</strong>
          <ul className="used-in">
            {used.slice(0, 6).map((p) => (
              <li key={p.id}>
                <Link to={`/fan?q=${encodeURIComponent(p.nameEn)}`}>{p.nameEn}</Link> <span className="muted">{p.fan} fan</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}

export function AtlasPage() {
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const selected = tileById.get(params.get('tile') ?? '') ?? null;
  const rules = useResolvedRules();
  const results = useMemo(() => tiles.filter((t) => matchesTile(t, query)), [query]);

  return (
    <div className="page atlas">
      <header className="page-head">
        <h1>Tile atlas</h1>
        <p>Every tile, what it's called, and how to read it. Tap a tile for details.</p>
      </header>
      <DecoderStrip />
      <label className="search">
        <span className="visually-hidden">Find a tile</span>
        <input
          type="search"
          placeholder="Find a tile: 東, east, dong, 5 dot, 伍…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
      </label>
      <div className="atlas-layout">
        <div className="atlas-groups">
          {GROUPS.map((group) => {
            const list = results.filter(group.filter);
            if (list.length === 0) return null;
            const bonus = list[0].group === 'bonus';
            return (
              <section key={group.title} className="tile-group">
                <h2>
                  {group.title}
                  {bonus && !rules.derived.hasBonus && <span className="pill muted">not in play with your house rules</span>}
                </h2>
                {group.note && <p className="hint">{group.note}</p>}
                <div className="tile-grid">
                  {list.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className={`tile-button ${selected?.id === t.id ? 'selected' : ''}`}
                      onClick={() => setParams({ tile: t.id }, { replace: true })}
                      aria-pressed={selected?.id === t.id}
                    >
                      <Tile id={t.id} size={52} />
                      <span className="tile-name">{t.short}</span>
                    </button>
                  ))}
                </div>
              </section>
            );
          })}
          {results.length === 0 && <p>No tile matches "{query}".</p>}
          <Extras />
        </div>
        {selected ? <TileDetail tile={selected} /> : <aside className="tile-detail card muted">Tap any tile to see its name, pronunciation and where it's used.</aside>}
      </div>
    </div>
  );
}

function Extras() {
  return (
    <section className="tile-group extras">
      <h2>Other pieces in the box</h2>
      <ul>
        <li><Tile size={30} title="Blank spare tile" id={undefined} faceDown={false} /> <strong>2 blank tiles</strong>: spares for lost tiles, not used in play. Don't mix them up with the White Dragon, which on our set has a dark frame.</li>
        <li><strong>3 dice</strong>: the booklet uses two (choosing the dealer, breaking the wall). Set the third aside unless your group has a house rule for it.</li>
        <li><strong>Small cube with a character</strong>: most likely a dealer or round-wind marker. Keep it in front of the dealer, or turn it to show the round's wind.</li>
        <li><strong>Wind indicators</strong> (coins or a spinner, if your set has them): used to pick seats and remember the round wind. Optional.</li>
      </ul>
    </section>
  );
}
