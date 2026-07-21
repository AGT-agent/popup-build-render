import { useCallback, useEffect, useRef, useState } from 'react';
import type { PopupModal } from '@schema';
import { PopupContent } from './PopupContent';
import { useTrigger } from './useTrigger';
import { canOpen, markShown } from './frequency';

export interface PopupMountProps {
  popup: PopupModal;
  fetchImpl?: typeof fetch;
  /** Preview mode: ignore frequency cap and don't record shows / navigate away. */
  preview?: boolean;
  /** Force-open immediately, bypassing the trigger (builder preview uses this). */
  forceOpen?: boolean;
  onClose?: () => void;
}

/**
 * The "mount" half: decides *whether* and *when* the popup shows (trigger +
 * frequency), handles dismiss affordances (overlay click, esc), and places it
 * as a full-page overlay or inline. Delegates all rendering to PopupContent.
 */
export function PopupMount({ popup, fetchImpl, preview, forceOpen, onClose }: PopupMountProps) {
  const [allowed] = useState(() => preview || forceOpen || canOpen(popup));
  const triggered = useTrigger(popup.trigger, allowed && !forceOpen);
  const shouldOpen = allowed && (forceOpen || triggered);

  const [open, setOpen] = useState(false);
  // Open only once per mount. Without this, closing (overlay/esc/X) would
  // immediately re-open because `shouldOpen` stays true after the trigger fires.
  const openedOnce = useRef(false);

  useEffect(() => {
    if (shouldOpen && !openedOnce.current) {
      openedOnce.current = true;
      setOpen(true);
      if (!preview) markShown(popup);
    }
  }, [shouldOpen, preview, popup]);

  const close = useCallback(() => {
    setOpen(false);
    onClose?.();
  }, [onClose]);

  // Esc to close, when dismissible.
  useEffect(() => {
    if (!open || popup.dismissible === false) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, popup.dismissible, close]);

  if (!open) return null;

  const content = <PopupContent popup={popup} onClose={close} fetchImpl={fetchImpl} preview={preview} />;

  // Inline placement (htmlId) renders the card in flow; overlay wraps it.
  if (popup.htmlId) return content;

  return (
    <div
      className="pm-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && popup.dismissible !== false) close();
      }}
    >
      {content}
    </div>
  );
}
