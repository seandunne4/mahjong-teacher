import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Self-hosted, OFL-licensed fonts (split by unicode range, so only used glyphs download).
import '@fontsource/noto-serif-tc/500.css';
import '@fontsource/noto-serif-sc/500.css';
import '@fontsource/lxgw-wenkai-tc/700.css';
import './styles.css';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
