import { useBuilderStore } from '../store';
import { JsonPane } from './JsonPane';

export function SavingView() {
  const popups = useBuilderStore((s) => s.popups);
  const select = useBuilderStore((s) => s.select);
  const activeId = useBuilderStore((s) => s.activeId);
  const setActive = useBuilderStore((s) => s.setActive);
  const createPopup = useBuilderStore((s) => s.createPopup);
  const removePopup = useBuilderStore((s) => s.removePopup);

  const active = popups.find((p) => p.id === activeId) ?? null;

  return (
    <div className="saving-view">
      <div className="saving-inner">
        <div className="head">
          <h1>Popup Builder</h1>
          <div className="btn-row">
            <button className="primary" onClick={() => createPopup(false)}>+ New popup</button>
            <button onClick={() => createPopup(true)}>Example</button>
          </div>
        </div>
        <p className="sub">{popups.length} saved template{popups.length === 1 ? '' : 's'}</p>

        {popups.length === 0 && <p className="empty">No templates yet — create one to get started.</p>}

        {popups.map((p) => (
          <div
            key={p.id}
            className={`template-row${p.id === activeId ? ' in-use' : ''}`}
            onClick={() => select(p.id)}
          >
            {/* Marking a row "in use" must not also open it in the editor. */}
            <label className="t-radio" title="Use this template" onClick={(e) => e.stopPropagation()}>
              <input
                type="radio"
                name="active-popup"
                checked={p.id === activeId}
                onChange={() => setActive(p.id)}
              />
            </label>
            <div className="t-body">
              <div className="t-name">
                {p.name || 'Untitled'}
                {p.id === activeId && <span className="t-badge">In use</span>}
              </div>
              <div className="t-meta">{p.design} · {p.trigger.type} · {p.contentItems.length} items</div>
            </div>
            <div className="t-actions">
              <button
                className="danger"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Delete "${p.name || 'Untitled'}"?`)) removePopup(p.id);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}

        {active && (
          <div className="active-bar">
            <div className="t-body">
              <div className="t-name">Using “{active.name || 'Untitled'}”</div>
              <div className="t-meta">The JSON a host app gets from <code>getActivePopup()</code>.</div>
            </div>
            <div className="btn-row">
              <JsonPane popup={active} label="Show JSON" />
              <button className="ghost" onClick={() => setActive(null)}>Clear</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
