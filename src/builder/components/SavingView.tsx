import { useBuilderStore } from '../store';
import { JsonPane } from './JsonPane';

export function SavingView() {
  const popups = useBuilderStore((s) => s.popups);
  const select = useBuilderStore((s) => s.select);
  const activeIds = useBuilderStore((s) => s.activeIds);
  const singleMode = useBuilderStore((s) => s.singleMode);
  const toggleActive = useBuilderStore((s) => s.toggleActive);
  const clearActive = useBuilderStore((s) => s.clearActive);
  const setSingleMode = useBuilderStore((s) => s.setSingleMode);
  const createPopup = useBuilderStore((s) => s.createPopup);
  const removePopup = useBuilderStore((s) => s.removePopup);

  const activePopups = popups.filter((p) => activeIds.includes(p.id));

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

        {popups.map((p) => {
          const isActive = activeIds.includes(p.id);
          return (
            <div
              key={p.id}
              className={`template-row${isActive ? ' in-use' : ''}`}
              onClick={() => select(p.id)}
            >
              {/* Marking a row Active must not also open it in the editor. */}
              <label className="t-check" title="Mark this template Active" onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={() => toggleActive(p.id)}
                />
                Active
              </label>
              <div className="t-body">
                <div className="t-name">{p.name || 'Untitled'}</div>
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
          );
        })}

        {activePopups.length > 0 && (
          <div className="active-bar">
            <div className="t-body">
              <div className="t-name">
                {singleMode
                  ? `Using “${activePopups[0].name || 'Untitled'}”`
                  : `Using ${activePopups.length} template${activePopups.length === 1 ? '' : 's'}`}
              </div>
              <div className="t-meta">
                The JSON a host app gets from{' '}
                <code>{singleMode ? 'getActivePopup()' : 'getActivePopups()'}</code>.
              </div>
              <label className="t-check single-toggle" title="Export one JSON object instead of an array">
                <input
                  type="checkbox"
                  checked={singleMode}
                  onChange={(e) => setSingleMode(e.target.checked)}
                />
                Use just one (export a single JSON)
              </label>
            </div>
            <div className="btn-row">
              {singleMode ? (
                <JsonPane popup={activePopups[0]} label="Show JSON" />
              ) : (
                <JsonPane popups={activePopups} label="Show JSON" />
              )}
              <button className="ghost" onClick={clearActive}>Clear</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
