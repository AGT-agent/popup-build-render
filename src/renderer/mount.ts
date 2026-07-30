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

/** How long to keep watching for a `selector` match before giving up. */
const SELECTOR_WAIT_MS = 10_000;

/**
 * Storefront entry point. Give it a popup JSON and it wires up the trigger,
 * frequency cap and placement, then renders when appropriate.
 *
 * `selector` acts purely as a page gate — it decides *whether* the popup shows,
 * not where it renders. The popup is always a full-page overlay modal appended
 * to `<body>`; the matched element is never used as a mount point.
 * - No `selector`: always renders (on every page it's loaded on).
 * - `selector` matches an element: renders as a full-page overlay.
 * - `selector` matches nothing yet: waits up to `SELECTOR_WAIT_MS` for one to
 *   appear (storefronts render late), then renders. Never falls back to always-on.
 */
export function mountPopup(popup: PopupModal, opts: MountOptions = {}): MountHandle {
  const { selector } = popup;
  if (!selector) return render(popup, opts);

  // An invalid selector can never match, and querySelector throws on it — treat
  // it as "wrong page" instead of letting it break the host page's script.
  if (!isValidSelector(selector)) return NOOP_HANDLE;

  if (document.querySelector(selector)) return render(popup, opts);
  return renderWhenSelectorAppears(popup, opts, selector);
}

/** Creates the overlay container on `<body>` and renders into it. */
function render(popup: PopupModal, opts: MountOptions): MountHandle {
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

/**
 * Watches the DOM and renders as soon as `selector` matches. A one-shot check at
 * mount time is too early on stores that build markup with JS — hydration, a
 * cart drawer opening, an SPA route change. Stops at the first match, on
 * timeout, or when the caller unmounts.
 */
function renderWhenSelectorAppears(
  popup: PopupModal,
  opts: MountOptions,
  selector: string,
): MountHandle {
  let handle: MountHandle | null = null;
  let cancelled = false;
  let observer: MutationObserver;
  let timer: ReturnType<typeof setTimeout>;

  const stopWatching = () => {
    observer.disconnect();
    clearTimeout(timer);
  };

  observer = new MutationObserver(() => {
    if (cancelled || !document.querySelector(selector)) return;
    stopWatching();
    handle = render(popup, opts);
  });

  // documentElement rather than body: the embed script may run from <head>,
  // before <body> exists.
  observer.observe(document.documentElement, { childList: true, subtree: true });
  timer = setTimeout(stopWatching, SELECTOR_WAIT_MS);

  return {
    unmount() {
      cancelled = true;
      stopWatching();
      handle?.unmount();
    },
  };
}

/** True when the string is a selector `querySelector` will accept. */
function isValidSelector(selector: string): boolean {
  try {
    document.querySelector(selector);
    return true;
  } catch {
    return false;
  }
}
