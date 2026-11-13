import { z } from 'zod';

/* ------------------------------------------------------------------ */
/* Shared enums                                                        */
/* ------------------------------------------------------------------ */

export const SeatSchema = z.enum(['E', 'S', 'W', 'N']);
export type Seat = z.infer<typeof SeatSchema>;

export const SuitSchema = z.enum(['characters', 'dots', 'bamboo']);
export type Suit = z.infer<typeof SuitSchema>;

export const ClaimTypeSchema = z.enum(['mahjong', 'pung', 'kong', 'chow']);
export const DealerExtraModeSchema = z.enum(['twoAtOnce', 'oneThenOne']);
export type DealerExtraMode = z.infer<typeof DealerExtraModeSchema>;

export const HandShapeSchema = z.enum(['standard', 'sevenPairs', 'thirteenOrphans', 'knitted']);
export type HandShape = z.infer<typeof HandShapeSchema>;

const int = z.number().int();
const posInt = int.positive();

/* ------------------------------------------------------------------ */
/* Ruleset: how one variant is played                                  */
/* ------------------------------------------------------------------ */

export const RulesetSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    version: posInt,
    source: z.string(),
    tiles: z
      .object({
        suits: z.array(SuitSchema).min(1),
        winds: z.boolean(),
        dragons: z.boolean(),
        bonus: z.object({ flowers: z.boolean(), seasons: z.boolean() }).strict(),
        jokers: int.min(0),
      })
      .strict(),
    seating: z
      .object({
        order: z.array(SeatSchema).length(4),
        turnDirection: z.enum(['counterclockwise', 'clockwise']),
        methods: z.array(z.enum(['coinIndicators', 'windTiles'])),
      })
      .strict(),
    dealerSelection: z
      .object({
        methods: z.array(z.enum(['eastSeat', 'highestRoll', 'countAround'])).min(1),
        default: z.enum(['eastSeat', 'highestRoll', 'countAround']),
        dice: posInt,
      })
      .strict(),
    walls: z
      .object({
        height: posInt,
        stacksPerWall: z.object({ withBonus: posInt, withoutBonus: posInt }).strict(),
      })
      .strict(),
    wallBreak: z
      .object({
        dice: posInt,
        rolls: z.enum(['dealerThenChosenSide', 'dealerOnly']),
        count: z.enum(['rightToLeft']),
        overflow: z.enum(['continueToNextWall', 'wrapSameWall']),
        dealerTakesFrom: z.enum(['leftOfBreak']),
      })
      .strict(),
    deadWall: z
      .object({
        stacks: int.min(0),
        position: z.enum(['rightOfBreak']),
        onExhausted: z.enum(['tailOfLiveWall', 'drawGame']),
      })
      .strict(),
    deal: z
      .object({
        rounds: z.array(posInt).min(1),
        handSize: posInt,
        dealerExtra: int.min(0),
        dealerExtraModes: z.array(DealerExtraModeSchema).min(1),
        defaultDealerExtraMode: DealerExtraModeSchema,
      })
      .strict(),
    bonusTiles: z
      .object({
        replaceFrom: z.enum(['deadWall']),
        repeatUntilNonBonus: z.boolean(),
        fanEach: z.number().min(0),
        countsTowardMinimum: z.boolean(),
        allEightWins: z.boolean(),
        seatMatching: z.boolean(),
      })
      .strict(),
    claims: z
      .object({
        chow: z.object({ allowed: z.boolean(), from: z.enum(['left', 'any']) }).strict(),
        pung: z.object({ from: z.enum(['any']) }).strict(),
        kong: z.object({ from: z.enum(['any']), replacementFrom: z.enum(['deadWall']) }).strict(),
        priority: z.array(z.union([ClaimTypeSchema, z.array(ClaimTypeSchema)])).min(1),
        skipsTurns: z.boolean(),
        multipleWinners: z.enum(['nearestInTurnOrder', 'all']),
        robbingKong: z.boolean(),
      })
      .strict(),
    kongTypes: z.array(z.enum(['concealed', 'melded', 'added'])),
    winning: z
      .object({
        sets: posInt,
        pairs: posInt,
        specialShapes: z.array(HandShapeSchema),
        selfDraw: z.boolean(),
        fromDiscard: z.boolean(),
      })
      .strict(),
    drawGame: z.object({ when: z.enum(['liveWallExhausted']) }).strict(),
    dealerRotation: z
      .object({
        staysOn: z.array(z.enum(['dealerWin', 'draw'])),
        passTo: z.enum(['right']),
      })
      .strict(),
    gameLength: z.object({ rounds: posInt, minHands: posInt }).strict(),
    falseMahjong: z
      .object({
        practice: z.enum(['undoWithWarning']),
        table: z.enum(['houseRulePenalty', 'none']),
      })
      .strict(),
    defaultScoringProfile: z.string(),
  })
  .strict();
export type Ruleset = z.infer<typeof RulesetSchema>;

/* ------------------------------------------------------------------ */
/* Scoring profile: which patterns count, minimum, payment             */
/* ------------------------------------------------------------------ */

export const ScoringProfileSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    description: z.string().optional(),
    patternLibrary: z.string(),
    minimumFan: int.min(0),
    minimumCountsBonus: z.boolean(),
    chickenHand: z.object({ enabled: z.boolean(), fan: int.min(0) }).strict(),
    exclusions: z.boolean(),
    patterns: z
      .object({
        include: z.enum(['all', 'booklet']),
        overrides: z.record(
          z.string(),
          z.object({ fan: int.min(0).optional(), enabled: z.boolean().optional() }).strict(),
        ),
      })
      .strict(),
    bonusFan: z.object({ perFlower: z.number().min(0), noFlowerBonus: z.number().min(0) }).strict(),
    payment: z
      .object({
        type: z.enum(['simple', 'doubling']),
        fanUnit: z.number().positive(),
        discard: z.enum(['discarderPays', 'allPay']),
        selfDraw: z.enum(['allThreePay']),
        base: z.number().min(0),
      })
      .strict(),
  })
  .strict();
export type ScoringProfile = z.infer<typeof ScoringProfileSchema>;

/* ------------------------------------------------------------------ */
/* Scoring pattern (fan chart entry; detector filled in Phase 3)       */
/* ------------------------------------------------------------------ */

export const PatternSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    fan: posInt,
    nameEn: z.string().min(1),
    hanzi: z.object({ trad: z.string().min(1), simp: z.string().min(1) }).strict(),
    pinyin: z.string().min(1),
    inBooklet: z.boolean(),
    category: z.enum([
      'honors',
      'terminals',
      'suits',
      'chows',
      'pungs',
      'kongs',
      'concealment',
      'special',
      'situational',
      'bonus',
      'basic',
    ]),
    summary: z.string().min(1),
    note: z.string().optional(),
    example: z.string().min(1),
    excludes: z.array(z.string()),
    detector: z.string().min(1),
    shape: HandShapeSchema,
  })
  .strict();
export type Pattern = z.infer<typeof PatternSchema>;
export const PatternLibrarySchema = z.array(PatternSchema);

/* ------------------------------------------------------------------ */
/* Tiles and glossary                                                  */
/* ------------------------------------------------------------------ */

export const TileIdSchema = z.string().regex(/^([1-9][mps]|[1-7]z|[1-4][fx])$/);
export type TileId = string;

export const TileTypeSchema = z
  .object({
    id: TileIdSchema,
    group: z.enum(['suit', 'honor', 'bonus']),
    suit: SuitSchema.optional(),
    rank: posInt.max(9).optional(),
    kind: z.enum(['wind', 'dragon', 'flower', 'season']).optional(),
    english: z.string().min(1),
    short: z.string().min(1),
    hanzi: z
      .object({ trad: z.string().min(1), simp: z.string().min(1), setForm: z.string().optional() })
      .strict(),
    pinyin: z.object({ marks: z.string().min(1), numbered: z.string().min(1) }).strict(),
    copies: z.union([z.literal(4), z.literal(1)]),
    faceNotes: z.string(),
    lookAlikes: z.array(TileIdSchema).optional(),
  })
  .strict();
export type TileType = z.infer<typeof TileTypeSchema>;
export const TileCatalogueSchema = z.array(TileTypeSchema);

export const GlossaryEntrySchema = z
  .object({
    id: z.string().min(1),
    category: z.enum(['action', 'stage', 'term', 'tiles']),
    hanzi: z.object({ trad: z.string().min(1), simp: z.string().min(1) }).strict(),
    pinyin: z.string().min(1),
    english: z.string().min(1),
    meaning: z.string().min(1),
    note: z.string().optional(),
  })
  .strict();
export type GlossaryEntry = z.infer<typeof GlossaryEntrySchema>;
export const GlossarySchema = z.array(GlossaryEntrySchema);

/** House rules: path -> value overrides. "profile.x" targets the scoring profile. */
export const HouseRulesSchema = z.record(z.string(), z.unknown());
export type HouseRules = z.infer<typeof HouseRulesSchema>;
