import { useEffect, useState } from 'react';
import { validatePopup, type PopupModal } from '@schema';

export function JsonPane({ popup }: { popup: PopupModal }) {
  const [open, setOpen] = useState(false);
  const issues = validatePopup(popup);
  const errorCount = issues.filter((i) => i.level === 'error').length;

  return (
    <>
      <button onClick={() => setOpen(true)}>
        View JSON{errorCount > 0 ? ` · ${errorCount} error${errorCount === 1 ? '' : 's'}` : ''}
      </button>
      {open && <JsonModal popup={popup} onClose={() => setOpen(false)} />}
    </>
  );
}

function JsonModal({ popup, onClose }: { popup: PopupModal; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const json = JSON.stringify(popup, null, 2);
  const issues = validatePopup(popup);

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
