import {
  CONTENT_TYPES,
  isInputType,
  makeContentItem,
  type ContentItem,
  type ContentType,
  type PopupModal,
  type RequestTarget,
} from '@schema';

interface Props {
  popup: PopupModal;
  onChange: (patch: Partial<PopupModal>) => void;
}

export function ContentItemsEditor({ popup, onChange }: Props) {
  const items = [...popup.contentItems].sort((a, b) => a.order - b.order);

  const commit = (next: ContentItem[]) => {
    onChange({ contentItems: next.map((it, i) => ({ ...it, order: i })) });
  };

  const addItem = (type: ContentType) => {
    commit([...items, makeContentItem(type, items.length)]);
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
      <h3>Content items</h3>

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

      <div className="add-menu">
        {CONTENT_TYPES.map((t) => (
          <button key={t} onClick={() => addItem(t)}>+ {t}</button>
        ))}
      </div>
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
  const input = isInputType(item.type);

  return (
    <div className="item-card">
      <div className="item-head">
        <span className="item-type">{item.type}</span>
        <div className="item-order-btns">
          <button className="ghost" disabled={index === 0} onClick={() => onMove(index, -1)}>↑</button>
          <button className="ghost" disabled={index === count - 1} onClick={() => onMove(index, 1)}>↓</button>
          <button className="ghost danger" onClick={() => onRemove(item.id)}>✕</button>
        </div>
      </div>

      {item.type !== 'radio' && (
        <div className="field-row">
          <label>{labelFor(item.type)}</label>
          <input type="text" value={item.value ?? ''} onChange={(e) => onUpdate(item.id, { value: e.target.value })} />
        </div>
      )}
      {item.type === 'radio' && (
        <div className="field-row">
          <label>Group label</label>
          <input type="text" value={item.value ?? ''} onChange={(e) => onUpdate(item.id, { value: e.target.value })} />
        </div>
      )}

      {(item.type === 'heading' || item.type === 'text' || item.type === 'submit-button') && (
        <div className="field-grid">
          <div className="field-row">
            <label>Align</label>
            <select
              value={item.styleProps?.align ?? 'center'}
              onChange={(e) => onUpdate(item.id, { styleProps: { ...item.styleProps, align: e.target.value as 'left' | 'center' | 'right' } })}
            >
              <option value="left">left</option>
              <option value="center">center</option>
              <option value="right">right</option>
            </select>
          </div>
          <div className="field-row">
            <label>Color</label>
            <input
              type="text"
              placeholder="#111827"
              value={item.styleProps?.color ?? ''}
              onChange={(e) => onUpdate(item.id, { styleProps: { ...item.styleProps, color: e.target.value || undefined } })}
            />
          </div>
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
            <label htmlFor={`req-${item.id}`} style={{ margin: 0 }}>Required</label>
          </div>
          <div className="field-grid">
            <div className="field-row">
              <label>Submit target</label>
              <select
                value={item.onSubmitRequest?.target ?? 'body'}
                onChange={(e) => onUpdate(item.id, { onSubmitRequest: { ...item.onSubmitRequest, target: e.target.value as RequestTarget } })}
              >
                <option value="body">body</option>
                <option value="header">header</option>
              </select>
            </div>
            <div className="field-row">
              <label>Submit key</label>
              <input
                type="text"
                placeholder={item.type === 'email' ? 'email' : 'key'}
                value={item.onSubmitRequest?.key ?? ''}
                onChange={(e) => onUpdate(item.id, { onSubmitRequest: { target: item.onSubmitRequest?.target ?? 'body', key: e.target.value || undefined } })}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function RadioOptions({ item, onUpdate }: { item: ContentItem; onUpdate: ItemCardProps['onUpdate'] }) {
  const options = item.options ?? [];
  const set = (opts: typeof options) => onUpdate(item.id, { options: opts });

  return (
    <div className="field-row">
      <label>Options</label>
      {options.map((opt, i) => (
        <div key={i} className="field-row inline" style={{ marginBottom: 6 }}>
          <input
            type="text"
            placeholder="label"
            value={opt.label}
            onChange={(e) => set(options.map((o, j) => (j === i ? { ...o, label: e.target.value } : o)))}
          />
          <input
            type="text"
            placeholder="value"
            value={opt.value}
            onChange={(e) => set(options.map((o, j) => (j === i ? { ...o, value: e.target.value } : o)))}
          />
          <button className="ghost danger" onClick={() => set(options.filter((_, j) => j !== i))}>✕</button>
        </div>
      ))}
      <button className="ghost" onClick={() => set([...options, { label: `Option ${options.length + 1}`, value: `opt${options.length + 1}` }])}>
        + option
      </button>
    </div>
  );
}

function labelFor(type: ContentType): string {
  switch (type) {
    case 'heading': return 'Heading text';
    case 'text': return 'Paragraph text';
    case 'submit-button': return 'Button label';
    case 'email': return 'Label / placeholder';
    case 'free-text-input': return 'Label / placeholder';
    case 'checkbox': return 'Checkbox label';
    default: return 'Value';
  }
}
