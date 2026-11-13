import { describe, expect, it } from 'vitest';
import { checkTileCount, formatHand, handTiles, parseHand } from '../src';

describe('parseHand', () => {
  it('parses suits, marks and sections', () => {
    const h = parseHand('123m 555p* 1111s! | 77z');
    expect(h).toHaveLength(2);
    expect(h[0][0]).toEqual({ tiles: ['1m', '2m', '3m'], mark: 'none' });
    expect(h[0][1].mark).toBe('exposed');
    expect(h[0][2].mark).toBe('concealedKong');
    expect(h[1][0].tiles).toEqual(['7z', '7z']);
  });
  it('accepts honor aliases, with Wh beating W', () => {
    expect(handTiles(parseHand('EEE WhWh W R G N S'))).toEqual(['1z', '1z', '1z', '5z', '5z', '3z', '7z', '6z', '4z', '2z']);
  });
  it('rejects bad tiles', () => {
    expect(() => parseHand('8z')).toThrow();
    expect(() => parseHand('5f')).toThrow();
    expect(() => parseHand('12q')).toThrow();
  });
  it('round-trips through formatHand', () => {
    for (const s of ['123m 555p* 1111s! | 77z', '1f 2x', '19m 19p 19s 1234567z 1m']) {
      expect(parseHand(formatHand(parseHand(s)))).toEqual(parseHand(s));
      expect(formatHand(parseHand(s))).toBe(s);
    }
  });
});

describe('checkTileCount', () => {
  it('accepts 14 tiles, plus one per kong, ignoring bonus tiles', () => {
    expect(checkTileCount(parseHand('123m 456p 789s 234s 55m')).ok).toBe(true);
    expect(checkTileCount(parseHand('1111m! 123m 456p 789s 55z')).ok).toBe(false); // 1m x5
    expect(checkTileCount(parseHand('2222m! 345m 456p 789s 55z')).ok).toBe(true);
    expect(checkTileCount(parseHand('123m 456p 789s 234s 55m | 1f 2x')).ok).toBe(true);
  });
  it('rejects wrong counts', () => {
    expect(checkTileCount(parseHand('123m 456p 789s 55m')).ok).toBe(false);
  });
});
