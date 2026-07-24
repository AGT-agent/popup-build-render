import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import type { Lang } from './i18n';
import './builder.css';

// Dev entry only: `?lang=he` lets you preview a non-default language locally.
const lang: Lang = new URLSearchParams(window.location.search).get('lang') === 'he' ? 'he' : 'en';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App lang={lang} />
  </StrictMode>,
);
