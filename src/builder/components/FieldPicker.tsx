import { useState, type JSX } from 'react';
import type { ContentType, CustomFieldDef, CustomFieldDraft, CustomFieldType } from '@schema';
import { useCustomFields } from '../customFields';
import { useT } from '../i18n';

interface Props {
  onAddType: (type: ContentType) => void;
  onAddField: (field: CustomFieldDef) => void;
  onClose: () => void;
}

// Layout/display pieces are always addable. Generic inputs are only shown in
// standalone mode — in integration mode the host's own fields take their place.
// `hidden` lives here so it's addable in both standalone and integration mode:
// it isn't a visible input, just a fixed value carried along with the submit.
const LAYOUT_TYPES: ContentType[] = ['heading', 'text', 'spacer', 'hidden'];
const INPUT_TYPES: ContentType[] = ['email', 'free-text-input', 'radio', 'checkbox'];
const CREATE_TYPES: CustomFieldType[] = ['text', 'email', 'radio', 'checkbox'];

/**
 * The field menu that slides in over the layout list. Selecting an item adds it
 * and closes; the "create new field" row expands into an inline form that hands
 * the draft to the host and waits (loader) for the finalized field.
 */
export function FieldPicker({ onAddType, onAddField, onClose }: Props) {
  const t = useT();
  const { fields, enabled, createField } = useCustomFields();
  const [creating, setCreating] = useState(false);

  const addType = (type: ContentType) => {
    onAddType(type);
    onClose();
  };
  const addField = (field: CustomFieldDef) => {
    onAddField(field);
    onClose();
  };

  return (
    <div className="field-menu">
      <div className="field-menu-head">
        <button className="field-back" onClick={onClose} aria-label={t.picker.back}>
          {CHEVRON}
          <span>{t.picker.back}</span>
        </button>
        <span className="field-menu-title">{t.picker.title}</span>
      </div>

      <div className="field-menu-body">
        {enabled ? (
          <PickerGroup label={t.picker.yourFields}>
            {fields.length === 0 && !creating && (
              <p className="picker-empty">{t.picker.yourFieldsEmpty}</p>
            )}
            {fields.map((f) => (
              <PickerRow
                key={f.key}
                icon={ICONS[fieldContentType(f.type)]}
                name={f.label}
                desc={f.description ?? t.picker.fieldMicrocopy}
                badge={t.enums.content[fieldContentType(f.type)]}
                onPick={() => addField(f)}
              />
            ))}

            {creating ? (
              <CreateFieldForm
                createField={createField}
                onCancel={() => setCreating(false)}
                onCreated={addField}
              />
            ) : (
              <button className="picker-create" onClick={() => setCreating(true)}>
                <span className="picker-icon dashed">{PLUS_ICON}</span>
                <span className="picker-text">
                  <span className="picker-name">{t.picker.createField}</span>
                  <span className="picker-desc">{t.picker.createHint}</span>
                </span>
              </button>
            )}
          </PickerGroup>
        ) : (
          <PickerGroup label={t.picker.inputsGroup}>
            {INPUT_TYPES.map((type) => (
              <PickerRow
                key={type}
                icon={ICONS[type]}
                name={t.enums.content[type]}
                desc={t.picker.microcopy[type]}
                onPick={() => addType(type)}
              />
            ))}
          </PickerGroup>
        )}

        <PickerGroup label={t.picker.layoutGroup}>
          {LAYOUT_TYPES.map((type) => (
            <PickerRow
              key={type}
              icon={ICONS[type]}
              name={t.enums.content[type]}
              desc={t.picker.microcopy[type]}
              onPick={() => addType(type)}
            />
          ))}
        </PickerGroup>
      </div>
    </div>
  );
}

function PickerGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="picker-group">
      <div className="picker-group-label">{label}</div>
      {children}
    </div>
  );
}

function PickerRow({
  icon,
  name,
  desc,
  badge,
  onPick,
}: {
  icon: JSX.Element;
  name: string;
  desc: string;
  badge?: string;
  onPick: () => void;
}) {
  return (
    <button className="picker-row" onClick={onPick}>
      <span className="picker-icon">{icon}</span>
      <span className="picker-text">
        <span className="picker-name">{name}</span>
        <span className="picker-desc">{desc}</span>
      </span>
      {badge && <span className="picker-badge">{badge}</span>}
    </button>
  );
}

function CreateFieldForm({
  createField,
  onCreated,
  onCancel,
}: {
  createField?: (draft: CustomFieldDraft) => Promise<CustomFieldDef>;
  onCreated: (field: CustomFieldDef) => void;
  onCancel: () => void;
}) {
  const t = useT();
  const [label, setLabel] = useState('');
  const [type, setType] = useState<CustomFieldType>('text');
  const [required, setRequired] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  const submit = async () => {
    const trimmed = label.trim();
    if (!trimmed || busy) return;
    const draft: CustomFieldDraft = { label: trimmed, type, required };
    setBusy(true);
    setError(false);
    try {
      // No host handler wired up? Fall back to a local field with a slugged key
      // so the builder still works standalone.
      const field = createField ? await createField(draft) : localField(draft);
      onCreated(field);
    } catch {
      setError(true);
      setBusy(false);
    }
  };

  return (
    <div className="picker-form">
      <label className="picker-form-label">{t.picker.formLabel}</label>
      <input
        className="picker-form-input"
        autoFocus
        value={label}
        placeholder={t.picker.formLabelPlaceholder}
        disabled={busy}
        onChange={(e) => setLabel(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
      />

      <label className="picker-form-label">{t.picker.formType}</label>
      <select
        className="picker-form-input"
        value={type}
        disabled={busy}
        onChange={(e) => setType(e.target.value as CustomFieldType)}
      >
        {CREATE_TYPES.map((ct) => (
          <option key={ct} value={ct}>
            {t.enums.content[fieldContentType(ct)]}
          </option>
        ))}
      </select>

      <label className="picker-form-check">
        <input
          type="checkbox"
          checked={required}
          disabled={busy}
          onChange={(e) => setRequired(e.target.checked)}
        />
        {t.picker.formRequired}
      </label>

      {error && <p className="picker-error">{t.picker.createError}</p>}

      <div className="picker-form-actions">
        <button className="ghost" onClick={onCancel} disabled={busy}>
          {t.picker.formCancel}
        </button>
        <button className="picker-form-submit" onClick={submit} disabled={busy || !label.trim()}>
          {busy && <span className="picker-spinner" aria-hidden="true" />}
          {busy ? t.picker.creating : t.picker.formSubmit}
        </button>
      </div>
    </div>
  );
}

/** Standalone fallback when the host wires no `onCreateField`. */
function localField(draft: CustomFieldDraft): CustomFieldDef {
  const key =
    draft.label
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'field';
  return { ...draft, key };
}

function fieldContentType(type: CustomFieldType): ContentType {
  return type === 'text' ? 'free-text-input' : type;
}

// --- Icons -----------------------------------------------------------------
// 20px line icons, sharing the stroke style of the tab-bar icons.

const svg = (children: JSX.Element) => (
  <svg
    viewBox="0 0 24 24"
    width="20"
    height="20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

const CHEVRON = (
  <svg
    className="field-back-chevron"
    viewBox="0 0 24 24"
    width="16"
    height="16"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="m15 18-6-6 6-6" />
  </svg>
);

const PLUS_ICON = svg(
  <>
    <path d="M12 5v14M5 12h14" />
  </>,
);

export const ICONS: Record<ContentType, JSX.Element> = {
  heading: svg(
    <>
      <path d="M6 4v16M18 4v16M6 12h12" />
    </>,
  ),
  text: svg(
    <>
      <path d="M4 6h16M4 12h16M4 18h10" />
    </>,
  ),
  spacer: svg(
    <>
      <path d="M4 9h16M4 15h16" />
      <path d="M12 4v3M12 17v3" />
    </>,
  ),
  email: svg(
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </>,
  ),
  radio: svg(
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
    </>,
  ),
  checkbox: svg(
    <>
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <path d="m8 12 3 3 5-6" />
    </>,
  ),
  'free-text-input': svg(
    <>
      <rect x="3" y="7" width="18" height="10" rx="2" />
      <path d="M7 12h6" />
    </>,
  ),
  // Eye-off: value sent but never shown.
  hidden: svg(
    <>
      <path d="M9.9 4.24A9.1 9.1 0 0 1 12 4c7 0 10 8 10 8a13.2 13.2 0 0 1-1.67 2.68M6.6 6.6A13.3 13.3 0 0 0 2 12s3 8 10 8a9.1 9.1 0 0 0 5.4-1.6" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
      <path d="m2 2 20 20" />
    </>,
  ),
  'submit-button': svg(
    <>
      <rect x="3" y="8" width="18" height="8" rx="4" />
    </>,
  ),
};
