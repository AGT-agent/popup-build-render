import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import type { Lang } from './i18n';
import './builder.css';

// Dev entry only: `?lang=he` and `?theme=dark` preview those settings locally.
const params = new URLSearchParams(window.location.search);
const lang: Lang = params.get('lang') === 'he' ? 'he' : 'en';
const theme = params.get('theme') === 'dark' ? 'dark' : 'light';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App lang={lang} theme={theme} />
  </StrictMode>,
);
