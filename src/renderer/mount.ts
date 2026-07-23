import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { PopupModal } from '@schema';
import { PopupMount } from './PopupMount';

export interface MountOptions {
  fetchImpl?: typeof fetch;
  onClose?: () => void;
}

export interface MountHandle {
  unmount: () => void;
}

/** No-op handle returned when there is nothing to render. */
const NOOP_HANDLE: MountHandle = { unmount() {} };

/**
 * Storefront entry point. Give it a popup JSON and it wires up the trigger,
 * frequency cap and placement, then renders when appropriate.
 *
 * `htmlId` acts purely as a page gate — it decides *whether* the popup shows,
 * not where it renders. The popup is always a full-page overlay modal.
 * - No `htmlId`: always renders (on every page it's loaded on).
 * - `htmlId` matches an element on the page: renders as a full-page overlay.
 * - `htmlId` set but no match: renders nothing (does NOT fall back to <body>).
 */
export function mountPopup(popup: PopupModal, opts: MountOptions = {}): MountHandle {
  // htmlId is an opt-in page gate: if the target isn't on the page, the popup
  // is meant for a different page, so render nothing at all.
  if (popup.htmlId && !document.getElementById(popup.htmlId)) return NOOP_HANDLE;

  const container = document.createElement('div');
  container.setAttribute('data-popup-root', popup.id);
  document.body.appendChild(container);

  const root: Root = createRoot(container);
  root.render(
    createElement(PopupMount, {
      popup,
      fetchImpl: opts.fetchImpl,
      onClose: opts.onClose,
    }),
  );

  return {
    unmount() {
      root.unmount();
      container.remove();
    },
  };
}
