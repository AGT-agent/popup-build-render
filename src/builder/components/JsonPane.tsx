import { useEffect, useState } from 'react';
import { validatePopup, type PopupModal } from '@schema';

/**
 * "View JSON" button + modal. Pass `popup` to emit a single object, or `popups`
 * to emit an array (the multi-template handoff). Validation errors are counted
 * across whatever is passed.
 */
export function JsonPane({
  popup,
  popups,
  label = 'View JSON',
}: {
  popup?: PopupModal;
  popups?: PopupModal[];
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const isArray = popups !== undefined;
  const items = isArray ? popups : popup ? [popup] : [];
  const errorCount = items
    .flatMap((p) => validatePopup(p))
    .filter((i) => i.level === 'error').length;

  const value: PopupModal | PopupModal[] = isArray ? items : items[0];

  return (
    <>
      <button onClick={() => setOpen(true)}>
        {label}{errorCount > 0 ? ` · ${errorCount} error${errorCount === 1 ? '' : 's'}` : ''}
      </button>
      {open && <JsonModal items={items} value={value} onClose={() => setOpen(false)} />}
    </>
  );
}

function JsonModal({
  items,
  value,
  onClose,
}: {
  items: PopupModal[];
  value: PopupModal | PopupModal[];
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const json = JSON.stringify(value, null, 2);
  const issues = items.flatMap((p) => validatePopup(p));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="json-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="json-modal" role="dialog" aria-modal="true">
        <div className="json-modal-head">
          <strong>JSON</strong>
          <div className="btn-row">
            <button
              onClick={() => {
                navigator.clipboard?.writeText(json).catch(() => undefined);
                setCopied(true);
                setTimeout(() => setCopied(false), 1200);
              }}
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button className="ghost" onClick={onClose}>Close</button>
          </div>
        </div>
        <div className="json-modal-body">
          {issues.length > 0 && (
            <ul className="issues" style={{ marginBottom: 12 }}>
              {issues.map((iss, i) => (
                <li key={i} className={iss.level}>
                  <strong>{iss.path}</strong>: {iss.message}
                </li>
              ))}
            </ul>
          )}
          <div className="json-box">{json}</div>
        </div>
      </div>
    </div>
  );
}
