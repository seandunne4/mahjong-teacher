import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { mdxComponents } from './components';
import { searchRules, topics } from './topics';
import { useSettings, updateSettings } from '../state/settings';
import { ActiveRulesBadge } from '../settings/ActiveRulesBadge';

function LevelToggle() {
  const { level } = useSettings();
  return (
    <div className="segmented" role="group" aria-label="Detail level">
      {(['beginner', 'expert'] as const).map((l) => (
        <button key={l} type="button" aria-pressed={level === l} onClick={() => updateSettings({ level: l })}>
          {l === 'beginner' ? 'Beginner (expanded)' : 'Expert (summaries)'}
        </button>
      ))}
    </div>
  );
}

function RuleSearch() {
  const [q, setQ] = useState('');
  const results = searchRules(q);
  return (
    <div className="rule-search">
      <label className="search">
        <span className="visually-hidden">Search the rules</span>
        <input type="search" placeholder="Search rules: chow from across? dead wall? kong…" value={q} onChange={(e) => setQ(e.target.value)} />
      </label>
      {q && (
        <ul className="search-results card">
          {results.length === 0 && <li className="muted">No matching rules.</li>}
          {results.map((r) => (
            <li key={r.id}>
              <Link to={`/rules/${r.topic}?rule=${r.id}`} onClick={() => setQ('')}>
                <strong>{r.title}</strong> <span className="muted">· {r.topicTitle}</span>
              </Link>
              <div className="small muted">{r.text.slice(0, 110)}…</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function RulesPage() {
  const { topic: slug } = useParams();
  const [params] = useSearchParams();
  const topic = topics.find((t) => t.slug === slug);
  const ruleId = params.get('rule');

  useEffect(() => {
    if (!ruleId) return;
    const el = document.getElementById(`rule-${ruleId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      el.classList.add('flash');
      const t = setTimeout(() => el.classList.remove('flash'), 1600);
      return () => clearTimeout(t);
    }
  }, [ruleId, slug]);

  return (
    <div className="page rules">
      <header className="page-head">
        <h1>Rules reference</h1>
        <p>Every rule has a one-line summary, the full rule, and edge cases. <ActiveRulesBadge /></p>
        <LevelToggle />
      </header>
      <RuleSearch />
      <div className="rules-layout">
        <nav className="topic-nav" aria-label="Rule topics">
          {topics.map((t) => (
            <Link key={t.slug} to={`/rules/${t.slug}`} className={t.slug === slug ? 'active' : ''}>
              {t.title}
            </Link>
          ))}
        </nav>
        <div className="topic-body">
          {topic ? (
            <>
              <h2>{topic.title}</h2>
              <p className="hint">{topic.blurb}</p>
              <topic.Component components={mdxComponents} />
            </>
          ) : (
            <div className="topic-cards">
              {topics.map((t) => (
                <Link key={t.slug} to={`/rules/${t.slug}`} className="card topic-card">
                  <h3>{t.title}</h3>
                  <p>{t.blurb}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
