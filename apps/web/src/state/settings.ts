import { useMemo, useSyncExternalStore } from 'react';
import { resolveRules, type HouseRules, type ResolvedRules } from '@mj/engine';
import { baseRuleset, profiles } from '../data';

export interface Settings {
  /** House rules */
  flowers: boolean;
  allEightWins: boolean;
  seatFlowers: boolean;
  noFlowerBonus: boolean;
  profileId: string;
  minimumFanOverride: number | null;
  /** Display */
  script: 'trad' | 'simp';
  numerals: 'set' | 'printed';
  badges: boolean;
  level: 'beginner' | 'expert';
  theme: 'auto' | 'light' | 'dark';
}

export const DEFAULT_SETTINGS: Settings = {
  flowers: false, // our group plays without flowers and seasons (136 tiles)
  allEightWins: false,
  seatFlowers: false,
  noFlowerBonus: false,
  profileId: 'casual',
  minimumFanOverride: null,
  script: 'trad',
  numerals: 'set',
  badges: true,
  level: 'beginner',
  theme: 'auto',
};

const KEY = 'mj-teacher.settings.v1';
const listeners = new Set<() => void>();

function load(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<Settings>) };
  } catch {
    /* storage unavailable: fall back to defaults */
  }
  return DEFAULT_SETTINGS;
}

let current: Settings = load();

export function getSettings(): Settings {
  return current;
}

export function updateSettings(patch: Partial<Settings>): void {
  current = { ...current, ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(current));
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

export function resetSettings(): void {
  updateSettings(DEFAULT_SETTINGS);
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function useSettings(): Settings {
  return useSyncExternalStore(subscribe, getSettings, getSettings);
}

/** Translate UI settings into ruleset house-rule overrides (the same shape Phase 4's editor exports). */
export function houseRulesFrom(s: Settings): HouseRules {
  const h: HouseRules = {};
  if (s.flowers !== baseRuleset.tiles.bonus.flowers) {
    h['tiles.bonus.flowers'] = s.flowers;
    h['tiles.bonus.seasons'] = s.flowers;
  }
  if (s.allEightWins) h['bonusTiles.allEightWins'] = true;
  if (s.seatFlowers) h['bonusTiles.seatMatching'] = true;
  if (s.noFlowerBonus) h['profile.bonusFan.noFlowerBonus'] = 1;
  if (s.minimumFanOverride !== null) h['profile.minimumFan'] = s.minimumFanOverride;
  return h;
}

export function resolveFromSettings(s: Settings): ResolvedRules {
  const profile = profiles.find((p) => p.id === s.profileId) ?? profiles[0];
  return resolveRules(baseRuleset, profile, houseRulesFrom(s));
}

export function useResolvedRules(): ResolvedRules {
  const s = useSettings();
  return useMemo(() => resolveFromSettings(s), [s]);
}
