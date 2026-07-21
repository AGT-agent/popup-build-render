import { useState } from 'react';
import { validatePopup, type PopupModal } from '@schema';

export function JsonPane({ popup }: { popup: PopupModal }) {
  const [copied, setCopied] = useState(false);
  const json = JSON.stringify(popup, null, 2);
  const issues = validatePopup(popup);

  return (
    <div>
      <div className="toolbar" style={{ marginBottom: 8 }}>
        <span className="pill">JSON</span>
        <button
          onClick={() => {
            navigator.clipboard?.writeText(json).catch(() => undefined);
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
          }}
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      {issues.length > 0 && (
        <ul className="issues" style={{ marginBottom: 8 }}>
          {issues.map((iss, i) => (
            <li key={i} className={iss.level}>
              <strong>{iss.path}</strong>: {iss.message}
            </li>
          ))}
        </ul>
      )}

      <div className="json-box">{json}</div>
    </div>
  );
}
