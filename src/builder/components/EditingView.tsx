import { useState } from 'react';
import type { PopupModal } from '@schema';
import { useBuilderStore } from '../store';
import { SettingsEditor, DesignEditor } from './SettingsEditor';
import { ContentItemsEditor } from './ContentItemsEditor';
import { PreviewPane } from './PreviewPane';
import { JsonPane } from './JsonPane';
import { useT, type Strings } from '../i18n';

type Tab = 'setup' | 'layout' | 'design';

// `labelKey` resolves against `t.edit` at render so tabs stay translated.
const TABS: { id: Tab; labelKey: keyof Strings['edit']; icon: JSX.Element }[] = [
  {
    id: 'setup',
    labelKey: 'tabSetup',
    icon: (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
  {
    id: 'layout',
    labelKey: 'tabLayout',
    icon: (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    id: 'design',
    labelKey: 'tabDesign',
    icon: (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M2 12a10 10 0 1 0 20 0c0-5.5-4.5-6-9-6-2 0-3 1-3 2.5S11.5 12 9 12s-4-1-4-3" />
        <circle cx="7.5" cy="10.5" r="1.2" fill="currentColor" stroke="none" />
        <circle cx="12" cy="7.5" r="1.2" fill="currentColor" stroke="none" />
        <circle cx="16.5" cy="10.5" r="1.2" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
];

export function EditingView({ popup }: { popup: PopupModal }) {
  const t = useT();
  const select = useBuilderStore((s) => s.select);
  const updatePopup = useBuilderStore((s) => s.updatePopup);
  const [tab, setTab] = useState<Tab>('setup');

  const patch = (p: Partial<PopupModal>) => updatePopup(popup.id, p);

  return (
    <div className="editing-view">
      {/* Narrow menu on the left */}
      <div className="edit-menu">
        <button className="ghost back" onClick={() => select(null)}>{t.edit.backToTemplates}</button>

        {/* Fixed tab bar */}
        <div className="tab-bar">
          {TABS.map((tabDef) => (
            <button
              key={tabDef.id}
              className={`tab-btn${tab === tabDef.id ? ' active' : ''}`}
              onClick={() => setTab(tabDef.id)}
            >
              {tabDef.icon}
              <span>{t.edit[tabDef.labelKey]}</span>
            </button>
          ))}
        </div>

        <input
          className="name-input"
          value={popup.name}
          onChange={(e) => patch({ name: e.target.value })}
        />

        <div className="tab-panel">
          {tab === 'setup' && <SettingsEditor popup={popup} onChange={patch} />}
          {tab === 'layout' && <ContentItemsEditor popup={popup} onChange={patch} />}
          {tab === 'design' && <DesignEditor popup={popup} onChange={patch} />}
        </div>
      </div>

      {/* Big display on the right */}
      <div className="edit-display">
        <div className="display-preview">
          <PreviewPane popup={popup} />
        </div>
        <div className="btn-row" style={{ justifyContent: 'flex-end' }}>
          <JsonPane popup={popup} />
        </div>
      </div>
    </div>
  );
}
