import type { PopupFrequency, PopupModal } from '@schema';

// Frequency cap enforced via localStorage / sessionStorage, keyed per popup id.
const KEY_PREFIX = 'popup-seen:';

function key(id: string): string {
  return KEY_PREFIX + id;
}

/** Whether the popup is allowed to open now, given its frequency cap. */
export function canOpen(popup: PopupModal, now: number = Date.now()): boolean {
  const freq: PopupFrequency = popup.frequency ?? 'always';
  if (freq === 'always') return true;

  if (freq === 'session') {
    return !sessionStorage.getItem(key(popup.id));
  }

  const stored = localStorage.getItem(key(popup.id));
  if (!stored) return true;
  if (freq === 'ever') return false;
  if (freq === 'day') {
    const last = Number(stored);
    if (Number.isNaN(last)) return true;
    return now - last > 24 * 60 * 60 * 1000;
  }
  return true;
}

/** Record that the popup was shown, so the frequency cap applies next time. */
export function markShown(popup: PopupModal, now: number = Date.now()): void {
  const freq: PopupFrequency = popup.frequency ?? 'always';
  if (freq === 'always') return;
  if (freq === 'session') {
    sessionStorage.setItem(key(popup.id), '1');
  } else {
    localStorage.setItem(key(popup.id), String(now));
  }
}
