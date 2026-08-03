import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { designUsesImage, type ContentItem, type PopupModal, type StyleProps } from '@schema';
import { appendValuesToUrl, firstInvalidEmail, firstMissingRequired, submitPopup, type FormValues, type SubmitOutcome } from './submit';
import { ensureStyles } from './styles';

export interface PopupContentProps {
  popup: PopupModal;
  /** Called when the popup requests to close (X, overlay, esc, auto-close). */
  onClose?: () => void;
  /** Injectable fetch — the builder passes a mock so preview submits never hit a real API. */
  fetchImpl?: typeof fetch;
  /** Preview mode: renders the form frame but blocks real navigation on redirect. */
  preview?: boolean;
  /**
   * Preview-only: fired with a content item's id when its rendered element is
   * clicked, so the builder can reveal that item's editor. Ignored in production.
   */
  onItemActivate?: (id: string) => void;
}

// `forceAlign` overrides the item's own align: submit buttons are always
// centered, and input labels always sit at the reading-direction start
// (left in LTR, right in RTL) — never centered.
function toStyle(sp?: StyleProps, forceAlign?: CSSProperties['textAlign']): CSSProperties {
  return {
    textAlign: forceAlign ?? sp?.align ?? 'center',
    ...(sp?.color ? { color: sp.color } : {}),
    ...(sp?.backgroundColor ? { backgroundColor: sp.backgroundColor } : {}),
  };
}

type Phase =
  | { kind: 'form' }
  | { kind: 'error'; text: string }
  | { kind: 'success'; outcome: SubmitOutcome };

/**
 * The pure "renderer" half: turns a PopupModal into DOM. Knows nothing about
 * triggers, frequency, or how it got mounted — that is the mount layer's job.
 */
export function PopupContent({ popup, onClose, fetchImpl, preview, onItemActivate }: PopupContentProps) {
  const [values, setValues] = useState<FormValues>({});
  const [phase, setPhase] = useState<Phase>({ kind: 'form' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => ensureStyles(), []);

  const items = useMemo(
    () => [...popup.contentItems].sort((a, b) => a.order - b.order),
    [popup.contentItems],
  );

  const setValue = (id: string, v: string | boolean) => setValues((prev) => ({ ...prev, [id]: v }));

  async function handleSubmit() {
    const missing = firstMissingRequired(popup, values);
    if (missing) {
      setPhase({ kind: 'error', text: 'Please fill in the required fields.' });
      return;
    }
    const badEmail = firstInvalidEmail(popup, values);
    if (badEmail) {
      setPhase({ kind: 'error', text: 'Please enter a valid email address.' });
      return;
    }
    setSubmitting(true);
    const outcome = await submitPopup(popup, values, fetchImpl);
    setSubmitting(false);

    if (!outcome.ok) {
      setPhase({ kind: 'error', text: outcome.error?.text ?? 'Something went wrong.' });
      return;
    }
    const success = outcome.success ?? { type: 'close' };
    if (success.type === 'close') {
      onClose?.();
      return;
    }
    if (success.type === 'redirect') {
      // Optionally carry the submitted values to the destination so it can
      // personalize (e.g. a thank-you page greeting the visitor by name).
      const url = success.forwardValues ? appendValuesToUrl(popup, values, success.url) : success.url;
      if (!preview) {
        if (success.newTab) window.open(url, '_blank');
        else window.location.assign(url);
      }
      setPhase({ kind: 'success', outcome });
      return;
    }
    setPhase({ kind: 'success', outcome });
  }

  // Auto-close for success "message" with autoCloseMs.
  useEffect(() => {
    if (phase.kind !== 'success') return;
    const s = phase.outcome.success;
    if (s?.type === 'message' && s.autoCloseMs) {
      const t = setTimeout(() => onClose?.(), s.autoCloseMs);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [phase, onClose]);

  function renderItem(item: ContentItem) {
    const style = toStyle(item.styleProps); // heading / text — respects global alignment
    const fieldStyle = toStyle(item.styleProps, 'start'); // input labels — left/right by direction
    const buttonStyle = toStyle(item.styleProps, 'center'); // submit button — always centered
    switch (item.type) {
      case 'heading':
        return <h2 key={item.id} data-pm-item={item.id} className="pm-heading" style={style}>{item.value}</h2>;
      case 'text':
        return <p key={item.id} data-pm-item={item.id} className="pm-text" style={style}>{item.value}</p>;
      case 'spacer':
        return <div key={item.id} data-pm-item={item.id} className="pm-spacer" style={{ height: item.height ?? 16 }} aria-hidden />;
      case 'email':
        return (
          <label key={item.id} data-pm-item={item.id} className="pm-field" style={fieldStyle}>
            {item.value && <span>{item.value}{item.required ? ' *' : ''}</span>}
            <input
              type="email"
              placeholder={item.placeholder ?? item.value}
              value={(values[item.id] as string) ?? ''}
              onChange={(e) => setValue(item.id, e.target.value)}
            />
          </label>
        );
      case 'free-text-input':
        return (
          <label key={item.id} data-pm-item={item.id} className="pm-field" style={fieldStyle}>
            {item.value && <span>{item.value}{item.required ? ' *' : ''}</span>}
            <input
              type="text"
              placeholder={item.placeholder ?? item.value}
              value={(values[item.id] as string) ?? ''}
              onChange={(e) => setValue(item.id, e.target.value)}
            />
          </label>
        );
      case 'checkbox':
        return (
          <label key={item.id} data-pm-item={item.id} className="pm-checkbox" style={fieldStyle}>
            <input
              type="checkbox"
              checked={Boolean(values[item.id])}
              onChange={(e) => setValue(item.id, e.target.checked)}
            />
            <span>{item.value}{item.required ? ' *' : ''}</span>
          </label>
        );
      case 'radio':
        return (
          <fieldset key={item.id} data-pm-item={item.id} className="pm-field" style={{ ...fieldStyle, border: 'none', padding: 0, margin: 0 }}>
            {item.value && <span>{item.value}</span>}
            <div className="pm-radio-group">
              {(item.options ?? []).map((opt) => (
                <label key={opt.value} className="pm-radio-option">
                  <input
                    type="radio"
                    name={item.id}
                    value={opt.value}
                    checked={values[item.id] === opt.value}
                    onChange={() => setValue(item.id, opt.value)}
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
        );
      case 'submit-button':
        return (
          <button key={item.id} data-pm-item={item.id} className="pm-submit" style={buttonStyle} disabled={submitting} onClick={handleSubmit}>
            {submitting ? 'Submitting…' : item.value}
          </button>
        );
      default:
        return null;
    }
  }

  const usesImage = designUsesImage(popup.design);
  // Only the side-by-side layouts get the wider card; image-behind stays basic width.
  const sideBySide = popup.design === 'image-left' || popup.design === 'image-right';
  const layoutClass = `pm-layout pm-${popup.design}`;

  const media = usesImage && popup.imageUrl ? (
    <div className="pm-media" style={{ backgroundImage: `url(${popup.imageUrl})` }} aria-hidden />
  ) : null;

  const body = (
    <div
      className={`pm-body${onItemActivate ? ' pm-body--interactive' : ''}`}
      // Preview-only: surface which content item was clicked so the builder can
      // reveal its editor. Capture phase so it fires even for inputs/buttons
      // without swallowing their own click behaviour.
      onClickCapture={
        onItemActivate
          ? (e) => {
              const el = (e.target as HTMLElement).closest<HTMLElement>('[data-pm-item]');
              const id = el?.getAttribute('data-pm-item');
              if (id) onItemActivate(id);
            }
          : undefined
      }
    >
      {renderPhaseBody(phase, items, renderItem, onClose)}
    </div>
  );

  return (
    <div
      className={`pm-card${sideBySide ? ' pm-has-image' : ''}`}
      role="dialog"
      aria-modal="true"
      // Explicit so the popup keeps its own direction regardless of the host
      // page (or builder chrome) it's rendered inside.
      dir={popup.direction ?? 'ltr'}
      style={popup.borderRadius != null ? { borderRadius: popup.borderRadius } : undefined}
    >
      {popup.dismissible !== false && (
        <button className="pm-close" aria-label="Close" onClick={() => onClose?.()}>×</button>
      )}
      {usesImage ? (
        <div className={layoutClass}>
          {media}
          {body}
        </div>
      ) : (
        body
      )}
    </div>
  );
}

function renderPhaseBody(
  phase: Phase,
  items: ContentItem[],
  renderItem: (item: ContentItem) => JSX.Element | null,
  onClose?: () => void,
) {
  if (phase.kind === 'success') {
    return <SuccessView outcome={phase.outcome} onClose={onClose} />;
  }
  return (
    <>
      {items.map(renderItem)}
      {phase.kind === 'error' && <p className="pm-error">{phase.text}</p>}
    </>
  );
}

function SuccessView({ outcome, onClose }: { outcome: SubmitOutcome; onClose?: () => void }) {
  const success = outcome.success;
  const [copied, setCopied] = useState(false);
  if (!success) return null;

  if (success.type === 'message') {
    return <p className="pm-text" style={{ textAlign: 'center' }}>{success.text}</p>;
  }
  if (success.type === 'redirect') {
    return <p className="pm-text" style={{ textAlign: 'center' }}>Redirecting…</p>;
  }
  if (success.type === 'coupon') {
    const code = outcome.couponCode ?? success.code;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'center' }}>
        {success.text && <p className="pm-text">{success.text}</p>}
        {code && (
          <div className="pm-coupon-code">
            <span>{code}</span>
            {success.copyable !== false && (
              <button
                className="pm-copy"
                onClick={() => {
                  navigator.clipboard?.writeText(code).catch(() => undefined);
                  setCopied(true);
                }}
              >
                {copied ? 'Copied' : 'Copy'}
              </button>
            )}
          </div>
        )}
        <button className="pm-submit" onClick={() => onClose?.()}>Done</button>
      </div>
    );
  }
  return null;
}
