import { Link } from 'react-router';
import { useResolvedRules } from '../state/settings';

/** Shows which ruleset/profile is active and whether house rules change it. */
export function ActiveRulesBadge() {
  const r = useResolvedRules();
  const house = r.overridden.length;
  return (
    <Link to="/settings" className="pill rules-badge" title="Change house rules">
      {r.ruleset.name} · {r.profile.name} · {r.derived.tileCount} tiles
      {house > 0 && <span className="house"> · {house} house rule{house > 1 ? 's' : ''}</span>}
    </Link>
  );
}
