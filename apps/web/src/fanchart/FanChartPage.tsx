import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import type { Pattern } from '@mj/engine';
import { patterns } from '../data';
import { HandDiagram } from '../tiles/HandDiagram';
import { SpeakButton } from '../audio/speak';
import { useResolvedRules, useSettings } from '../state/settings';
import { stripTones } from '../atlas/AtlasPage';

const FAN_VALUES = [88, 64, 48, 32, 24, 16, 12, 8, 6, 4, 2, 1];
const byId = new Map(patterns.map((p) => [p.id, p]));
const BOOKLET_COUNT = patterns.filter((p) => p.inBooklet).length;

export function filterPatterns(list: Pattern[], opts: { full: boolean; fan: number | null; q: string }): Pattern[] {
  const q = stripTones(opts.q.trim());
  return list.filter(
    (p) =>
      (opts.full || p.inBooklet) &&
      (opts.fan === null || p.fan === opts.fan) &&
      (!q || stripTones([p.nameEn, p.hanzi.trad, p.hanzi.simp, p.pinyin, p.summary, p.category].join(' ')).includes(q)),
  );
}

function PatternCard({ p, full }: { p: Pattern; full: boolean }) {
  const s = useSettings();
  const chars = s.script === 'simp' ? p.hanzi.simp : p.hanzi.trad;
  return (
    <article className="pattern card" id={`pattern-${p.id}`}>
      <header className="pattern-head">
        <div>
          <h3>{p.nameEn}</h3>
          <p className="hanzi-line">
            <span className="hanzi">{chars}</span> <span className="pinyin">{p.pinyin}</span> <SpeakButton text={chars} label={p.nameEn} />
          </p>
        </div>
        <div className="fan-badge" aria-label={`${p.fan} fan`}>
          {p.fan}
          <span>fan</span>
        </div>
      </header>
      <p>{p.summary}</p>
      {p.note && <p className="note small">{p.note}</p>}
      <HandDiagram hand={p.example} size={26} label={`Example: ${p.nameEn}`} />
      <footer className="pattern-foot small muted">
        <span className="pill">{p.category}</span>
        {!p.inBooklet && <span className="pill">full MCR only</span>}
        {full && p.excludes.length > 0 && (
          <span>
            Already includes (don't also count):{' '}
            {p.excludes
              .map((x) => byId.get(x))
              .filter((x): x is Pattern => !!x && (full || x.inBooklet))
              .map((x) => x.nameEn)
              .join(', ')}
          </span>
        )}
      </footer>
    </article>
  );
}

export function FanChartPage() {
  const rules = useResolvedRules();
  const [params, setParams] = useSearchParams();
  const [full, setFull] = useState(false);
  const [fan, setFan] = useState<number | null>(null);
  const q = params.get('q') ?? '';
  const list = useMemo(() => filterPatterns(patterns, { full, fan, q }), [full, fan, q]);
  const minimum = rules.profile.minimumFan;

  return (
    <div className="page fanchart">
      <header className="page-head">
        <h1>Fan chart</h1>
        <p>
          Scoring patterns from 88 fan down to 1. {rules.profile.name}:{' '}
          {minimum === 0 ? 'any legal hand wins' : `a hand needs ${minimum} fan to win`}; flowers add {rules.profile.bonusFan.perFlower} fan each after that.
        </p>
      </header>
      <div className="fan-controls">
        <div className="segmented" role="group" aria-label="Pattern list">
          <button type="button" aria-pressed={!full} onClick={() => setFull(false)}>
            Booklet ({BOOKLET_COUNT})
          </button>
          <button type="button" aria-pressed={full} onClick={() => setFull(true)}>
            Full MCR ({patterns.length})
          </button>
        </div>
        <label className="search">
          <span className="visually-hidden">Search patterns</span>
          <input
            type="search"
            placeholder="Search: flush, 清一色, pung…"
            value={q}
            onChange={(e) => setParams(e.target.value ? { q: e.target.value } : {}, { replace: true })}
          />
        </label>
        <div className="fan-filter" role="group" aria-label="Filter by fan">
          <button type="button" aria-pressed={fan === null} onClick={() => setFan(null)}>
            All
          </button>
          {FAN_VALUES.map((v) => (
            <button key={v} type="button" aria-pressed={fan === v} onClick={() => setFan(fan === v ? null : v)}>
              {v}
            </button>
          ))}
        </div>
      </div>
      <p className="small muted" aria-live="polite">
        Showing {list.length} pattern{list.length === 1 ? '' : 's'}.
      </p>
      {FAN_VALUES.map((v) => {
        const group = list.filter((p) => p.fan === v);
        if (group.length === 0) return null;
        return (
          <section key={v} className="fan-group">
            <h2>{v} fan</h2>
            <div className="pattern-grid">
              {group.map((p) => (
                <PatternCard key={p.id} p={p} full={full} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
