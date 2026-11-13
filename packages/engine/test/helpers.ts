import rulesetJson from '@mj/data/rulesets/ymi-beginner.json';
import casualJson from '@mj/data/profiles/casual.json';
import mcrProfileJson from '@mj/data/profiles/ymi-mcr.json';
import { RulesetSchema, ScoringProfileSchema, resolveRules, type HouseRules } from '../src';

export const ruleset = RulesetSchema.parse(rulesetJson);
export const casual = ScoringProfileSchema.parse(casualJson);
export const mcrProfile = ScoringProfileSchema.parse(mcrProfileJson);

export const NO_FLOWERS: HouseRules = { 'tiles.bonus.flowers': false, 'tiles.bonus.seasons': false };

export const rules = (house: HouseRules = {}) => resolveRules(ruleset, casual, house);
