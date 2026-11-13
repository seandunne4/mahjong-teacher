import tilesJson from '@mj/data/tiles.json';
import glossaryJson from '@mj/data/glossary.json';
import rulesetJson from '@mj/data/rulesets/ymi-beginner.json';
import casualJson from '@mj/data/profiles/casual.json';
import mcrProfileJson from '@mj/data/profiles/ymi-mcr.json';
import patternsJson from '@mj/data/patterns/mcr.json';
import {
  GlossarySchema,
  handTiles,
  parseHand,
  PatternLibrarySchema,
  RulesetSchema,
  ScoringProfileSchema,
  TileCatalogueSchema,
  type Pattern,
  type ScoringProfile,
  type TileId,
  type TileType,
} from '@mj/engine';

/** All data is validated once at startup, so a bad edit fails loudly. */
export const tiles = TileCatalogueSchema.parse(tilesJson);
export const tileById = new Map<TileId, TileType>(tiles.map((t) => [t.id, t]));
export const glossary = GlossarySchema.parse(glossaryJson);
export const baseRuleset = RulesetSchema.parse(rulesetJson);
export const profiles: ScoringProfile[] = [ScoringProfileSchema.parse(casualJson), ScoringProfileSchema.parse(mcrProfileJson)];
export const patterns: Pattern[] = PatternLibrarySchema.parse(patternsJson);

/** "Used in" for the tile atlas, derived from the pattern examples. */
export const patternsUsingTile = new Map<TileId, Pattern[]>();
for (const p of patterns) {
  if (p.category === 'situational') continue; // generic example hands
  for (const id of new Set(handTiles(parseHand(p.example)))) {
    const list = patternsUsingTile.get(id) ?? [];
    list.push(p);
    patternsUsingTile.set(id, list);
  }
}
for (const list of patternsUsingTile.values()) list.sort((a, b) => b.fan - a.fan);
