import { useEffect, useRef } from 'react';
import { shallow } from 'zustand/shallow';
import type { PopupModal } from '@schema';
import { selectActivePopup, selectActivePopups, useBuilderStore } from './store';
import { SavingView } from './components/SavingView';
import { EditingView } from './components/EditingView';
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
}

export function App({ lang = 'en', theme = 'light', onActiveChange, onActiveChangeMany }: PopupBuilderProps = {}) {
  const selectedId = useBuilderStore((s) => s.selectedId);
  const popups = useBuilderStore((s) => s.popups);
  const selected = popups.find((p) => p.id === selectedId) ?? null;

  useActiveChange(onActiveChange);
  useActiveChangeMany(onActiveChangeMany);

  // Two parts: the saving view (template list) and the editing view.
  // Selecting a template moves you into editing; "← All templates" returns.
  return (
    <LangProvider lang={lang}>
      <div className="popup-builder-root" data-theme={theme} dir={isRtl(lang) ? 'rtl' : 'ltr'}>
        {selected ? <EditingView popup={selected} /> : <SavingView />}
      </div>
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
