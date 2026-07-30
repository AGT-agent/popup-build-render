import { useState } from 'react';
import {
  DESIGNS,
  FREQUENCIES,
  SUCCESS_ILLUSTRATIONS,
  SUCCESS_TEMPLATES,
  SUCCESS_TYPES,
  URL_TOKEN_HINT,
  designUsesImage,
  isUrlSafeToken,
  normalizeSuccess,
  popupTagSelector,
  popupTagSnippet,
  popupTagValue,
  readPopupTag,
  withPopupTag,
  type CallbackPayloadEntry,
  type PopupDesign,
  type PopupDirection,
  type PopupFrequency,
  type PopupModal,
  type PopupTrigger,
  type SubmitSuccess,
  type SuccessIllustration,
  type SuccessMessage,
  type SuccessTemplate,
  type SuccessType,
} from '@schema';
import { useT } from '../i18n';

interface Props {
  popup: PopupModal;
  onChange: (patch: Partial<PopupModal>) => void;
}

const TRIGGER_TYPES: PopupTrigger['type'][] = ['immediate', 'delay', 'scroll'];

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
              {TRIGGER_TYPES.map((tt) => <option key={tt} value={tt}>{t.enums.trigger[tt]}</option>)}
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
              {FREQUENCIES.map((f) => <option key={f} value={f}>{t.enums.frequency[f]}</option>)}
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

        <SelectorField popup={popup} onChange={onChange} />
      </div>

      {/* --- Submission --- */}
      <div className="section">
        <h3>{t.settings.submissionHeading}</h3>
        <div className="field-row">
          <label>{t.settings.endpointUrl}</label>
          {/* Textarea so long endpoints wrap and stay readable — newlines are
              stripped since the value is still a single URL. */}
          <textarea
            rows={2}
            value={popup.url}
            onChange={(e) => onChange({ url: e.target.value.replace(/\n/g, '') })}
          />
        </div>
        <div className="field-grid">
          <div className="field-row">
            <label>{t.settings.method}</label>
            <select value={popup.method} onChange={(e) => onChange({ method: e.target.value as 'GET' | 'POST' })}>
              <option value="POST">POST</option>
              <option value="GET">GET</option>
            </select>
            {/* The method alone decides where submitted values land — there is
                no per-section query/body choice, so spell it out here. */}
            <span className="field-hint">
              {popup.method === 'GET' ? t.settings.methodHintGet : t.settings.methodHintPost}
            </span>
          </div>
        </div>

        <SuccessSection popup={popup} onChange={onChange} />

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

/**
 * The `selector` page gate, plus a one-click escape hatch for merchants who
 * don't write CSS: "Generate tag" drops a `[data-popup="…"]` selector derived
 * from the popup name into the field and shows the element to paste onto each
 * page it should show on.
 */
function SelectorField({ popup, onChange }: Props) {
  const t = useT();
  const [copied, setCopied] = useState(false);

  // Read the tag back out of the stored selector rather than re-deriving it
  // from the name: renaming a popup must not silently invalidate markup the
  // merchant already pasted. Pressing the button again is the explicit re-sync.
  const activeTag = readPopupTag(popup.selector);
  const snippet = activeTag ? popupTagSnippet(activeTag) : '';

  const generate = () => {
    const tag = popupTagSelector(popupTagValue(popup.name, popup.id));
    onChange({ selector: withPopupTag(popup.selector, tag) });
  };

  const copy = () => {
    navigator.clipboard?.writeText(snippet).catch(() => undefined);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className="field-row">
      <label>{t.settings.selectorLabel}</label>
      <div className="selector-field">
        <input
          type="text"
          value={popup.selector ?? ''}
          placeholder={t.settings.selectorPlaceholder}
          onChange={(e) => onChange({ selector: e.target.value || undefined })}
        />
        <button className="ghost" title={t.settings.generateTagTitle} onClick={generate}>
          {t.settings.generateTag}
        </button>
      </div>
      {activeTag && (
        <div className="field-hint tag-hint">
          <span>{t.settings.tagHint}</span>
          {/* Markup reads left-to-right even when the builder chrome is RTL. */}
          <code dir="ltr">{snippet}</code>
          <button className="ghost" onClick={copy}>{copied ? t.json.copied : t.json.copy}</button>
        </div>
      )}
    </div>
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
            {DESIGNS.map((d) => <option key={d} value={d}>{t.enums.design[d]}</option>)}
          </select>
        </div>
        <div className="field-row">
          {/* Sets the popup's own text direction (renderer only). Separate from
              the builder UI language. */}
          <label>{t.settings.direction}</label>
          <select
            value={popup.direction ?? 'ltr'}
            onChange={(e) => onChange({ direction: e.target.value as PopupDirection })}
          >
            <option value="ltr">{t.settings.dirLtr}</option>
            <option value="rtl">{t.settings.dirRtl}</option>
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

/**
 * "On success", plus — when it's a message — the template picker that decides
 * which pre-designed success screen the shopper lands on. The coupon lives in
 * there rather than in the top-level dropdown: it is one of the message
 * layouts, not a different kind of outcome.
 */
function SuccessSection({ popup, onChange }: Props) {
  const t = useT();
  // Read through the normalizer so a popup still carrying the legacy
  // `{ type: 'coupon' }` opens on the coupon template instead of falling back
  // to "close" and silently losing its code.
  const success = normalizeSuccess(popup.onSuccess);
  const set = (s: SubmitSuccess) => onChange({ onSuccess: s });

  return (
    <>
      <div className="field-row">
        <label>{t.settings.onSuccess}</label>
        <select
          value={success?.type ?? 'close'}
          onChange={(e) => set(buildSuccess(e.target.value as SuccessType, success))}
        >
          {SUCCESS_TYPES.map((s) => <option key={s} value={s}>{t.enums.success[s]}</option>)}
        </select>
      </div>

      {success?.type === 'message' && <SuccessMessageFields success={success} onChange={set} />}

      {success?.type === 'redirect' && (
        <>
          <div className="field-row">
            <label>{t.settings.redirectUrl}</label>
            <input type="url" value={success.url} onChange={(e) => set({ ...success, url: e.target.value })} />
          </div>
          <div className="field-row inline">
            <input
              id="redirect-new-tab"
              type="checkbox"
              checked={success.newTab === true}
              onChange={(e) => set({ ...success, newTab: e.target.checked || undefined })}
            />
            <label htmlFor="redirect-new-tab" style={{ margin: 0 }}>{t.settings.redirectNewTab}</label>
          </div>
        </>
      )}
    </>
  );
}

/** The template picker and the fields the picked template actually reads. */
function SuccessMessageFields({
  success,
  onChange,
}: {
  success: SuccessMessage;
  onChange: (s: SubmitSuccess) => void;
}) {
  const t = useT();
  const template = success.template ?? 'simple';

  return (
    <>
      <div className="field-row">
        <label>{t.settings.messageTemplate}</label>
        <select
          value={template}
          onChange={(e) => onChange(buildTemplate(e.target.value as SuccessTemplate, success))}
        >
          {SUCCESS_TEMPLATES.map((tpl) => (
            <option key={tpl} value={tpl}>{t.enums.successTemplate[tpl]}</option>
          ))}
        </select>
        <span className="field-hint">{t.settings.messageTemplateHint[template]}</span>
      </div>

      <div className="field-grid">
        <div className="field-row">
          <label>{t.settings.successHeading}</label>
          <input
            type="text"
            value={success.heading ?? ''}
            placeholder={t.settings.successHeadingPlaceholder}
            onChange={(e) => onChange({ ...success, heading: e.target.value || undefined })}
          />
        </div>
        <div className="field-row">
          <label>{t.settings.successMessage}</label>
          <input
            type="text"
            value={success.text ?? ''}
            onChange={(e) => onChange({ ...success, text: e.target.value || undefined })}
          />
        </div>
      </div>

      {template === 'image' && (
        <div className="field-row">
          <label>{t.settings.successImageUrl}</label>
          <input
            type="url"
            value={success.imageUrl ?? ''}
            onChange={(e) => onChange({ ...success, imageUrl: e.target.value || undefined })}
          />
        </div>
      )}

      {template === 'illustration' && (
        <>
          <div className="field-row">
            <label>{t.settings.illustration}</label>
            <select
              value={success.illustration ?? 'check'}
              onChange={(e) => onChange({ ...success, illustration: e.target.value as SuccessIllustration })}
            >
              {SUCCESS_ILLUSTRATIONS.map((art) => (
                <option key={art} value={art}>{t.enums.illustration[art]}</option>
              ))}
            </select>
          </div>
          <div className="field-row inline">
            <input
              id="success-confetti"
              type="checkbox"
              checked={success.confetti === true}
              onChange={(e) => onChange({ ...success, confetti: e.target.checked || undefined })}
            />
            <label htmlFor="success-confetti" style={{ margin: 0 }}>{t.settings.addConfetti}</label>
          </div>
        </>
      )}

      {template === 'coupon' && (
        <>
          <div className="field-grid">
            <div className="field-row">
              <label>{t.settings.staticCode}</label>
              <input
                type="text"
                value={success.code ?? ''}
                onChange={(e) => onChange({ ...success, code: e.target.value || undefined })}
              />
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
          <div className="field-row inline">
            <input
              id="coupon-copyable"
              type="checkbox"
              checked={success.copyable !== false}
              onChange={(e) => onChange({ ...success, copyable: e.target.checked })}
            />
            <label htmlFor="coupon-copyable" style={{ margin: 0 }}>{t.settings.couponCopyable}</label>
          </div>
        </>
      )}
    </>
  );
}

function buildSuccess(type: SuccessType, prev?: SubmitSuccess): SubmitSuccess {
  const previous = normalizeSuccess(prev);
  switch (type) {
    case 'close':
      return { type: 'close' };
    case 'message':
      // Coming back to "message" restores whatever template was last authored.
      return previous?.type === 'message'
        ? previous
        : buildTemplate('simple', { type: 'message' });
    case 'redirect':
      return { type: 'redirect', url: previous?.type === 'redirect' ? previous.url : 'https://example.com/thanks' };
  }
}

/**
 * Switch templates without discarding the shopper-facing copy: heading and text
 * carry over, and only the fields the new template actually reads get seeded.
 */
function buildTemplate(template: SuccessTemplate, prev: SuccessMessage): SuccessMessage {
  const base: SuccessMessage = {
    type: 'message',
    template,
    heading: prev.heading ?? 'You’re all set!',
    text: prev.text,
    ...(prev.autoCloseMs ? { autoCloseMs: prev.autoCloseMs } : {}),
  };
  switch (template) {
    case 'simple':
      return { ...base, text: prev.text ?? 'Thanks — we’ve got your details.' };
    case 'image':
      return { ...base, imageUrl: prev.imageUrl ?? '' };
    case 'illustration':
      return {
        ...base,
        illustration: prev.illustration ?? 'check',
        ...(prev.confetti ? { confetti: true } : {}),
      };
    case 'coupon':
      return {
        ...base,
        text: prev.text ?? 'Use this code at checkout:',
        code: prev.code ?? 'SAVE10',
        ...(prev.codeFromResponsePath ? { codeFromResponsePath: prev.codeFromResponsePath } : {}),
        copyable: prev.copyable !== false,
      };
  }
}
