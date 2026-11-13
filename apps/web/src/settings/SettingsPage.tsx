import type { ReactNode } from 'react';
import { profiles } from '../data';
import { houseRulesFrom, resetSettings, updateSettings, useResolvedRules, useSettings } from '../state/settings';
import { Tile } from '../tiles/Tile';

function Row({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="setting-row">
      <div>
        <div className="setting-label">{label}</div>
        {hint && <div className="small muted">{hint}</div>}
      </div>
      <div className="setting-control">{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="switch">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} aria-label={label} />
      <span>{checked ? 'On' : 'Off'}</span>
    </label>
  );
}

export function SettingsPage() {
  const s = useSettings();
  const rules = useResolvedRules();
  const house = houseRulesFrom(s);

  return (
    <div className="page settings">
      <header className="page-head">
        <h1>Settings</h1>
        <p>House rules change what the reference and setup show. Everything is saved in this browser.</p>
      </header>

      <section className="card">
        <h2>House rules</h2>
        <Row label="Play with flowers and seasons" hint={`${rules.derived.tileCount} tiles, walls ${rules.derived.stacksPerWall} stacks long. Our group usually plays without (136).`}>
          <Toggle label="Flowers and seasons" checked={s.flowers} onChange={(v) => updateSettings({ flowers: v })} />
        </Row>
        {s.flowers && (
          <>
            <Row label="Collecting all 8 flowers wins the hand" hint="Off: each flower is just +1 fan.">
              <Toggle label="All 8 flowers wins" checked={s.allEightWins} onChange={(v) => updateSettings({ allEightWins: v })} />
            </Row>
            <Row label="Extra fan for your own seat's flower" hint="Not in the booklet; many groups play it.">
              <Toggle label="Seat flowers" checked={s.seatFlowers} onChange={(v) => updateSettings({ seatFlowers: v })} />
            </Row>
            <Row label="1 fan for having no flowers" hint="The booklet's optional house rule.">
              <Toggle label="No-flower bonus" checked={s.noFlowerBonus} onChange={(v) => updateSettings({ noFlowerBonus: v })} />
            </Row>
          </>
        )}
        <Row label="Scoring profile" hint={profiles.find((p) => p.id === s.profileId)?.description}>
          <select value={s.profileId} onChange={(e) => updateSettings({ profileId: e.target.value, minimumFanOverride: null })}>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </Row>
        <Row label="Minimum fan to win" hint="Leave blank to use the profile's value.">
          <input
            type="number"
            min={0}
            max={88}
            inputMode="numeric"
            placeholder={String(profiles.find((p) => p.id === s.profileId)?.minimumFan ?? 0)}
            value={s.minimumFanOverride ?? ''}
            onChange={(e) => updateSettings({ minimumFanOverride: e.target.value === '' ? null : Math.max(0, Math.min(88, Number(e.target.value))) })}
          />
        </Row>
        <details className="small">
          <summary>House rules as data ({Object.keys(house).length})</summary>
          <pre>{JSON.stringify(house, null, 2)}</pre>
          <p className="muted">This is the override file a future "share our rules" export will produce.</p>
        </details>
      </section>

      <section className="card">
        <h2>Tile display</h2>
        <Row label="Characters" hint="Our set uses traditional characters.">
          <div className="segmented">
            <button type="button" aria-pressed={s.script === 'trad'} onClick={() => updateSettings({ script: 'trad' })}>
              Traditional 東 萬 發
            </button>
            <button type="button" aria-pressed={s.script === 'simp'} onClick={() => updateSettings({ script: 'simp' })}>
              Simplified 东 万 发
            </button>
          </div>
        </Row>
        <Row label="Numeral style" hint="'Like our set' uses brush lettering and the formal 伍 for 5.">
          <div className="segmented">
            <button type="button" aria-pressed={s.numerals === 'set'} onClick={() => updateSettings({ numerals: 'set' })}>
              Like our set
            </button>
            <button type="button" aria-pressed={s.numerals === 'printed'} onClick={() => updateSettings({ numerals: 'printed' })}>
              Printed
            </button>
          </div>
        </Row>
        <Row label="Corner hints on tiles" hint="Small 1–9 and E/S/W/N labels for beginners.">
          <Toggle label="Corner hints" checked={s.badges} onChange={(v) => updateSettings({ badges: v })} />
        </Row>
        <div className="tile-preview">
          {['5m', '1z', '3z', '6z', '5z', '1p', '1s', '8s'].map((id) => (
            <Tile key={id} id={id} size={48} />
          ))}
        </div>
        <Row label="Rules detail" hint="Beginner opens the full rule; Expert shows summaries only.">
          <div className="segmented">
            <button type="button" aria-pressed={s.level === 'beginner'} onClick={() => updateSettings({ level: 'beginner' })}>
              Beginner
            </button>
            <button type="button" aria-pressed={s.level === 'expert'} onClick={() => updateSettings({ level: 'expert' })}>
              Expert
            </button>
          </div>
        </Row>
        <Row label="Theme">
          <select value={s.theme} onChange={(e) => updateSettings({ theme: e.target.value as typeof s.theme })}>
            <option value="auto">Match system</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </Row>
      </section>
      <button type="button" onClick={() => resetSettings()}>
        Reset all settings
      </button>
    </div>
  );
}
