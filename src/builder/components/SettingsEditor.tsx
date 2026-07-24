import {
  DESIGNS,
  FREQUENCIES,
  URL_TOKEN_HINT,
  designUsesImage,
  isUrlSafeToken,
  type CallbackPayloadEntry,
  type PopupDesign,
  type PopupDirection,
  type PopupFrequency,
  type PopupModal,
  type PopupTrigger,
  type SubmitSuccess,
} from '@schema';
import { useT } from '../i18n';

interface Props {
  popup: PopupModal;
  onChange: (patch: Partial<PopupModal>) => void;
}

const TRIGGER_TYPES: PopupTrigger['type'][] = ['immediate', 'delay', 'scroll'];
const SUCCESS_TYPES: SubmitSuccess['type'][] = ['close', 'message', 'coupon', 'redirect'];

/** Delivery + Submission — the "Settings" tab. */
export function SettingsEditor({ popup, onChange }: Props) {
  const t = useT();
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
        <h3>{t.settings.deliveryHeading}</h3>

        <div className="field-grid">
          <div className="field-row">
            <label>{t.settings.trigger}</label>
            <select value={popup.trigger.type} onChange={(e) => setTrigger(e.target.value as PopupTrigger['type'])}>
              {TRIGGER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {popup.trigger.type === 'delay' && (
            <div className="field-row">
              <label>{t.settings.delaySeconds}</label>
              <input
                type="number"
                value={popup.trigger.seconds}
                onChange={(e) => onChange({ trigger: { type: 'delay', seconds: Number(e.target.value) } })}
              />
            </div>
          )}
          {popup.trigger.type === 'scroll' && (
            <div className="field-row">
              <label>{t.settings.scrollPercent}</label>
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
            <label>{t.settings.frequency}</label>
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
            <label htmlFor="dismissible" style={{ margin: 0 }}>{t.settings.dismissible}</label>
          </div>
        </div>

        <div className="field-row">
          <label>{t.settings.htmlIdLabel}</label>
          <input
            type="text"
            value={popup.htmlId ?? ''}
            placeholder={t.settings.htmlIdPlaceholder}
            onChange={(e) => onChange({ htmlId: e.target.value || undefined })}
          />
        </div>
      </div>

      {/* --- Submission --- */}
      <div className="section">
        <h3>{t.settings.submissionHeading}</h3>
        <div className="field-grid">
          <div className="field-row">
            <label>{t.settings.endpointUrl}</label>
            <input type="url" value={popup.url} onChange={(e) => onChange({ url: e.target.value })} />
          </div>
          <div className="field-row">
            <label>{t.settings.method}</label>
            <select value={popup.method} onChange={(e) => onChange({ method: e.target.value as 'GET' | 'POST' })}>
              <option value="POST">POST</option>
              <option value="GET">GET</option>
            </select>
          </div>
        </div>

        <div className="field-row">
          <label>{t.settings.onSuccess}</label>
          <select
            value={popup.onSuccess?.type ?? 'close'}
            onChange={(e) => onChange({ onSuccess: buildSuccess(e.target.value as SubmitSuccess['type'], popup.onSuccess) })}
          >
            {SUCCESS_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <SuccessFields success={popup.onSuccess} onChange={(s) => onChange({ onSuccess: s })} />

        <div className="field-row">
          <label>{t.settings.onErrorMessage}</label>
          <input
            type="text"
            value={popup.onError?.text ?? ''}
            placeholder={t.settings.onErrorPlaceholder}
            onChange={(e) => onChange({ onError: e.target.value ? { type: 'message', text: e.target.value } : undefined })}
          />
        </div>

        {/* Custom submit callback values are hidden from the builder for now —
            the data model and <CustomSubmitValues> component are kept intact so
            this can be re-introduced later. */}
      </div>
    </>
  );
}

/** Layout / appearance — the "Design" tab. */
export function DesignEditor({ popup, onChange }: Props) {
  const t = useT();
  return (
    <div className="section">
      <h3>{t.settings.designHeading}</h3>
      <div className="field-grid">
        <div className="field-row">
          <label>{t.settings.layout}</label>
          <select value={popup.design} onChange={(e) => onChange({ design: e.target.value as PopupDesign })}>
            {DESIGNS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div className="field-row">
          {/* Sets the popup's own text direction (renderer only) — English is
              left-to-right, Hebrew right-to-left. Separate from the builder UI language. */}
          <label>{t.settings.language}</label>
          <select
            value={popup.direction ?? 'ltr'}
            onChange={(e) => onChange({ direction: e.target.value as PopupDirection })}
          >
            <option value="ltr">{t.settings.langEnglish}</option>
            <option value="rtl">{t.settings.langHebrew}</option>
          </select>
        </div>
        <div className="field-row">
          <label>{t.settings.borderRadius}</label>
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
            <label>{t.settings.imageUrl}</label>
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

// Currently hidden from the builder UI (see ContactEditor) but kept for
// re-introduction later. Exported so it stays referenced under noUnusedLocals.
export function CustomSubmitValues({
  entries,
  onChange,
}: {
  entries?: CallbackPayloadEntry[];
  onChange: (entries: CallbackPayloadEntry[]) => void;
}) {
  const t = useT();
  const rows = entries ?? [];

  return (
    <div className="field-row">
      <label>{t.settings.customSubmitValues}</label>
      {rows.map((row, i) => {
        const badKey = Boolean(row.key) && !isUrlSafeToken(row.key);
        return (
          <div key={i} style={{ marginBottom: 6 }}>
            <div className="field-row inline">
              <input
                type="text"
                className={badKey ? 'invalid' : undefined}
                placeholder={t.settings.keyPlaceholder}
                value={row.key}
                onChange={(e) => onChange(rows.map((r, j) => (j === i ? { ...r, key: e.target.value } : r)))}
              />
              <input
                type="text"
                placeholder={t.settings.valuePlaceholder}
                value={row.value}
                onChange={(e) => onChange(rows.map((r, j) => (j === i ? { ...r, value: e.target.value } : r)))}
              />
              <button className="ghost danger" onClick={() => onChange(rows.filter((_, j) => j !== i))}>✕</button>
            </div>
            {badKey && <span className="field-error">{URL_TOKEN_HINT}</span>}
          </div>
        );
      })}
      <button className="ghost" onClick={() => onChange([...rows, { key: '', value: '' }])}>{t.settings.addValue}</button>
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
  const t = useT();
  if (!success || success.type === 'close') return null;

  if (success.type === 'message') {
    return (
      <div className="field-row">
        <label>{t.settings.successMessage}</label>
        <input type="text" value={success.text} onChange={(e) => onChange({ ...success, text: e.target.value })} />
      </div>
    );
  }
  if (success.type === 'redirect') {
    return (
      <div className="field-row">
        <label>{t.settings.redirectUrl}</label>
        <input type="url" value={success.url} onChange={(e) => onChange({ ...success, url: e.target.value })} />
      </div>
    );
  }
  // coupon
  return (
    <div className="field-grid">
      <div className="field-row">
        <label>{t.settings.couponIntro}</label>
        <input type="text" value={success.text ?? ''} onChange={(e) => onChange({ ...success, text: e.target.value })} />
      </div>
      <div className="field-row">
        <label>{t.settings.staticCode}</label>
        <input type="text" value={success.code ?? ''} onChange={(e) => onChange({ ...success, code: e.target.value })} />
      </div>
      <div className="field-row">
        <label>{t.settings.codeFromResponse}</label>
        <input
          type="text"
          value={success.codeFromResponsePath ?? ''}
          placeholder={t.settings.codeFromResponsePlaceholder}
          onChange={(e) => onChange({ ...success, codeFromResponsePath: e.target.value || undefined })}
        />
      </div>
    </div>
  );
}
