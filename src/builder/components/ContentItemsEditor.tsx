import { useState } from 'react';
import {
  CONTENT_TYPES,
  URL_TOKEN_HINT,
  isInputType,
  isUrlSafeToken,
  makeContentItem,
  type ContentItem,
  type ContentType,
  type PopupModal,
} from '@schema';
import { useT, type Strings } from '../i18n';

interface Props {
  popup: PopupModal;
  onChange: (patch: Partial<PopupModal>) => void;
}

export function ContentItemsEditor({ popup, onChange }: Props) {
  const t = useT();
  const items = [...popup.contentItems].sort((a, b) => a.order - b.order);

  const commit = (next: ContentItem[]) => {
    // Submit buttons always sink to the bottom; everything else keeps its order.
    const normalized = [
      ...next.filter((it) => it.type !== 'submit-button'),
      ...next.filter((it) => it.type === 'submit-button'),
    ];
    onChange({ contentItems: normalized.map((it, i) => ({ ...it, order: i })) });
  };

  const addItem = (type: ContentType) => {
    commit([...items, makeContentItem(type, items.length, t.defaults)]);
  };

  const updateItem = (id: string, patch: Partial<ContentItem>) => {
    commit(items.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  };

  const removeItem = (id: string) => commit(items.filter((it) => it.id !== id));

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    commit(next);
  };

  return (
    <div className="section">
      <h3>{t.content.heading}</h3>

      {items.map((item, i) => (
        <ItemCard
          key={item.id}
          item={item}
          index={i}
          count={items.length}
          onMove={move}
          onRemove={removeItem}
          onUpdate={updateItem}
        />
      ))}

      <AddSectionButton onAdd={addItem} />
    </div>
  );
}

function AddSectionButton({ onAdd }: { onAdd: (type: ContentType) => void }) {
  const t = useT();
  const [open, setOpen] = useState(false);

  return (
    <div className="add-section">
      {open && <div className="add-backdrop" onClick={() => setOpen(false)} />}
      {open && (
        <div className="add-menu-popover">
          {/* Submit button is mandatory and always present — not addable. */}
          {CONTENT_TYPES.filter((ct) => ct !== 'submit-button').map((ct) => (
            <button
              key={ct}
              onClick={() => {
                onAdd(ct);
                setOpen(false);
              }}
            >
              {t.enums.contentType[ct]}
            </button>
          ))}
        </div>
      )}
      <button className="add-plus" aria-label={t.content.addSectionAria} onClick={() => setOpen((o) => !o)}>
        {t.content.addSection}
      </button>
    </div>
  );
}

interface ItemCardProps {
  item: ContentItem;
  index: number;
  count: number;
  onMove: (index: number, dir: -1 | 1) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, patch: Partial<ContentItem>) => void;
}

function ItemCard({ item, index, count, onMove, onRemove, onUpdate }: ItemCardProps) {
  const t = useT();
  const input = isInputType(item.type);

  return (
    <div className="item-card">
      <div className="item-head">
        {/* Same vocabulary as the add-section menu — both must speak one language. */}
        <span className="item-type">{t.enums.contentType[item.type]}</span>
        <div className="item-order-btns">
          {item.type !== 'submit-button' && (
            <>
              <button className="ghost" disabled={index === 0} onClick={() => onMove(index, -1)}>↑</button>
              <button className="ghost" disabled={index === count - 1} onClick={() => onMove(index, 1)}>↓</button>
              <button className="ghost danger" onClick={() => onRemove(item.id)}>✕</button>
            </>
          )}
        </div>
      </div>

      {item.type === 'spacer' && (
        <div className="field-row">
          <label>{t.content.heightPx}</label>
          <input
            type="number"
            min={0}
            value={item.height ?? 16}
            onChange={(e) => onUpdate(item.id, { height: e.target.value === '' ? undefined : Math.max(0, Number(e.target.value)) })}
          />
        </div>
      )}
      {item.type !== 'radio' && item.type !== 'spacer' && (
        <div className="field-row">
          <label>{labelFor(t, item.type)}</label>
          <input type="text" value={item.value ?? ''} onChange={(e) => onUpdate(item.id, { value: e.target.value })} />
        </div>
      )}
      {(item.type === 'email' || item.type === 'free-text-input') && (
        <div className="field-row">
          <label>{t.content.placeholder}</label>
          <input
            type="text"
            placeholder={item.value}
            value={item.placeholder ?? ''}
            onChange={(e) => onUpdate(item.id, { placeholder: e.target.value || undefined })}
          />
        </div>
      )}
      {item.type === 'radio' && (
        <div className="field-row">
          <label>{t.content.groupLabel}</label>
          <input type="text" value={item.value ?? ''} onChange={(e) => onUpdate(item.id, { value: e.target.value })} />
        </div>
      )}

      {/* Align applies to every text-bearing section; color/background stay
          scoped to the types that actually render them. Spacer has no text, and
          the submit button is a full-width block — aligning its label reads as
          a no-op next to the button's own centering. */}
      {item.type !== 'spacer' && (
        <div className="field-grid">
          {item.type !== 'submit-button' && (
            <div className="field-row">
              <label>{t.content.align}</label>
              <select
                value={item.styleProps?.align ?? 'center'}
                onChange={(e) => onUpdate(item.id, { styleProps: { ...item.styleProps, align: e.target.value as 'left' | 'center' | 'right' } })}
              >
                <option value="left">{t.enums.align.left}</option>
                <option value="center">{t.enums.align.center}</option>
                <option value="right">{t.enums.align.right}</option>
              </select>
            </div>
          )}
          {(item.type === 'heading' || item.type === 'text' || item.type === 'submit-button') && (
            <ColorField
              label={t.content.color}
              value={item.styleProps?.color}
              fallback={item.type === 'submit-button' ? '#ffffff' : '#111827'}
              onChange={(color) => onUpdate(item.id, { styleProps: { ...item.styleProps, color } })}
            />
          )}
          {item.type === 'submit-button' && (
            <ColorField
              label={t.content.backgroundColor}
              value={item.styleProps?.backgroundColor}
              fallback="#111827"
              onChange={(backgroundColor) => onUpdate(item.id, { styleProps: { ...item.styleProps, backgroundColor } })}
            />
          )}
        </div>
      )}

      {item.type === 'radio' && <RadioOptions item={item} onUpdate={onUpdate} />}

      {input && (
        <>
          <div className="field-row inline">
            <input
              type="checkbox"
              id={`req-${item.id}`}
              checked={Boolean(item.required)}
              onChange={(e) => onUpdate(item.id, { required: e.target.checked })}
            />
            <label htmlFor={`req-${item.id}`} style={{ margin: 0 }}>{t.content.required}</label>
          </div>
          {/* Where the value is sent is decided by the popup's method, not
              per-item — the only thing left to author here is the key. */}
          <div className="field-row">
            <label>{t.content.submitKey}</label>
            <input
              type="text"
              className={item.onSubmitRequest?.key && !isUrlSafeToken(item.onSubmitRequest.key) ? 'invalid' : undefined}
              placeholder={item.type === 'email' ? 'email' : 'key'}
              value={item.onSubmitRequest?.key ?? ''}
              onChange={(e) => onUpdate(item.id, { onSubmitRequest: { key: e.target.value || undefined } })}
            />
            {item.onSubmitRequest?.key && !isUrlSafeToken(item.onSubmitRequest.key) && (
              <span className="field-error">{URL_TOKEN_HINT}</span>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function RadioOptions({ item, onUpdate }: { item: ContentItem; onUpdate: ItemCardProps['onUpdate'] }) {
  const t = useT();
  const options = item.options ?? [];
  const set = (opts: typeof options) => onUpdate(item.id, { options: opts });

  return (
    <div className="field-row">
      <label>{t.content.options}</label>
      {options.map((opt, i) => {
        const badValue = Boolean(opt.value) && !isUrlSafeToken(opt.value);
        return (
          <div key={i} style={{ marginBottom: 6 }}>
            <div className="field-row inline">
              <input
                type="text"
                placeholder={t.content.optionLabel}
                value={opt.label}
                onChange={(e) => set(options.map((o, j) => (j === i ? { ...o, label: e.target.value } : o)))}
              />
              <input
                type="text"
                className={badValue ? 'invalid' : undefined}
                placeholder={t.content.optionValue}
                value={opt.value}
                onChange={(e) => set(options.map((o, j) => (j === i ? { ...o, value: e.target.value } : o)))}
              />
              <button className="ghost danger" onClick={() => set(options.filter((_, j) => j !== i))}>✕</button>
            </div>
            {badValue && <span className="field-error">{URL_TOKEN_HINT}</span>}
          </div>
        );
      })}
      <button className="ghost" onClick={() => set([...options, { label: `Option ${options.length + 1}`, value: `opt${options.length + 1}` }])}>
        {t.content.addOption}
      </button>
    </div>
  );
}

/** `#abc` → `#aabbcc`; anything the native picker can't take returns undefined. */
function toPickerHex(value?: string): string | undefined {
  if (!value) return undefined;
  const v = value.trim();
  if (/^#[0-9a-f]{6}$/i.test(v)) return v.toLowerCase();
  if (/^#[0-9a-f]{3}$/i.test(v)) return `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}`.toLowerCase();
  return undefined;
}

/**
 * Swatch + text pair. The text box stays authoritative so named colors
 * (`red`) and `rgb()` values survive — the picker only ever writes `#rrggbb`,
 * and shows `fallback` (the renderer's default) while the field is empty.
 * Clearing the text drops the key so the popup falls back to its own styling.
 */
function ColorField({
  label,
  value,
  fallback,
  onChange,
}: {
  label: string;
  value?: string;
  fallback: string;
  onChange: (color: string | undefined) => void;
}) {
  return (
    <div className="field-row">
      <label>{label}</label>
      <div className="color-field">
        <input
          type="color"
          aria-label={label}
          value={toPickerHex(value) ?? fallback}
          onChange={(e) => onChange(e.target.value)}
        />
        <input
          type="text"
          placeholder={fallback}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value || undefined)}
        />
      </div>
    </div>
  );
}

function labelFor(t: Strings, type: ContentType): string {
  switch (type) {
    case 'heading': return t.content.headingText;
    case 'text': return t.content.paragraphText;
    case 'submit-button': return t.content.buttonLabel;
    case 'email': return t.content.fieldLabel;
    case 'free-text-input': return t.content.fieldLabel;
    case 'checkbox': return t.content.checkboxLabel;
    default: return t.content.valueLabel;
  }
}
