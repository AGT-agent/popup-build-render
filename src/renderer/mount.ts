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

/**
 * Storefront entry point. Give it a popup JSON and it wires up the trigger,
 * frequency cap and placement, then renders when appropriate.
 *
 * - If `popup.htmlId` matches an element on the page, the modal mounts inline
 *   into it. Otherwise it mounts a fresh full-page overlay container on <body>.
 */
export function mountPopup(popup: PopupModal, opts: MountOptions = {}): MountHandle {
  const inlineTarget = popup.htmlId ? document.getElementById(popup.htmlId) : null;

  let container: HTMLElement;
  let ownsContainer = false;
  if (inlineTarget) {
    container = inlineTarget;
  } else {
    container = document.createElement('div');
    container.setAttribute('data-popup-root', popup.id);
    document.body.appendChild(container);
    ownsContainer = true;
  }

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
      if (ownsContainer) container.remove();
    },
  };
}
