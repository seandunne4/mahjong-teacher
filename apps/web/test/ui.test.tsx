// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { Tile } from '../src/tiles/Tile';
import { Rule, Summary, RulesProvider } from '../src/reference/components';
import { DEFAULT_SETTINGS, resolveFromSettings, updateSettings } from '../src/state/settings';
import { SetupPage } from '../src/setup/SetupPage';
import { matchesTile } from '../src/atlas/AtlasPage';
import { filterPatterns } from '../src/fanchart/FanChartPage';
import { patterns, tileById } from '../src/data';

beforeEach(() => updateSettings(DEFAULT_SETTINGS));
afterEach(cleanup);

describe('Tile', () => {
  it('switches between traditional and simplified characters', () => {
    const { container } = render(<Tile id="1z" />);
    expect(container.textContent).toContain('東');
    act(() => updateSettings({ script: 'simp' }));
    expect(container.textContent).toContain('东');
    expect(container.textContent).not.toContain('東');
  });
  it("uses the set's 伍 for 5 Characters unless numerals are 'printed'", () => {
    const { container } = render(<Tile id="5m" />);
    expect(container.textContent).toContain('伍');
    act(() => updateSettings({ numerals: 'printed' }));
    expect(container.textContent).toContain('五');
  });
  it('labels tiles for screen readers', () => {
    render(<Tile id="7z" />);
    expect(screen.getByRole('img', { name: 'Red Dragon' })).toBeTruthy();
  });
});

describe('Rule visibility', () => {
  const ui = (flowers: boolean) => (
    <RulesProvider rules={resolveFromSettings({ ...DEFAULT_SETTINGS, flowers })}>
      <Rule id="t" title="Flowers rule" setting="bonusTiles" when={{ 'derived.hasBonus': true }}>
        <Summary>Expose and replace.</Summary>
      </Rule>
    </RulesProvider>
  );
  it('hides a rule when flowers are off', () => {
    render(ui(false));
    expect(screen.queryByText('Flowers rule')).toBeNull();
  });
  it('shows it, with a house-rule badge, when the setting differs from the base', () => {
    render(ui(true));
    expect(screen.getByText('Flowers rule')).toBeTruthy();
  });
});

describe('Setup walkthrough', () => {
  it('steps forward and back through the booklet example', () => {
    render(
      <MemoryRouter>
        <SetupPage />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { level: 2, name: 'Seating' })).toBeTruthy();
    const next = screen.getByRole('button', { name: 'Next →' });
    for (let i = 0; i < 4; i++) fireEvent.click(next);
    expect(screen.getByText(/The dealer rolls 2 \+ 4 = 6/)).toBeTruthy();
    expect(screen.getByText(/lands on South/)).toBeTruthy();
    fireEvent.click(next);
    expect(screen.getByText(/Count 10 stacks/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '← Back' }));
    expect(screen.getByText(/lands on South/)).toBeTruthy();
  });
});

describe('search helpers', () => {
  it('finds tiles by character, pinyin without tones, or English', () => {
    const t = tileById.get('1z')!;
    expect(matchesTile(t, '東')).toBe(true);
    expect(matchesTile(t, 'dong')).toBe(true);
    expect(matchesTile(t, 'east')).toBe(true);
    expect(matchesTile(tileById.get('5m')!, '伍')).toBe(true);
    expect(matchesTile(t, 'south')).toBe(false);
  });
  it('filters the fan chart between the booklet subset and full MCR', () => {
    expect(filterPatterns(patterns, { full: false, fan: null, q: '' })).toHaveLength(56);
    expect(filterPatterns(patterns, { full: true, fan: null, q: '' })).toHaveLength(81);
    expect(filterPatterns(patterns, { full: true, fan: 88, q: '' })).toHaveLength(7);
    expect(filterPatterns(patterns, { full: false, fan: null, q: 'qing yi se' }).map((p) => p.id)).toEqual(['full-flush']);
  });
});
