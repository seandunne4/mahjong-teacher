import { ruleValue, type ResolvedRules } from './resolve';

/**
 * A content condition: every path must match.
 *   { "claims.chow.allowed": true }
 *   { "derived.bonusTiles": { "not": 0 } }
 *   { "claims.chow.from": { "in": ["left", "any"] } }
 */
export type ConditionValue = unknown | { in: unknown[] } | { not: unknown };
export type Condition = Record<string, ConditionValue>;

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

function isObj(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

export function evaluateWhen(when: Condition | undefined, resolved: ResolvedRules): boolean {
  if (!when) return true;
  return Object.entries(when).every(([path, expected]) => {
    const actual = ruleValue(resolved, path);
    if (isObj(expected) && 'in' in expected && Array.isArray(expected.in)) {
      return expected.in.some((e) => same(e, actual));
    }
    if (isObj(expected) && 'not' in expected) return !same(expected.not, actual);
    return same(expected, actual);
  });
}
