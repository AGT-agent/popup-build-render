import { useEffect, useRef, useState, type JSX } from 'react';
import {
  URL_TOKEN_HINT,
  isInputType,
  isUrlSafeToken,
  makeContentItem,
  makeContentItemFromField,
  type ContentItem,
  type ContentType,
  type CustomFieldDef,
  type PopupModal,
} from '@schema';
import { FieldPicker, ICONS } from './FieldPicker';
import { useT, type Strings } from '../i18n';

interface Props {
  popup: PopupModal;
  onChange: (patch: Partial<PopupModal>) => void;
  /** Reveal request from the preview: scroll to this item's card and flash it. */
  focusItem?: { id: string; nonce: number } | null;
}

export function ContentItemsEditor({ popup, onChange, focusItem }: Props) {
  const t = useT();
  const [picking, setPicking] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const items = [...popup.contentItems].sort((a, b) => a.order - b.order);

  // When the preview asks to reveal an item, leave the field picker (if open),
  // then — after the list has rendered — scroll its card in and replay a flash.
  useEffect(() => {
    if (!focusItem) return;
    setPicking(false);
    const raf = requestAnimationFrame(() => {
      const el = rootRef.current?.querySelector<HTMLElement>(
        `[data-item-id="${CSS.escape(focusItem.id)}"]`,
      );
      if (!el) return;
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.remove('field-flash');
      void el.offsetWidth; // force reflow so the animation restarts on re-click
      el.classList.add('field-flash');
    });
    return () => cancelAnimationFrame(raf);
  }, [focusItem?.nonce]);

  const commit = (next: ContentItem[]) => {
    // Submit buttons always sink to the bottom; everything else keeps its order.
    const normalized = [
      ...next.filter((it) => it.type !== 'submit-button'),
      ...next.filter((it) => it.type === 'submit-button'),
    ];
    onChange({ contentItems: normalized.map((it, i) => ({ ...it, order: i })) });
  };

  const addItem = (type: ContentType) => {
    commit([...items, makeContentItem(type, items.length)]);
  };

  const addField = (field: CustomFieldDef) => {
    commit([...items, makeContentItemFromField(field, items.length)]);
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

  // The list and the field menu occupy the same spot; toggling `picking` swaps
  // them with a slide-in animation (see .field-menu / .layout-list in the CSS).
  return (
    <div className="section layout-editor" ref={rootRef}>
      {picking ? (
        <FieldPicker
          key="menu"
          onAddType={addItem}
          onAddField={addField}
          onClose={() => setPicking(false)}
        />
      ) : (
        <div key="list" className="layout-list">
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

          <div className="add-section">
            <button className="add-plus" onClick={() => setPicking(true)}>
              {t.content.addSection}
            </button>
          </div>
        </div>
      )}
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
    <div className={`item-card${item.private ? ' private' : ''}`} data-item-id={item.id}>
      <div className="item-head">
        <span className="item-type-chip">
          <span className="item-type-icon" aria-hidden="true">{ICONS[item.type]}</span>
          {t.enums.content[item.type]}
          {item.private && <span className="item-private-icon" title={t.content.private} aria-label={t.content.private}>{EYE_OFF}</span>}
        </span>
        <div className="item-order-btns">
          {item.type !== 'submit-button' && (
            <>
              <button className="icon-btn" title="↑" disabled={index === 0} onClick={() => onMove(index, -1)} aria-label="up">{ARROW_UP}</button>
              <button className="icon-btn" title="↓" disabled={index === count - 1} onClick={() => onMove(index, 1)} aria-label="down">{ARROW_DOWN}</button>
              <button className="icon-btn danger" onClick={() => onRemove(item.id)} aria-label="remove">{TRASH}</button>
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

      {/* Colours and alignment live in the global Design tab now, so the field
          block stays focused on content. */}

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
          <div className="field-row inline">
            <input
              type="checkbox"
              id={`prv-${item.id}`}
              checked={Boolean(item.private)}
              onChange={(e) => onUpdate(item.id, { private: e.target.checked || undefined })}
            />
            <label htmlFor={`prv-${item.id}`} style={{ margin: 0 }}>{t.content.private}</label>
            <span className="field-hint">{t.content.privateHint}</span>
          </div>
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

      {item.type === 'hidden' && (
        <div className="field-row">
          <label>{t.content.submitKey}</label>
          <input
            type="text"
            className={item.onSubmitRequest?.key && !isUrlSafeToken(item.onSubmitRequest.key) ? 'invalid' : undefined}
            placeholder="key"
            value={item.onSubmitRequest?.key ?? ''}
            onChange={(e) => onUpdate(item.id, { onSubmitRequest: { key: e.target.value || undefined } })}
          />
          {item.onSubmitRequest?.key && !isUrlSafeToken(item.onSubmitRequest.key) && (
            <span className="field-error">{URL_TOKEN_HINT}</span>
          )}
        </div>
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

function labelFor(t: Strings, type: ContentType): string {
  switch (type) {
    case 'heading': return t.content.headingText;
    case 'text': return t.content.paragraphText;
    case 'submit-button': return t.content.buttonLabel;
    case 'email': return t.content.fieldLabel;
    case 'free-text-input': return t.content.fieldLabel;
    case 'checkbox': return t.content.checkboxLabel;
    case 'hidden': return t.content.hiddenValue;
    default: return t.content.valueLabel;
  }
}

// --- Icons -----------------------------------------------------------------
// 16px line icons sharing the stroke style of the picker/tab-bar icons.
const icon = (children: JSX.Element) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

const ARROW_UP = icon(<><path d="M12 19V5M5 12l7-7 7 7" /></>);
const ARROW_DOWN = icon(<><path d="M12 5v14M19 12l-7 7-7-7" /></>);
const TRASH = icon(<><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></>);
// Eye-off — marks a field that's present but hidden from the rendered popup.
const EYE_OFF = icon(
  <>
    <path d="M9.9 4.24A9.1 9.1 0 0 1 12 4c7 0 10 8 10 8a13.2 13.2 0 0 1-1.67 2.68M6.6 6.6A13.3 13.3 0 0 0 2 12s3 8 10 8a9.1 9.1 0 0 0 5.4-1.6" />
    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    <path d="m2 2 20 20" />
  </>,
);
