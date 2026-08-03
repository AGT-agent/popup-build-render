import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { CustomFieldDef, CustomFieldDraft } from '@schema';

/**
 * Host integration for custom fields. `fields` is the list the host seeded via
 * config; `createField` is called when an author creates one — the host
 * persists it and resolves with the finalized def (real `key`). `enabled` marks
 * "integration mode": the builder shows the author's fields instead of our
 * generic input types, since the host brings the real inputs.
 */
export interface CustomFieldsApi {
  fields: CustomFieldDef[];
  enabled: boolean;
  createField?: (draft: CustomFieldDraft) => Promise<CustomFieldDef>;
}

const CustomFieldsContext = createContext<CustomFieldsApi>({ fields: [], enabled: false });

export function CustomFieldsProvider({
  fields,
  createField,
  children,
}: {
  fields?: CustomFieldDef[];
  createField?: (draft: CustomFieldDraft) => Promise<CustomFieldDef>;
  children: ReactNode;
}) {
  const list = fields ?? [];
  // A host that passes either config fields or a create handler is in
  // integration mode. Memoized on the inputs so consumers don't re-render
  // unless the host actually changes them.
  const value = useMemo<CustomFieldsApi>(
    () => ({ fields: list, enabled: list.length > 0 || Boolean(createField), createField }),
    [list, createField],
  );
  return <CustomFieldsContext.Provider value={value}>{children}</CustomFieldsContext.Provider>;
}

export function useCustomFields(): CustomFieldsApi {
  return useContext(CustomFieldsContext);
}
