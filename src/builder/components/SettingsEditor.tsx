import {
  DESIGNS,
  FREQUENCIES,
  URL_TOKEN_HINT,
  designUsesImage,
  isUrlSafeToken,
  type CallbackPayloadEntry,
  type PopupDesign,
  type PopupFrequency,
  type PopupModal,
  type PopupTrigger,
  type SubmitSuccess,
} from '@schema';

interface Props {
  popup: PopupModal;
  onChange: (patch: Partial<PopupModal>) => void;
}

const TRIGGER_TYPES: PopupTrigger['type'][] = ['immediate', 'delay', 'scroll', 'exitIntent'];
const SUCCESS_TYPES: SubmitSuccess['type'][] = ['close', 'message', 'coupon', 'redirect'];

/** Delivery + Submission — the "Settings" tab. */
export function SettingsEditor({ popup, onChange }: Props) {
  const setTrigger = (type: PopupTrigger['type']) => {
    let next: PopupTrigger;
    if (type === 'delay') next = { type, seconds: 5 };
    else if (type === 'scroll') next = { type, percent: 50 };
    else next = { type } as PopupTrigger;
    onChange({ trigger: next });
  };

  return (
    <>
      {/* --- Delivery (mount layer) --- */}
      <div className="section">
        <h3>Delivery · when &amp; how it opens</h3>

        <div className="field-grid">
          <div className="field-row">
            <label>Trigger</label>
            <select value={popup.trigger.type} onChange={(e) => setTrigger(e.target.value as PopupTrigger['type'])}>
              {TRIGGER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {popup.trigger.type === 'delay' && (
            <div className="field-row">
              <label>Delay (seconds)</label>
              <input
                type="number"
                value={popup.trigger.seconds}
                onChange={(e) => onChange({ trigger: { type: 'delay', seconds: Number(e.target.value) } })}
              />
            </div>
          )}
          {popup.trigger.type === 'scroll' && (
            <div className="field-row">
              <label>Scroll (%)</label>
              <input
                type="number"
                value={popup.trigger.percent}
                onChange={(e) => onChange({ trigger: { type: 'scroll', percent: Number(e.target.value) } })}
              />
            </div>
          )}
        </div>

        <div className="field-grid">
          <div className="field-row">
            <label>Frequency</label>
            <select
              value={popup.frequency ?? 'always'}
              onChange={(e) => onChange({ frequency: e.target.value as PopupFrequency })}
            >
              {FREQUENCIES.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div className="field-row inline" style={{ alignItems: 'center', marginTop: 22 }}>
            <input
              id="dismissible"
              type="checkbox"
              checked={popup.dismissible !== false}
              onChange={(e) => onChange({ dismissible: e.target.checked })}
            />
            <label htmlFor="dismissible" style={{ margin: 0 }}>Dismissible (X / overlay / esc)</label>
          </div>
        </div>

        <div className="field-row">
          <label>htmlId (inline mount target — leave blank for overlay)</label>
          <input
            type="text"
            value={popup.htmlId ?? ''}
            placeholder="e.g. simply-welcome-15"
            onChange={(e) => onChange({ htmlId: e.target.value || undefined })}
          />
        </div>
      </div>

      {/* --- Submission --- */}
      <div className="section">
        <h3>Submission</h3>
        <div className="field-grid">
          <div className="field-row">
            <label>Endpoint URL</label>
            <input type="url" value={popup.url} onChange={(e) => onChange({ url: e.target.value })} />
          </div>
          <div className="field-row">
            <label>Method</label>
            <select value={popup.method} onChange={(e) => onChange({ method: e.target.value as 'GET' | 'POST' })}>
              <option value="POST">POST</option>
              <option value="GET">GET</option>
            </select>
          </div>
        </div>

        <div className="field-row">
          <label>On success</label>
          <select
            value={popup.onSuccess?.type ?? 'close'}
            onChange={(e) => onChange({ onSuccess: buildSuccess(e.target.value as SubmitSuccess['type'], popup.onSuccess) })}
          >
            {SUCCESS_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <SuccessFields success={popup.onSuccess} onChange={(s) => onChange({ onSuccess: s })} />

        <div className="field-row">
          <label>On error message</label>
          <input
            type="text"
            value={popup.onError?.text ?? ''}
            placeholder="Something went wrong — please try again."
            onChange={(e) => onChange({ onError: e.target.value ? { type: 'message', text: e.target.value } : undefined })}
          />
        </div>

        <CustomSubmitValues
          entries={popup.onSubmitCallbackPayload}
          onChange={(entries) => onChange({ onSubmitCallbackPayload: entries.length ? entries : undefined })}
        />
      </div>
    </>
  );
}

/** Layout / appearance — the "Design" tab. */
export function DesignEditor({ popup, onChange }: Props) {
  return (
    <div className="section">
      <h3>Design</h3>
      <div className="field-grid">
        <div className="field-row">
          <label>Layout</label>
          <select value={popup.design} onChange={(e) => onChange({ design: e.target.value as PopupDesign })}>
            {DESIGNS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div className="field-row">
          <label>Border radius (px)</label>
          <input
            type="number"
            min={0}
            placeholder="14"
            value={popup.borderRadius ?? ''}
            onChange={(e) => onChange({ borderRadius: e.target.value === '' ? undefined : Number(e.target.value) })}
          />
        </div>
        {designUsesImage(popup.design) && (
          <div className="field-row">
            <label>Image URL</label>
            <input
              type="url"
              value={popup.imageUrl ?? ''}
              onChange={(e) => onChange({ imageUrl: e.target.value || undefined })}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function CustomSubmitValues({
  entries,
  onChange,
}: {
  entries?: CallbackPayloadEntry[];
  onChange: (entries: CallbackPayloadEntry[]) => void;
}) {
  const rows = entries ?? [];

  return (
    <div className="field-row">
      <label>Custom submit callback values</label>
      {rows.map((row, i) => {
        const badKey = Boolean(row.key) && !isUrlSafeToken(row.key);
        return (
          <div key={i} style={{ marginBottom: 6 }}>
            <div className="field-row inline">
              <input
                type="text"
                className={badKey ? 'invalid' : undefined}
                placeholder="key"
                value={row.key}
                onChange={(e) => onChange(rows.map((r, j) => (j === i ? { ...r, key: e.target.value } : r)))}
              />
              <input
                type="text"
                placeholder="value"
                value={row.value}
                onChange={(e) => onChange(rows.map((r, j) => (j === i ? { ...r, value: e.target.value } : r)))}
              />
              <button className="ghost danger" onClick={() => onChange(rows.filter((_, j) => j !== i))}>✕</button>
            </div>
            {badKey && <span className="field-error">{URL_TOKEN_HINT}</span>}
          </div>
        );
      })}
      <button className="ghost" onClick={() => onChange([...rows, { key: '', value: '' }])}>+ value</button>
    </div>
  );
}

function buildSuccess(type: SubmitSuccess['type'], prev?: SubmitSuccess): SubmitSuccess {
  switch (type) {
    case 'close':
      return { type: 'close' };
    case 'message':
      return { type: 'message', text: prev?.type === 'message' ? prev.text : 'Thanks!' };
    case 'coupon':
      return { type: 'coupon', text: prev?.type === 'coupon' ? prev.text : "Here's your code:", code: 'SAVE10', copyable: true };
    case 'redirect':
      return { type: 'redirect', url: prev?.type === 'redirect' ? prev.url : 'https://example.com/thanks' };
  }
}

function SuccessFields({ success, onChange }: { success?: SubmitSuccess; onChange: (s: SubmitSuccess) => void }) {
  if (!success || success.type === 'close') return null;

  if (success.type === 'message') {
    return (
      <div className="field-row">
        <label>Success message</label>
        <input type="text" value={success.text} onChange={(e) => onChange({ ...success, text: e.target.value })} />
      </div>
    );
  }
  if (success.type === 'redirect') {
    return (
      <div className="field-row">
        <label>Redirect URL</label>
        <input type="url" value={success.url} onChange={(e) => onChange({ ...success, url: e.target.value })} />
      </div>
    );
  }
  // coupon
  return (
    <div className="field-grid">
      <div className="field-row">
        <label>Coupon intro text</label>
        <input type="text" value={success.text ?? ''} onChange={(e) => onChange({ ...success, text: e.target.value })} />
      </div>
      <div className="field-row">
        <label>Static code</label>
        <input type="text" value={success.code ?? ''} onChange={(e) => onChange({ ...success, code: e.target.value })} />
      </div>
      <div className="field-row">
        <label>…or code from response path</label>
        <input
          type="text"
          value={success.codeFromResponsePath ?? ''}
          placeholder="data.discountCode"
          onChange={(e) => onChange({ ...success, codeFromResponsePath: e.target.value || undefined })}
        />
      </div>
    </div>
  );
}
