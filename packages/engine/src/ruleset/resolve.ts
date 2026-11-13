import {
  RulesetSchema,
  ScoringProfileSchema,
  type HouseRules,
  type Ruleset,
  type ScoringProfile,
} from './schema';

export interface DerivedRules {
  /** Number of bonus (flower + season) tiles in play: 0, 4 or 8. */
  bonusTiles: number;
  hasBonus: boolean;
  tileCount: number;
  stacksPerWall: number;
  tilesPerWall: number;
  deadWallTiles: number;
}

export interface ResolvedRules {
  ruleset: Ruleset;
  profile: ScoringProfile;
  houseRules: HouseRules;
  derived: DerivedRules;
  /** Paths ("claims.chow.from", "profile.minimumFan") whose value differs from the base. */
  overridden: string[];
}

const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T;

export function getPath(obj: unknown, path: string): unknown {
  let cur: unknown = obj;
  for (const key of path.split('.')) {
    if (cur === null || typeof cur !== 'object' || !(key in (cur as object))) return undefined;
    cur = (cur as Record<string, unknown>)[key];
  }
  return cur;
}

function setPath(obj: Record<string, unknown>, path: string, value: unknown): void {
  const keys = path.split('.');
  let cur: Record<string, unknown> = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const next = cur[keys[i]];
    if (next === null || typeof next !== 'object') {
      throw new Error(`House rule path "${path}" does not exist`);
    }
    cur = next as Record<string, unknown>;
  }
  const last = keys[keys.length - 1];
  if (!(last in cur)) throw new Error(`House rule path "${path}" does not exist`);
  cur[last] = value;
}

export function deriveRules(ruleset: Ruleset): DerivedRules {
  const t = ruleset.tiles;
  const bonusTiles = (t.bonus.flowers ? 4 : 0) + (t.bonus.seasons ? 4 : 0);
  const tileCount =
    t.suits.length * 36 + (t.winds ? 16 : 0) + (t.dragons ? 12 : 0) + bonusTiles + t.jokers;
  const stacksPerWall = bonusTiles > 0 ? ruleset.walls.stacksPerWall.withBonus : ruleset.walls.stacksPerWall.withoutBonus;
  const tilesPerWall = stacksPerWall * ruleset.walls.height;
  if (tilesPerWall * 4 !== tileCount) {
    throw new Error(
      `Wall size mismatch: ${tileCount} tiles but 4 walls of ${stacksPerWall}x${ruleset.walls.height} = ${tilesPerWall * 4}`,
    );
  }
  return {
    bonusTiles,
    hasBonus: bonusTiles > 0,
    tileCount,
    stacksPerWall,
    tilesPerWall,
    deadWallTiles: ruleset.deadWall.stacks * ruleset.walls.height,
  };
}

function diffPaths(a: unknown, b: unknown, prefix: string, out: string[]): void {
  if (a !== null && b !== null && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a)) {
    for (const k of Object.keys(a as object)) {
      diffPaths((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k], prefix ? `${prefix}.${k}` : k, out);
    }
    return;
  }
  if (JSON.stringify(a) !== JSON.stringify(b)) out.push(prefix);
}

/** Layer ruleset ⊕ profile ⊕ house rules. Throws on unknown paths or invalid results. */
export function resolveRules(
  baseRuleset: Ruleset,
  baseProfile: ScoringProfile,
  houseRules: HouseRules = {},
): ResolvedRules {
  const ruleset = clone(baseRuleset) as unknown as Record<string, unknown>;
  const profile = clone(baseProfile) as unknown as Record<string, unknown>;
  for (const [path, value] of Object.entries(houseRules)) {
    if (path.startsWith('profile.')) setPath(profile, path.slice('profile.'.length), value);
    else setPath(ruleset, path, value);
  }
  const r = RulesetSchema.parse(ruleset);
  const p = ScoringProfileSchema.parse(profile);
  const overridden: string[] = [];
  diffPaths(baseRuleset, r, '', overridden);
  const profileDiffs: string[] = [];
  diffPaths(baseProfile, p, '', profileDiffs);
  overridden.push(...profileDiffs.map((x) => `profile.${x}`));
  return { ruleset: r, profile: p, houseRules, derived: deriveRules(r), overridden };
}

/**
 * Read a value for content: plain paths read the ruleset, "profile.x" the scoring profile,
 * "derived.x" the computed values (tileCount, stacksPerWall, ...).
 */
export function ruleValue(resolved: ResolvedRules, path: string): unknown {
  if (path.startsWith('profile.')) return getPath(resolved.profile, path.slice(8));
  if (path.startsWith('derived.')) return getPath(resolved.derived, path.slice(8));
  return getPath(resolved.ruleset, path);
}

/** True if this path (or anything under it) was changed by a house rule. */
export function isOverridden(resolved: ResolvedRules, path: string): boolean {
  return resolved.overridden.some((p) => p === path || p.startsWith(`${path}.`));
}
