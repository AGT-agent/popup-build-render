import { useEffect, useRef, type CSSProperties } from 'react';
import { shallow } from 'zustand/shallow';
import type { CustomFieldDef, CustomFieldDraft, PopupModal } from '@schema';
import { selectActivePopup, selectActivePopups, useBuilderStore } from './store';
import { SavingView } from './components/SavingView';
import { EditingView } from './components/EditingView';
import { CustomFieldsProvider } from './customFields';
import { LangProvider, isRtl, type Lang } from './i18n';

export interface PopupBuilderProps {
  /**
   * UI language for the builder chrome. Defaults to 'en'. 'he' also flips the
   * layout to right-to-left. Does not affect the popup content the host edits.
   */
  lang?: Lang;
  /**
   * Visual theme for the builder chrome. Defaults to 'light'. Only affects the
   * builder UI, not the popup content the host edits.
   */
  theme?: 'light' | 'dark';
  /**
   * Accent color for the builder chrome (buttons, active tabs, focus rings) as
   * any CSS color. Overrides the built-in green. Only affects the builder UI,
   * not the popup content the host edits.
   */
  accent?: string;
  /**
   * Optional gradient (any CSS `<image>`, e.g. `linear-gradient(...)`) for the
   * filled surfaces only — primary buttons and the active tab. Text, borders,
   * and focus rings still use the solid `accent`, which also acts as the
   * fallback here. Only affects the builder UI, not the popup content.
   */
  accentGradient?: string;
  /**
   * Called with the single Active popup — on mount, when a different one is
   * marked, when it's edited, and with null when it's cleared or deleted. When
   * several are Active this is the first of them. Saves the host app from
   * polling getActivePopup().
   */
  onActiveChange?: (popup: PopupModal | null) => void;
  /**
   * Called with the full list of Active popups — on mount and whenever the
   * marks, contents, or order change. The multi-template equivalent of
   * onActiveChange; saves the host from polling getActivePopups().
   */
  onActiveChangeMany?: (popups: PopupModal[]) => void;
  /**
   * Called with the popup being edited when the host clicks "Publish" in the
   * preview toolbar. The editor takes no action itself — the host decides what
   * publishing means (save to a backend, mark live, etc.). The button only
   * appears when this is provided.
   */
  onPublish?: (popup: PopupModal) => void;
  /**
   * The host's own fields, shown in the layout picker under "Your fields". Each
   * becomes a pre-filled input whose submit `key` is the host's — the source of
   * truth. Passing this (or `onCreateField`) puts the builder in integration
   * mode: our generic input types give way to the host's fields.
   */
  customFields?: CustomFieldDef[];
  /**
   * Called when an author creates a field in the picker. The host persists it
   * and resolves with the finalized def (real `key`); the builder shows a loader
   * until then, then adds it. Rejecting surfaces an inline error. When omitted,
   * new fields are added locally with a slugged key.
   */
  onCreateField?: (draft: CustomFieldDraft) => Promise<CustomFieldDef>;
}

export function App({
  lang = 'en',
  theme = 'light',
  accent,
  accentGradient,
  onActiveChange,
  onActiveChangeMany,
  onPublish,
  customFields,
  onCreateField,
}: PopupBuilderProps = {}) {
  const selectedId = useBuilderStore((s) => s.selectedId);
  const popups = useBuilderStore((s) => s.popups);
  const selected = popups.find((p) => p.id === selectedId) ?? null;

  useActiveChange(onActiveChange);
  useActiveChangeMany(onActiveChangeMany);

  // Host overrides ride in as inline CSS vars; the stylesheet supplies defaults.
  const styleVars: Record<string, string> = {};
  if (accent) styleVars['--accent'] = accent;
  if (accentGradient) styleVars['--accent-gradient'] = accentGradient;
  const rootStyle = Object.keys(styleVars).length ? (styleVars as CSSProperties) : undefined;

  // Two parts: the saving view (template list) and the editing view.
  // Selecting a template moves you into editing; "← All templates" returns.
  return (
    <LangProvider lang={lang}>
      <CustomFieldsProvider fields={customFields} createField={onCreateField}>
        <div
          className="popup-builder-root"
          data-theme={theme}
          dir={isRtl(lang) ? 'rtl' : 'ltr'}
          style={rootStyle}
        >
          {selected ? <EditingView popup={selected} onPublish={onPublish} /> : <SavingView />}
        </div>
      </CustomFieldsProvider>
    </LangProvider>
  );
}

/**
 * Notifies on every new single Active popup, identity-compared. Held in a ref so
 * an inline arrow prop doesn't re-fire the callback on each render.
 */
function useActiveChange(onActiveChange?: (popup: PopupModal | null) => void) {
  const active = useBuilderStore(selectActivePopup);
  const cb = useRef(onActiveChange);

  useEffect(() => {
    cb.current = onActiveChange;
  });

  useEffect(() => {
    cb.current?.(active);
  }, [active]);
}

/** The multi-template counterpart of useActiveChange. */
function useActiveChangeMany(onActiveChangeMany?: (popups: PopupModal[]) => void) {
  // shallow keeps the array reference stable while its members are unchanged,
  // so the effect below fires only on a real change to the Active set.
  const active = useBuilderStore(selectActivePopups, shallow);
  const cb = useRef(onActiveChangeMany);

  useEffect(() => {
    cb.current = onActiveChangeMany;
  });

  useEffect(() => {
    cb.current?.(active);
  }, [active]);
}
