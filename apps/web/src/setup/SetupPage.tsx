import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import {
  buildWalkthrough,
  randomSeed,
  walkReducer,
  type DealerExtraMode,
  type Scenario,
  type WalkAction,
  type WalkState,
} from '@mj/engine';
import { updateSettings, useResolvedRules, useSettings } from '../state/settings';
import { SetupTable } from './SetupTable';
import { stepText } from './captions';

export function useWalkthrough() {
  const rules = useResolvedRules();
  const [scenario, setScenario] = useState<Scenario>('booklet-example');
  const [seed, setSeed] = useState(20261112);
  const [mode, setMode] = useState<DealerExtraMode>(rules.ruleset.deal.defaultDealerExtraMode);
  const walk = useMemo(() => buildWalkthrough(rules, { scenario, seed, dealerExtraMode: mode }), [rules, scenario, seed, mode]);
  const length = walk.snapshots.length;
  const [rawIndex, setIndex] = useState(0);
  // A rebuilt walkthrough (e.g. flowers toggled) may be shorter; clamp rather than reset.
  const index = Math.min(rawIndex, length - 1);
  const snap = walk.snapshots[index];
  const st: WalkState = { index, length };
  const go = useCallback(
    (a: WalkAction) => setIndex((i) => walkReducer({ index: Math.min(i, length - 1), length }, a).index),
    [length],
  );

  const rollForReal = () => {
    setScenario('random');
    setSeed(randomSeed());
    go({ type: 'reset' });
  };
  const bookletExample = () => {
    setScenario('booklet-example');
    go({ type: 'reset' });
  };

  return { rules, walk, snap, st, go, scenario, mode, setMode, rollForReal, bookletExample, text: stepText(snap, walk, rules) };
}

export function SetupPage({ cast = false }: { cast?: boolean }) {
  const s = useSettings();
  const w = useWalkthrough();
  const { snap, st, go, text } = w;
  const [whyOpen, setWhyOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'SELECT') return;
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault();
        go({ type: 'next' });
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        go({ type: 'back' });
      } else if (e.key === 'Home') go({ type: 'reset' });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go]);

  return (
    <div className={`page setup ${cast ? 'cast' : ''}`}>
      {!cast && (
        <header className="page-head">
          <h1>Set up a game</h1>
          <p>Step through setup on an animated table. Use ← → keys, or the buttons.</p>
        </header>
      )}
      <div className="setup-layout">
        <div className="setup-board">
          <SetupTable walk={w.walk} snap={snap} big={cast} />
        </div>
        <div className="setup-side">
          <div className="step-caption card" aria-live="polite">
            <div className="step-count">
              Step {st.index + 1} of {st.length}
            </div>
            <h2>{text.title}</h2>
            <p className="caption">{text.caption}</p>
            <button type="button" className="link-button" aria-expanded={whyOpen} onClick={() => setWhyOpen((o) => !o)}>
              {whyOpen ? 'Hide why' : 'Why?'}
            </button>
            {whyOpen && <p className="why">{text.why}</p>}
          </div>
          <div className="step-controls">
            <button type="button" onClick={() => go({ type: 'back' })} disabled={st.index === 0}>
              ← Back
            </button>
            <button type="button" className="primary" onClick={() => go({ type: 'next' })} disabled={st.index === st.length - 1}>
              Next →
            </button>
          </div>
          <ol className="step-list">
            {w.walk.snapshots.map((x, i) => (
              <li key={i}>
                <button type="button" aria-current={i === st.index ? 'step' : undefined} onClick={() => go({ type: 'goto', index: i })}>
                  {stepText(x, w.walk, w.rules).title}
                </button>
              </li>
            ))}
          </ol>
          <div className="setup-options card">
            <div className="segmented" role="group" aria-label="Dice">
              <button type="button" aria-pressed={w.scenario === 'booklet-example'} onClick={w.bookletExample}>
                Booklet example
              </button>
              <button type="button" aria-pressed={w.scenario === 'random'} onClick={w.rollForReal}>
                🎲 Roll for real
              </button>
            </div>
            <label>
              Dealer's extra tile:{' '}
              <select value={w.mode} onChange={(e) => w.setMode(e.target.value as DealerExtraMode)}>
                <option value="twoAtOnce">Takes 2 at once</option>
                <option value="oneThenOne">Takes 1, then 1 more at the end</option>
              </select>
            </label>
            <label className="switch">
              <input type="checkbox" checked={s.flowers} onChange={(e) => updateSettings({ flowers: e.target.checked })} /> Play with flowers and seasons (144 tiles)
            </label>
            {cast ? (
              <Link to="/setup">Exit big-screen mode</Link>
            ) : (
              <Link to="/setup/cast">📺 Big-screen mode (for a TV or iPad)</Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
