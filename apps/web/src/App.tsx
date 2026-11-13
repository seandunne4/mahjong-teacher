import { useEffect } from 'react';
import { HashRouter, NavLink, Route, Routes, useLocation } from 'react-router';
import { HomePage } from './home/HomePage';
import { AtlasPage } from './atlas/AtlasPage';
import { GlossaryPage } from './glossary/GlossaryPage';
import { RulesPage } from './reference/RulesPage';
import { SetupPage } from './setup/SetupPage';
import { FanChartPage } from './fanchart/FanChartPage';
import { SettingsPage } from './settings/SettingsPage';
import { useSettings } from './state/settings';

const NAV = [
  { to: '/tiles', label: 'Tiles' },
  { to: '/setup', label: 'Setup' },
  { to: '/rules', label: 'Rules' },
  { to: '/fan', label: 'Fan chart' },
  { to: '/glossary', label: 'Table talk' },
  { to: '/settings', label: 'Settings' },
];

function Shell() {
  const { theme } = useSettings();
  const loc = useLocation();
  const cast = loc.pathname === '/setup/cast';

  useEffect(() => {
    if (theme === 'auto') delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    if (!loc.search.includes('rule=')) window.scrollTo(0, 0);
  }, [loc.pathname, loc.search]);

  return (
    <>
      {!cast && (
        <header className="topbar">
          <NavLink to="/" className="brand" end>
            <span className="brand-mark" aria-hidden>
              中
            </span>
            Mahjong Teacher
          </NavLink>
          <nav aria-label="Main">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to}>
                {n.label}
              </NavLink>
            ))}
          </nav>
        </header>
      )}
      <main className={cast ? 'main cast' : 'main'}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/tiles" element={<AtlasPage />} />
          <Route path="/glossary" element={<GlossaryPage />} />
          <Route path="/rules" element={<RulesPage />} />
          <Route path="/rules/:topic" element={<RulesPage />} />
          <Route path="/setup" element={<SetupPage />} />
          <Route path="/setup/cast" element={<SetupPage cast />} />
          <Route path="/fan" element={<FanChartPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </main>
      {!cast && (
        <footer className="footer small muted">
          Rules follow Yellow Mountain Imports' "How To Play Chinese Mahjong" (v1-80). Tile art and diagrams are original.
        </footer>
      )}
    </>
  );
}

export function App() {
  return (
    <HashRouter>
      <Shell />
    </HashRouter>
  );
}
