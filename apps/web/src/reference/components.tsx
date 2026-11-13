import { createContext, useContext, type ReactNode } from 'react';
import { evaluateWhen, isOverridden, ruleValue, type Condition, type ResolvedRules } from '@mj/engine';
import { useResolvedRules, useSettings } from '../state/settings';
import { HandDiagram } from '../tiles/HandDiagram';

/**
 * MDX building blocks for the rules reference. Each <Rule> is tagged with the
 * ruleset setting it describes; it hides itself when its `when` condition is false
 * for the active rules, and shows a badge when a house rule changed that setting.
 * Beginner and Expert read the same text; only what starts expanded differs.
 */

const RulesCtx = createContext<ResolvedRules | null>(null);

export function RulesProvider({ rules, children }: { rules: ResolvedRules; children: ReactNode }) {
  return <RulesCtx.Provider value={rules}>{children}</RulesCtx.Provider>;
}

function useRules(): ResolvedRules {
  const fromCtx = useContext(RulesCtx);
  const fromSettings = useResolvedRules();
  return fromCtx ?? fromSettings;
}

export function Rule({ id, title, setting, when, children }: { id: string; title: string; setting?: string; when?: Condition; children: ReactNode }) {
  const rules = useRules();
  if (!evaluateWhen(when, rules)) return null;
  const changed = setting ? isOverridden(rules, setting) : false;
  return (
    <article className="rule card" id={`rule-${id}`} data-rule-id={id}>
      <header className="rule-head">
        <h3>{title}</h3>
        {changed && <span className="pill house">house rule</span>}
      </header>
      {children}
    </article>
  );
}

export function Summary({ children }: { children: ReactNode }) {
  return <div className="rule-summary">{children}</div>;
}

export function Full({ children }: { children: ReactNode }) {
  const { level } = useSettings();
  return (
    <details className="rule-full" open={level === 'beginner'} key={level}>
      <summary>Full rule</summary>
      <div className="rule-body">{children}</div>
    </details>
  );
}

export function Edge({ children }: { children: ReactNode }) {
  return (
    <details className="rule-edge">
      <summary>Edge cases</summary>
      <div className="rule-body">{children}</div>
    </details>
  );
}

export function Diagram({ hand, caption }: { hand: string; caption?: string }) {
  return <HandDiagram hand={hand} caption={caption} size={30} />;
}

const LABELS: Record<string, string> = {
  left: 'the player on your left',
  any: 'any player',
  nearestInTurnOrder: 'the player nearest in turn order (counter-clockwise from the discarder)',
  tailOfLiveWall: 'the tail end of the live wall',
  twoAtOnce: 'two tiles at once',
  oneThenOne: 'one tile, then one more after everyone else',
};

/** Inline value from the active rules, e.g. <Val path="derived.stacksPerWall" />. */
export function Val({ path }: { path: string }) {
  const rules = useRules();
  const v = ruleValue(rules, path);
  const text = Array.isArray(v) ? v.join('–') : typeof v === 'string' ? (LABELS[v] ?? v) : String(v);
  const changed = !path.startsWith('derived.') && isOverridden(rules, path);
  return <strong className={`val ${changed ? 'val-changed' : ''}`}>{text}</strong>;
}

/** Show children only when a setting has (or doesn't have) a value. */
export function When({ path, is, not, children }: { path: string; is?: unknown; not?: unknown; children: ReactNode }) {
  const rules = useRules();
  const cond: Condition = { [path]: not !== undefined ? { not } : is };
  return evaluateWhen(cond, rules) ? <>{children}</> : null;
}

export const mdxComponents = { Rule, Summary, Full, Edge, Diagram, Val, When };
