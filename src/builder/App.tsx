import { useEffect, useRef } from 'react';
import type { PopupModal } from '@schema';
import { selectActivePopup, useBuilderStore } from './store';
import { SavingView } from './components/SavingView';
import { EditingView } from './components/EditingView';

export interface PopupBuilderProps {
  /**
   * Called with the popup marked "in use" — on mount, when a different one is
   * marked, when it's edited, and with null when it's cleared or deleted.
   * Saves the host app from polling getActivePopup().
   */
  onActiveChange?: (popup: PopupModal | null) => void;
}

export function App({ onActiveChange }: PopupBuilderProps = {}) {
  const selectedId = useBuilderStore((s) => s.selectedId);
  const popups = useBuilderStore((s) => s.popups);
  const selected = popups.find((p) => p.id === selectedId) ?? null;

  useActiveChange(onActiveChange);

  // Two parts: the saving view (template list) and the editing view.
  // Selecting a template moves you into editing; "← All templates" returns.
  return selected ? <EditingView popup={selected} /> : <SavingView />;
}

/**
 * Notifies on every new active popup, identity-compared. Held in a ref so an
 * inline arrow prop doesn't re-fire the callback on each render.
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
