import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { makeExamplePopup, makePopup, type PopupModal } from '@schema';

export interface BuilderState {
  /** The saved popups — the array you pull out to send as JSON to the renderer. */
  popups: PopupModal[];
  /** Id of the popup currently open in the editor. */
  selectedId: string | null;
  /** Id of the popup marked "in use" — the one a host app pulls out to render. */
  activeId: string | null;

  select: (id: string | null) => void;
  /** Mark a popup as the one in use; pass null to clear. */
  setActive: (id: string | null) => void;
  createPopup: (fromExample?: boolean) => string;
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
      activeId: null,

      select: (id) => set({ selectedId: id }),

      setActive: (id) => set({ activeId: id }),

      createPopup: (fromExample = false) => {
        const popup = fromExample ? makeExamplePopup() : makePopup();
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
          activeId: s.activeId === id ? null : s.activeId,
        })),

      importPopups: (incoming) =>
        set((s) => {
          const byId = new Map(s.popups.map((p) => [p.id, p]));
          for (const p of incoming) byId.set(p.id, p);
          return { popups: Array.from(byId.values()) };
        }),
    }),
    { name: 'popup-builder-store' },
  ),
);

/** Convenience selector: the current array of popup JSONs. */
export function getAllPopups(): PopupModal[] {
  return useBuilderStore.getState().popups;
}

/** Selector for the in-use popup — shared by the hook, getter, and subscription. */
export function selectActivePopup(s: BuilderState): PopupModal | null {
  return s.popups.find((p) => p.id === s.activeId) ?? null;
}

/** The popup marked "in use" in the saving view, or null if none is. */
export function getActivePopup(): PopupModal | null {
  return selectActivePopup(useBuilderStore.getState());
}

/**
 * Watch the in-use popup — fires when a different template is marked in use,
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
