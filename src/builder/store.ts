import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  makeExamplePopup,
  makePopup,
  type DefaultText,
  type PopupDirection,
  type PopupModal,
} from '@schema';

export interface BuilderState {
  /** The saved popups — the array you pull out to send as JSON to the renderer. */
  popups: PopupModal[];
  /** Id of the popup currently open in the editor. */
  selectedId: string | null;
  /** Ids of the popups marked "Active" — the ones a host app pulls out to render. */
  activeIds: string[];
  /**
   * When true, only one popup may be Active at a time and the handoff exports a
   * single JSON object; when false, any number may be Active and the handoff
   * exports an array.
   */
  singleMode: boolean;

  select: (id: string | null) => void;
  /** Flip a popup's Active mark. In single mode, activating one deactivates the rest. */
  toggleActive: (id: string) => void;
  /** Clear every Active mark. */
  clearActive: () => void;
  /** Toggle single-vs-array export. Turning it on trims Active down to one. */
  setSingleMode: (on: boolean) => void;
  /**
   * Create a template. `text` seeds the starter copy in the author's language
   * and `direction` its text direction; omitted (or for the example template,
   * which is a fixed worked example) both fall back to the schema's defaults.
   */
  createPopup: (fromExample?: boolean, text?: DefaultText, direction?: PopupDirection) => string;
  updatePopup: (id: string, patch: Partial<PopupModal>) => void;
  /** Replace a popup wholesale (used by the raw-JSON editor and full-object edits). */
  replacePopup: (id: string, next: PopupModal) => void;
  duplicatePopup: (id: string) => string | null;
  removePopup: (id: string) => void;
  importPopups: (incoming: PopupModal[]) => void;
}

export const useBuilderStore = create<BuilderState>()(
  persist(
    (set, get) => ({
      popups: [],
      selectedId: null,
      activeIds: [],
      singleMode: false,

      select: (id) => set({ selectedId: id }),

      toggleActive: (id) =>
        set((s) => {
          if (s.activeIds.includes(id)) {
            return { activeIds: s.activeIds.filter((x) => x !== id) };
          }
          return { activeIds: s.singleMode ? [id] : [...s.activeIds, id] };
        }),

      clearActive: () => set({ activeIds: [] }),

      setSingleMode: (on) =>
        set((s) => ({
          singleMode: on,
          // Collapsing to single mode keeps only the first-marked popup active.
          activeIds: on ? s.activeIds.slice(0, 1) : s.activeIds,
        })),

      createPopup: (fromExample = false, text, direction) => {
        const popup = fromExample ? makeExamplePopup() : makePopup(undefined, text, direction);
        set((s) => ({ popups: [...s.popups, popup], selectedId: popup.id }));
        return popup.id;
      },

      updatePopup: (id, patch) =>
        set((s) => ({
          popups: s.popups.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),

      replacePopup: (id, next) =>
        set((s) => ({ popups: s.popups.map((p) => (p.id === id ? next : p)) })),

      duplicatePopup: (id) => {
        const src = get().popups.find((p) => p.id === id);
        if (!src) return null;
        const copy: PopupModal = {
          ...structuredClone(src),
          id: `${src.id}-copy-${Math.floor(performance.now())}`,
          name: `${src.name} (copy)`,
        };
        set((s) => ({ popups: [...s.popups, copy], selectedId: copy.id }));
        return copy.id;
      },

      removePopup: (id) =>
        set((s) => ({
          popups: s.popups.filter((p) => p.id !== id),
          selectedId: s.selectedId === id ? null : s.selectedId,
          activeIds: s.activeIds.filter((x) => x !== id),
        })),

      importPopups: (incoming) =>
        set((s) => {
          const byId = new Map(s.popups.map((p) => [p.id, p]));
          for (const p of incoming) byId.set(p.id, dropLegacyTarget(p));
          return { popups: Array.from(byId.values()) };
        }),
    }),
    {
      name: 'popup-builder-store',
      version: 1,
      // v1 retired the per-item `onSubmitRequest.target` — the popup's `method`
      // now decides where values are sent. Strip the dead key so it stops
      // showing up in exported JSON.
      migrate: (state) => {
        const s = state as BuilderState;
        return { ...s, popups: (s.popups ?? []).map(dropLegacyTarget) };
      },
    },
  ),
);

/** Remove the pre-v1 `onSubmitRequest.target` key from a stored popup. */
function dropLegacyTarget(popup: PopupModal): PopupModal {
  let changed = false;
  const contentItems = popup.contentItems?.map((item) => {
    const req = item.onSubmitRequest as (typeof item.onSubmitRequest & { target?: unknown }) | undefined;
    if (!req || !('target' in req)) return item;
    changed = true;
    const { target: _target, ...rest } = req;
    return { ...item, onSubmitRequest: rest };
  });
  return changed ? { ...popup, contentItems: contentItems! } : popup;
}

/** Convenience selector: the current array of popup JSONs. */
export function getAllPopups(): PopupModal[] {
  return useBuilderStore.getState().popups;
}

/** Selector for every Active popup, in list order — the multi-template handoff. */
export function selectActivePopups(s: BuilderState): PopupModal[] {
  return s.popups.filter((p) => s.activeIds.includes(p.id));
}

/** Selector for the single Active popup (the first, in single mode the only one). */
export function selectActivePopup(s: BuilderState): PopupModal | null {
  return selectActivePopups(s)[0] ?? null;
}

/** Every popup marked Active in the saving view — the array handoff. */
export function getActivePopups(): PopupModal[] {
  return selectActivePopups(useBuilderStore.getState());
}

/** The single Active popup, or null if none is — the single-JSON handoff. */
export function getActivePopup(): PopupModal | null {
  return selectActivePopup(useBuilderStore.getState());
}

/** True when two popup lists hold the same objects in the same order. */
function sameList(a: PopupModal[], b: PopupModal[]): boolean {
  return a.length === b.length && a.every((p, i) => p === b[i]);
}

/**
 * Watch the full set of Active popups — fires when the marks change, when any
 * Active popup is edited, and when they're cleared or deleted. For non-React
 * hosts; inside React, pass `onActiveChange` to <PopupBuilder /> instead.
 * Returns an unsubscribe function.
 */
export function subscribeActivePopups(
  listener: (popups: PopupModal[]) => void,
): () => void {
  let prev = getActivePopups();
  return useBuilderStore.subscribe((state) => {
    const next = selectActivePopups(state);
    if (sameList(prev, next)) return;
    prev = next;
    listener(next);
  });
}

/**
 * Watch the single Active popup — fires when a different template is marked,
 * when it's edited, and when it's cleared or deleted. For non-React hosts;
 * inside React, pass `onActiveChange` to <PopupBuilder /> instead.
 * Returns an unsubscribe function.
 */
export function subscribeActivePopup(
  listener: (popup: PopupModal | null) => void,
): () => void {
  let prev = getActivePopup();
  return useBuilderStore.subscribe((state) => {
    const next = selectActivePopup(state);
    if (next === prev) return;
    prev = next;
    listener(next);
  });
}
