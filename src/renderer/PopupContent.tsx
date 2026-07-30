import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import {
  designUsesImage,
  normalizeSuccess,
  type ContentItem,
  type PopupModal,
  type StyleProps,
  type SuccessIllustration,
} from '@schema';
import { firstInvalidEmail, firstMissingRequired, submitPopup, type FormValues, type SubmitOutcome } from './submit';
import { ensureStyles } from './styles';

export interface PopupContentProps {
  popup: PopupModal;
  /** Called when the popup requests to close (X, overlay, esc, auto-close). */
  onClose?: () => void;
  /** Injectable fetch — the builder passes a mock so preview submits never hit a real API. */
  fetchImpl?: typeof fetch;
  /** Preview mode: renders the form frame but blocks real navigation on redirect. */
  preview?: boolean;
}

function toStyle(sp?: StyleProps): CSSProperties {
  return {
    textAlign: sp?.align ?? 'center',
    ...(sp?.color ? { color: sp.color } : {}),
    ...(sp?.backgroundColor ? { backgroundColor: sp.backgroundColor } : {}),
  };
}

/**
 * `form.error` is a client-side validation miss — it stays inline under the
 * still-visible form so the shopper can fix the field. `error` is a failed
 * submit (the popup's `onError`), which takes over the body the way a success
 * screen does, with a way back to the filled-in form.
 */
type Phase =
  | { kind: 'form'; error?: string }
  | { kind: 'error'; text: string }
  | { kind: 'success'; outcome: SubmitOutcome };

/**
 * The pure "renderer" half: turns a PopupModal into DOM. Knows nothing about
 * triggers, frequency, or how it got mounted — that is the mount layer's job.
 */
export function PopupContent({ popup, onClose, fetchImpl, preview }: PopupContentProps) {
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
      setPhase({ kind: 'form', error: 'Please fill in the required fields.' });
      return;
    }
    const badEmail = firstInvalidEmail(popup, values);
    if (badEmail) {
      setPhase({ kind: 'form', error: 'Please enter a valid email address.' });
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
      // New tab: this page stays put, so hand off the tab and close the popup.
      // Same tab: navigation replaces the page; show "Redirecting…" until it does.
      if (success.newTab) {
        if (!preview) window.open(success.url, '_blank');
        onClose?.();
        return;
      }
      if (!preview) window.location.assign(success.url);
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
    const style = toStyle(item.styleProps);
    switch (item.type) {
      case 'heading':
        return <h2 key={item.id} className="pm-heading" style={style}>{item.value}</h2>;
      case 'text':
        return <p key={item.id} className="pm-text" style={style}>{item.value}</p>;
      case 'spacer':
        return <div key={item.id} className="pm-spacer" style={{ height: item.height ?? 16 }} aria-hidden />;
      case 'email':
        return (
          <label key={item.id} className="pm-field" style={style}>
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
          <label key={item.id} className="pm-field" style={style}>
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
          <label key={item.id} className="pm-checkbox" style={style}>
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
          <fieldset key={item.id} className="pm-field" style={{ ...style, border: 'none', padding: 0, margin: 0 }}>
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
          <button key={item.id} className="pm-submit" style={style} disabled={submitting} onClick={handleSubmit}>
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

  const successMessage = phase.kind === 'success' ? normalizeSuccess(phase.outcome.success) : undefined;
  // The burst is a property of the success screen, so it only starts once the
  // form has actually succeeded.
  const showConfetti = successMessage?.type === 'message' && successMessage.confetti === true;

  const successIsImage =
    successMessage?.type === 'message' && (successMessage.template ?? 'simple') === 'image';
  const successImageUrl = successMessage?.type === 'message' ? successMessage.imageUrl : undefined;

  // The image designs already have a picture slot, so the success photo takes
  // that over rather than stacking a second image inside the body. `basic` has
  // no such slot, so there it stays a band across the top of the body — which
  // only works if the body stops padding its children.
  const photoInMedia = successIsImage && usesImage;
  const flush = successIsImage && !usesImage;
  const mediaUrl = (photoInMedia && successImageUrl) || popup.imageUrl;

  const media = usesImage && mediaUrl ? (
    <div className="pm-media" style={{ backgroundImage: `url(${mediaUrl})` }} aria-hidden />
  ) : null;

  const body = (
    <div className={`pm-body${flush ? ' pm-body-flush' : ''}`}>
      {renderPhaseBody(phase, items, renderItem, onClose, photoInMedia, () => setPhase({ kind: 'form' }))}
    </div>
  );

  return (
    <>
      {showConfetti && <Confetti />}
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
    </>
  );
}

function renderPhaseBody(
  phase: Phase,
  items: ContentItem[],
  renderItem: (item: ContentItem) => JSX.Element | null,
  onClose?: () => void,
  photoInMedia?: boolean,
  onRetry?: () => void,
) {
  if (phase.kind === 'success') {
    return <SuccessView outcome={phase.outcome} onClose={onClose} photoInMedia={photoInMedia} />;
  }
  if (phase.kind === 'error') {
    return <ErrorView text={phase.text} onRetry={onRetry} />;
  }
  return (
    <>
      {items.map(renderItem)}
      {phase.error && <p className="pm-error">{phase.error}</p>}
    </>
  );
}

/**
 * A failed submit, drawn as the mirror image of the `check` illustration —
 * same disc, same geometry, red cross instead of a green tick. The form is left
 * intact behind it, so "Try again" returns the shopper to what they typed.
 */
function ErrorView({ text, onRetry }: { text: string; onRetry?: () => void }) {
  return (
    <div className="pm-success pm-error-screen">
      <div className="pm-success-stack">
        <div className="pm-success-art">{ERROR_ART}</div>
        <p className="pm-success-text">{text}</p>
      </div>
      <button className="pm-submit pm-success-done" onClick={() => onRetry?.()}>Try again</button>
    </div>
  );
}

function SuccessView({
  outcome,
  onClose,
  photoInMedia,
}: {
  outcome: SubmitOutcome;
  onClose?: () => void;
  /** The design's own image slot is showing the success photo, so don't draw it here too. */
  photoInMedia?: boolean;
}) {
  const success = normalizeSuccess(outcome.success);
  const [copied, setCopied] = useState(false);
  if (!success) return null;

  if (success.type === 'redirect') {
    return <p className="pm-text" style={{ textAlign: 'center' }}>Redirecting…</p>;
  }
  if (success.type !== 'message') return null;

  const template = success.template ?? 'simple';
  const code = outcome.couponCode ?? success.code;

  const copy = (
    <>
      {success.heading && <h2 className="pm-success-heading">{success.heading}</h2>}
      {success.text && <p className="pm-success-text">{success.text}</p>}
    </>
  );
  const done = <button className="pm-submit pm-success-done" onClick={() => onClose?.()}>Done</button>;

  // The image template is laid out rather than stacked: the photo spans the top
  // two thirds of the message area edge to edge, the copy and button share the
  // bottom third. Its own root because none of the centred-stack rules apply.
  // When the photo has taken over the design's image slot instead, this branch
  // is skipped and the copy falls through to the ordinary centred stack.
  if (template === 'image' && !photoInMedia) {
    return (
      <div className="pm-success pm-success-image">
        {success.imageUrl && <img className="pm-success-photo" src={success.imageUrl} alt="" />}
        <div className="pm-success-panel">
          {copy}
          {done}
        </div>
      </div>
    );
  }

  // The art and copy ride in their own stack so it can absorb the card's spare
  // height and centre inside it, leaving Done on the bottom edge — the same
  // place the form's submit button sits, so the two phases line up.
  return (
    <div className={`pm-success pm-success-${template}`}>
      <div className="pm-success-stack">
        {template === 'illustration' && (
          <div className="pm-success-art">{illustrationSvg(success.illustration ?? 'check')}</div>
        )}
        {/* Simple and coupon carry a small confirmation badge instead of full art —
            enough to read as "designed" without competing with the code itself. */}
        {(template === 'simple' || template === 'coupon') && (
          <div className="pm-success-badge" aria-hidden>{CHECK_MARK}</div>
        )}

        {copy}

        {template === 'coupon' && code && (
          <div className="pm-coupon">
            <span className="pm-coupon-code">{code}</span>
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
      </div>

      {done}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Confetti — the optional celebration burst that rains over the whole popup
// when the success screen appears. Rendered as a sibling of the card so it
// covers the overlay rather than being clipped by the card's `overflow: hidden`.
// ---------------------------------------------------------------------------

const CONFETTI_COLORS = ['#FB7185', '#F472B6', '#FBBF24', '#34D399', '#6366F1', '#2DD4BF'];
const CONFETTI_COUNT = 44;

/**
 * Deterministic 0..1 scatter from a piece index. A hash rather than
 * `Math.random` so a re-render (a copy click, say) doesn't reshuffle mid-fall.
 */
function scatter(i: number, salt: number): number {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
        left: scatter(i, 1) * 100,
        delay: scatter(i, 2) * 1.1,
        duration: 2.4 + scatter(i, 3) * 1.8,
        drift: (scatter(i, 4) - 0.5) * 140,
        spin: 320 + scatter(i, 5) * 700,
        size: 6 + scatter(i, 6) * 5,
        round: i % 3 === 0,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      })),
    [],
  );

  return (
    <div className="pm-confetti" aria-hidden>
      {pieces.map((p, i) => (
        <span
          key={i}
          className={`pm-confetti-piece${p.round ? ' pm-confetti-round' : ''}`}
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.round ? p.size : p.size * 1.7,
            background: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            ...({ '--pm-drift': `${p.drift}px`, '--pm-spin': `${p.spin}deg` } as CSSProperties),
          }}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Built-in illustrations. Inline SVG rather than hosted assets so the renderer
// stays a single self-contained bundle. `envelope` strokes in `currentColor` so
// it sits correctly on a light card or an `image-behind` dark overlay; the
// colored pieces carry their own palette on a tinted disc instead.
// ---------------------------------------------------------------------------

const CHECK_MARK = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12.5 10 17.5 19 7" />
  </svg>
);

/** The tinted disc every illustration sits on — also what keeps the colored ones legible on a dark card. */
const ART_DISC = <circle cx="60" cy="60" r="52" fill="#EDE9FE" />;

/**
 * The failed-submit counterpart to the `check` illustration: identical disc and
 * circle geometry, a rose palette in place of the emerald one, and a cross for
 * the tick. The scattered confetti dots the checkmark carries are dropped —
 * they read as celebration, which is the wrong note on an error.
 */
const ERROR_ART = (
  <svg viewBox="0 0 120 120" fill="none">
    <circle cx="60" cy="60" r="52" fill="#FFE4E6" />
    <circle cx="60" cy="58" r="30" fill="#F43F5E" />
    <path
      d="M49 47 71 69M71 47 49 69"
      stroke="#fff"
      strokeWidth="7.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

function illustrationSvg(kind: SuccessIllustration): JSX.Element {
  switch (kind) {
    // Flat shapes, oversized limbs, no facial features. Like the other colored
    // pieces it brings its own palette instead of `currentColor`, so it must
    // stay legible on a white card and on the image-behind overlay alike —
    // hence the light disc they all sit on.
    case 'celebration':
      return (
        <svg viewBox="0 0 120 120" fill="none">
          {ART_DISC}
          {/* Confetti, kept clear of the figure. */}
          <circle cx="38" cy="24" r="3" fill="#FB7185" />
          <circle cx="84" cy="26" r="3.5" fill="#F472B6" />
          <circle cx="24" cy="70" r="3" fill="#6366F1" />
          <circle cx="98" cy="84" r="2.5" fill="#34D399" />
          <rect x="24" y="50" width="7" height="7" rx="2" fill="#FBBF24" transform="rotate(22 27.5 53.5)" />
          <rect x="90" y="56" width="7" height="7" rx="2" fill="#2DD4BF" transform="rotate(-28 93.5 59.5)" />
          <rect x="93" y="38" width="6" height="6" rx="2" fill="#FBBF24" transform="rotate(14 96 41)" />
          <path d="M20 38q5-6 10 0" stroke="#F472B6" strokeWidth="3" strokeLinecap="round" />
          <path d="M99 66q5-6 10 0" stroke="#6366F1" strokeWidth="3" strokeLinecap="round" />
          {/* Arms thrown up, then legs — both go under the dress. */}
          <path d="M50 58L32 34M70 58L88 34" stroke="#F0A874" strokeWidth="7.5" strokeLinecap="round" />
          <circle cx="32" cy="34" r="4.5" fill="#F0A874" />
          <circle cx="88" cy="34" r="4.5" fill="#F0A874" />
          <path d="M54 80v18M66 80v18" stroke="#F0A874" strokeWidth="7.5" strokeLinecap="round" />
          <ellipse cx="52" cy="101" rx="6.5" ry="3.5" fill="#312E81" />
          <ellipse cx="68" cy="101" rx="6.5" ry="3.5" fill="#312E81" />
          {/* Dress, with sleeve caps covering the shoulder joints. */}
          <path d="M48 55q12-5 24 0l6 27q-18 6-36 0z" fill="#FB7185" />
          <circle cx="49" cy="58" r="5.5" fill="#FB7185" />
          <circle cx="71" cy="58" r="5.5" fill="#FB7185" />
          {/* Neck, hair, face, bun. */}
          <rect x="56.5" y="46" width="7" height="6" fill="#F0A874" />
          <circle cx="60" cy="38" r="10" fill="#312E81" />
          <circle cx="60" cy="40" r="8" fill="#F0A874" />
          <circle cx="60" cy="26" r="4.5" fill="#312E81" />
        </svg>
      );
    case 'gift':
      return (
        <svg viewBox="0 0 120 120" fill="none">
          {ART_DISC}
          <circle cx="24" cy="46" r="3.5" fill="#FBBF24" />
          <circle cx="98" cy="42" r="3" fill="#34D399" />
          <circle cx="28" cy="86" r="2.5" fill="#F472B6" />
          {/* Bow first, so the lid overlaps where the loops meet the box. */}
          <path d="M60 43c-7-13-23-12-23-3 0 6 11 6 23 3zM60 43c7-13 23-12 23-3 0 6-11 6-23 3z" fill="#FBBF24" />
          <rect x="32" y="56" width="56" height="42" rx="5" fill="#6366F1" />
          <rect x="27" y="42" width="66" height="16" rx="5" fill="#4F46E5" />
          <rect x="53" y="42" width="14" height="56" fill="#FBBF24" />
        </svg>
      );
    case 'envelope':
      return (
        <svg viewBox="0 0 120 120" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
          <circle className="pm-art-disc" cx="60" cy="60" r="52" stroke="none" />
          <rect x="26" y="38" width="68" height="46" rx="7" />
          <path d="m26 46 30 22a7 7 0 0 0 8 0l30-22" />
        </svg>
      );
    case 'check':
    default:
      return (
        <svg viewBox="0 0 120 120" fill="none">
          {ART_DISC}
          <circle cx="26" cy="40" r="3.5" fill="#FBBF24" />
          <circle cx="97" cy="76" r="3" fill="#6366F1" />
          <circle cx="32" cy="88" r="2.5" fill="#F472B6" />
          <rect x="88" y="30" width="7" height="7" rx="2" fill="#FB7185" transform="rotate(20 91.5 33.5)" />
          <circle cx="60" cy="58" r="30" fill="#34D399" />
          <path d="M47 58 56 68 74 46" stroke="#fff" strokeWidth="7.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
  }
}
