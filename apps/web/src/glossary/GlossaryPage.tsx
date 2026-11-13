import { useMemo, useState } from 'react';
import type { GlossaryEntry } from '@mj/engine';
import { glossary } from '../data';
import { SpeakButton } from '../audio/speak';
import { useSettings } from '../state/settings';
import { stripTones } from '../atlas/AtlasPage';

const SECTIONS: { category: GlossaryEntry['category']; title: string; blurb: string }[] = [
  { category: 'action', title: 'Said out loud at the table', blurb: 'Call these the moment you claim a discard.' },
  { category: 'term', title: 'Common terms', blurb: '' },
  { category: 'tiles', title: 'Tile groups', blurb: '' },
  { category: 'stage', title: 'The eight stages of a game', blurb: 'The booklet splits a game into these stages.' },
];

export function GlossaryPage() {
  const s = useSettings();
  const [q, setQ] = useState('');
  const list = useMemo(() => {
    const query = stripTones(q.trim());
    if (!query) return glossary;
    return glossary.filter((g) =>
      stripTones([g.hanzi.trad, g.hanzi.simp, g.pinyin, g.english, g.meaning].join(' ')).includes(query),
    );
  }, [q]);

  return (
    <div className="page glossary">
      <header className="page-head">
        <h1>Table talk</h1>
        <p>The Chinese words you'll hear during a game, with pronunciation.</p>
      </header>
      <label className="search">
        <span className="visually-hidden">Search the glossary</span>
        <input type="search" placeholder="Search: pung, pèng, 碰…" value={q} onChange={(e) => setQ(e.target.value)} />
      </label>
      {SECTIONS.map((sec) => {
        const items = list.filter((g) => g.category === sec.category);
        if (items.length === 0) return null;
        return (
          <section key={sec.category}>
            <h2>{sec.title}</h2>
            {sec.blurb && <p className="hint">{sec.blurb}</p>}
            <dl className="glossary-list">
              {items.map((g) => {
                const chars = s.script === 'simp' ? g.hanzi.simp : g.hanzi.trad;
                return (
                  <div className="glossary-item card" key={g.id}>
                    <dt>
                      <span className="hanzi big">{chars}</span>
                      <span className="pinyin">{g.pinyin}</span>
                      <SpeakButton text={chars} label={g.english} />
                      <span className="english">{g.english}</span>
                    </dt>
                    <dd>
                      {g.meaning}
                      {g.note && <span className="small muted"> {g.note}</span>}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </section>
        );
      })}
    </div>
  );
}
